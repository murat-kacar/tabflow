using System.Security.Cryptography;
using System.Text.Json;
using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Yenicafe.Platform.Data;

namespace Yenicafe.Platform.Tenants;

public sealed class ProvisioningService(
    PlatformDbContext db,
    IConfiguration configuration)
{
    public async Task<int> ProcessPendingJobsAsync(CancellationToken cancellationToken)
    {
        var options = ReadOptions();
        var claimedJobIds = await ClaimJobsAsync(options, cancellationToken);
        if (claimedJobIds.Count == 0)
        {
            return 0;
        }

        var pendingJobs = await db.ProvisionJobs
            .Include(job => job.Tenant)
            .ThenInclude(tenant => tenant!.Domains)
            .Where(job => claimedJobIds.Contains(job.Id))
            .OrderBy(job => job.CreatedAt)
            .ToListAsync(cancellationToken);

        var processed = 0;

        foreach (var job in pendingJobs)
        {
            if (job.Type != "tenant.create" || job.Tenant is null)
            {
                continue;
            }

            await ProcessTenantCreateJobAsync(job, options, cancellationToken);
            processed++;
        }

        return processed;
    }

    private async Task<IReadOnlyList<Guid>> ClaimJobsAsync(
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var leaseUntil = now.AddSeconds(options.LeaseSeconds);
        var ids = new List<Guid>();
        var connection = db.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;

        if (shouldClose)
        {
            await db.Database.OpenConnectionAsync(cancellationToken);
        }

        try
        {
            await using var command = connection.CreateCommand();
            command.CommandText = """
            WITH claimed AS (
                SELECT id
                FROM platform_provision_jobs
                WHERE type = 'tenant.create'
                  AND attempt_count < @max_attempts
                  AND (
                      status = 'pending'::provision_job_status
                      OR (
                          status = 'failed'::provision_job_status
                          AND (next_attempt_at IS NULL OR next_attempt_at <= @now)
                      )
                      OR (
                          status = 'running'::provision_job_status
                          AND lease_until IS NOT NULL
                          AND lease_until <= @now
                      )
                  )
                ORDER BY created_at
                LIMIT @batch_size
                FOR UPDATE SKIP LOCKED
            )
            UPDATE platform_provision_jobs
            SET status = 'running'::provision_job_status,
                attempt_count = attempt_count + 1,
                worker_id = @worker_id,
                lease_until = @lease_until,
                next_attempt_at = NULL,
                started_at = COALESCE(started_at, @now),
                completed_at = NULL,
                current_step = 'allocating_runtime',
                updated_at = @now
            WHERE id IN (SELECT id FROM claimed)
            RETURNING id
            """;

            AddParameter(command, "@worker_id", options.WorkerId);
            AddParameter(command, "@lease_until", leaseUntil);
            AddParameter(command, "@now", now);
            AddParameter(command, "@max_attempts", options.MaxAttempts);
            AddParameter(command, "@batch_size", 5);

            if (db.Database.CurrentTransaction is not null)
            {
                command.Transaction = db.Database.CurrentTransaction.GetDbTransaction();
            }

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                ids.Add(reader.GetGuid(0));
            }
        }
        finally
        {
            if (shouldClose)
            {
                await db.Database.CloseConnectionAsync();
            }
        }

        return ids;
    }

    private static void AddParameter(IDbCommand command, string name, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }

    private async Task ProcessTenantCreateJobAsync(
        ProvisionJob job,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var tenant = job.Tenant ?? throw new InvalidOperationException("Provisioning job tenant is missing.");

        try
        {
            var runtime = await AllocateRuntimeAsync(job, tenant, options, cancellationToken);
            UpdateStep(job, "writing_runtime_artifacts");
            await db.SaveChangesAsync(cancellationToken);

            var artifacts = await WriteArtifactsAsync(tenant, runtime, options, cancellationToken);

            if (tenant.Status != TenantStatus.Active)
            {
                tenant.Status = TenantStatus.Provisioning;
            }
            tenant.UpdatedAt = DateTimeOffset.UtcNow;
            job.Status = ProvisionJobStatus.Succeeded;
            job.CurrentStep = "artifacts_ready";
            job.ResultJson = JsonSerializer.Serialize(new
            {
                runtime.TenantBaseUrl,
                runtime.DatabaseName,
                runtime.DatabaseUser,
                runtime.BackendPort,
                runtime.WebPort,
                RuntimeHealth = new
                {
                    Internal = new
                    {
                        Status = "not_checked",
                        HealthUrl = $"http://127.0.0.1:{runtime.BackendPort}/health/live"
                    },
                    External = new
                    {
                        Status = "not_checked",
                        HealthUrl = $"{runtime.TenantBaseUrl}/health/live"
                    }
                },
                Artifacts = artifacts
            });
            job.CompletedAt = DateTimeOffset.UtcNow;
            job.ErrorMessage = null;
            job.WorkerId = null;
            job.LeaseUntil = null;
            job.NextAttemptAt = null;
            job.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            var now = DateTimeOffset.UtcNow;
            var terminalFailure = job.AttemptCount >= options.MaxAttempts;
            job.Status = ProvisionJobStatus.Failed;
            job.ErrorMessage = exception.Message;
            job.CompletedAt = now;
            job.CurrentStep = terminalFailure ? "failed" : "retry_scheduled";
            job.WorkerId = null;
            job.LeaseUntil = null;
            job.NextAttemptAt = terminalFailure
                ? null
                : now.AddSeconds(options.RetryDelaySeconds * Math.Max(1, job.AttemptCount));
            job.UpdatedAt = now;
            tenant.Status = terminalFailure ? TenantStatus.Suspended : TenantStatus.Provisioning;
            tenant.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static void UpdateStep(ProvisionJob job, string step)
    {
        job.CurrentStep = step;
        job.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private async Task<ProvisionedRuntime> AllocateRuntimeAsync(
        ProvisionJob job,
        Tenant tenant,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        UpdateStep(job, "allocating_ports");

        var existingJobs = await db.ProvisionJobs
            .AsNoTracking()
            .Where(job => job.Type == "tenant.create" && job.ResultJson != "{}")
            .Select(job => job.ResultJson)
            .ToListAsync(cancellationToken);

        var usedBackendPorts = new HashSet<int>();
        var usedWebPorts = new HashSet<int>();

        foreach (var json in existingJobs)
        {
            try
            {
                using var document = JsonDocument.Parse(json);
                if (document.RootElement.TryGetProperty("BackendPort", out var backendPortElement))
                {
                    usedBackendPorts.Add(backendPortElement.GetInt32());
                }
                if (document.RootElement.TryGetProperty("WebPort", out var webPortElement))
                {
                    usedWebPorts.Add(webPortElement.GetInt32());
                }
            }
            catch
            {
                // Ignore malformed historical rows.
            }
        }

        var backendPort = FindAvailablePort(options.TenantBackendPortStart, usedBackendPorts);
        var webPort = FindAvailablePort(options.TenantWebPortStart, usedWebPorts);
        var primaryDomain = tenant.Domains.First(domain => domain.IsPrimary).Host;

        return new ProvisionedRuntime(
            DatabaseName: $"yenicafe_tenant_{tenant.Code}",
            DatabaseUser: $"yenicafe_{tenant.Code}",
            DatabasePassword: GenerateSecret(),
            SessionSecret: GenerateSecret(48),
            TenantBaseUrl: $"https://{primaryDomain}",
            BackendPort: backendPort,
            WebPort: webPort);
    }

    private static async Task<object> WriteArtifactsAsync(
        Tenant tenant,
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var outputRoot = Path.GetFullPath(options.OutputRoot);
        var tenantRoot = Path.Combine(outputRoot, "tenants", tenant.Code);
        var firmwareRoot = Path.Combine(tenantRoot, "firmware");

        Directory.CreateDirectory(tenantRoot);
        Directory.CreateDirectory(firmwareRoot);

        var deviceSeeds = new List<object>();

        var configFiles = new List<string>();
        for (var tableId = 1; tableId <= options.InitialTableCount; tableId++)
        {
            var directory = Path.Combine(firmwareRoot, $"masa{tableId:000}");
            Directory.CreateDirectory(directory);
            var filePath = Path.Combine(directory, "config.h");
            var deviceKey = $"{tenant.Code}-masa{tableId:000}-{Guid.NewGuid():N}"[..36];
            deviceSeeds.Add(new
            {
                tableNumber = tableId,
                deviceKey
            });
            var content = $$"""
            #pragma once
            #define BACKEND_HOST "{{tenant.Domains.First(domain => domain.IsPrimary).Host}}"
            #define BACKEND_PORT 443
            #define MASA_ID {{tableId}}
            #define WS_DEVICE_KEY "{{deviceKey}}"
            """;
            await File.WriteAllTextAsync(filePath, content, cancellationToken);
            configFiles.Add(filePath);
        }

        var runtimeConfig = new
        {
            TenantCode = tenant.Code,
            TenantDomain = tenant.Domains.First(domain => domain.IsPrimary).Host,
            runtime.TenantBaseUrl,
            runtime.DatabaseName,
            runtime.DatabaseUser,
            runtime.DatabasePassword,
            runtime.SessionSecret,
            runtime.BackendPort,
            runtime.WebPort,
            DeviceKeySeeds = deviceSeeds,
            InitialAdminEmail = tenant.InitialAdminEmail
        };

        var runtimeConfigPath = Path.Combine(tenantRoot, "runtime-config.json");
        await File.WriteAllTextAsync(
            runtimeConfigPath,
            JsonSerializer.Serialize(runtimeConfig, new JsonSerializerOptions { WriteIndented = true }),
            cancellationToken);

        return new
        {
            TenantRoot = tenantRoot,
            RuntimeConfig = runtimeConfigPath,
            FirmwareDirectory = firmwareRoot,
            Domain = tenant.Domains.First(domain => domain.IsPrimary).Host,
            FirmwareConfigs = configFiles
        };
    }

    private ProvisioningOptions ReadOptions()
    {
        var options = new ProvisioningOptions();
        configuration.GetSection("Provisioning").Bind(options);

        options.OutputRoot = string.IsNullOrWhiteSpace(options.OutputRoot)
            ? "runtime/generated"
            : options.OutputRoot;
        options.TenantBackendPortStart = options.TenantBackendPortStart <= 0 ? 8100 : options.TenantBackendPortStart;
        options.TenantWebPortStart = options.TenantWebPortStart <= 0 ? 3100 : options.TenantWebPortStart;
        options.InitialTableCount = options.InitialTableCount <= 0 ? 5 : options.InitialTableCount;
        options.MaxAttempts = options.MaxAttempts <= 0 ? 5 : options.MaxAttempts;
        options.RetryDelaySeconds = options.RetryDelaySeconds <= 0 ? 60 : options.RetryDelaySeconds;
        options.LeaseSeconds = options.LeaseSeconds <= 0 ? 300 : options.LeaseSeconds;
        options.WorkerId = string.IsNullOrWhiteSpace(options.WorkerId)
            ? $"{Environment.MachineName}:{Environment.ProcessId}"
            : options.WorkerId.Trim();

        return options;
    }

    private static string GenerateSecret(int bytes = 24) =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes))
            .Replace("+", "A", StringComparison.Ordinal)
            .Replace("/", "B", StringComparison.Ordinal)
            .TrimEnd('=');

    private static int FindAvailablePort(int start, HashSet<int> used)
    {
        var current = start;
        while (used.Contains(current))
        {
            current++;
        }

        return current;
    }

    private sealed record ProvisionedRuntime(
        string DatabaseName,
        string DatabaseUser,
        string DatabasePassword,
        string SessionSecret,
        string TenantBaseUrl,
        int BackendPort,
        int WebPort);
}
