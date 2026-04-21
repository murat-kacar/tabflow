using System.Data;
using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Npgsql;
using TabFlow.Platform.Data;

namespace TabFlow.Platform.Tenants;

public sealed class ProvisioningService(
    PlatformDbContext db,
    IConfiguration configuration)
{
    private const int MaxProvisionJobErrorMessageLength = 2000;

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
            if (job.Tenant is null)
            {
                continue;
            }

            if (job.Type == "tenant.create")
            {
                await ProcessTenantCreateJobAsync(job, options, cancellationToken);
                processed++;
            }
            else if (job.Type == "tenant.settings.update")
            {
                await ProcessTenantSettingsUpdateJobAsync(job, options, cancellationToken);
                processed++;
            }
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
                SELECT platform_provision_jobs.id
                FROM platform_provision_jobs
                INNER JOIN platform_tenants ON platform_tenants.id = platform_provision_jobs.tenant_id
                WHERE (
                    (type = 'tenant.create' AND platform_tenants.status <> 'active'::tenant_status)
                    OR type = 'tenant.settings.update'
                  )
                  AND platform_provision_jobs.attempt_count < @max_attempts
                  AND (
                      platform_provision_jobs.status = 'pending'::provision_job_status
                      OR (
                          platform_provision_jobs.status = 'failed'::provision_job_status
                          AND (platform_provision_jobs.next_attempt_at IS NULL OR platform_provision_jobs.next_attempt_at <= @now)
                      )
                      OR (
                          platform_provision_jobs.status = 'running'::provision_job_status
                          AND platform_provision_jobs.lease_until IS NOT NULL
                          AND platform_provision_jobs.lease_until <= @now
                      )
                  )
                ORDER BY platform_provision_jobs.created_at
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

            UpdateStep(job, "provisioning_runtime");
            await db.SaveChangesAsync(cancellationToken);

            await ProvisionRuntimeAsync(tenant, runtime, options, cancellationToken);

            UpdateStep(job, "health_verification");
            await db.SaveChangesAsync(cancellationToken);

            var runtimeHealth = await VerifyRuntimeHealthAsync(runtime, options, cancellationToken);

            tenant.Status = TenantStatus.Active;
            tenant.UpdatedAt = DateTimeOffset.UtcNow;
            job.Status = ProvisionJobStatus.Succeeded;
            job.CurrentStep = "completed";
            job.ResultJson = JsonSerializer.Serialize(new
            {
                runtime.TenantBaseUrl,
                runtime.DatabaseName,
                runtime.DatabaseUser,
                runtime.BackendPort,
                runtime.WebPort,
                RuntimeHealth = runtimeHealth,
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
            job.ErrorMessage = TruncateErrorMessage(exception.Message);
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

    private async Task ProcessTenantSettingsUpdateJobAsync(
        ProvisionJob job,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var tenant = job.Tenant ?? throw new InvalidOperationException("Provisioning job tenant is missing.");

        try
        {
            UpdateStep(job, "loading_runtime_config");
            await db.SaveChangesAsync(cancellationToken);

            var runtime = await ReadExistingRuntimeAsync(tenant, options, cancellationToken);

            UpdateStep(job, "writing_runtime_environment");
            await db.SaveChangesAsync(cancellationToken);
            await WriteRuntimeEnvironmentFilesAsync(tenant, runtime, options, cancellationToken);

            UpdateStep(job, "restarting_runtime");
            await db.SaveChangesAsync(cancellationToken);
            await RunCommandAsync(options.SystemctlBinary, $"restart tabflow-tenant-api@{tenant.Code}.service", cancellationToken);
            await RunCommandAsync(options.SystemctlBinary, $"restart tabflow-tenant-web@{tenant.Code}.service", cancellationToken);

            UpdateStep(job, "health_verification");
            await db.SaveChangesAsync(cancellationToken);
            var runtimeHealth = await VerifyRuntimeHealthAsync(runtime, options, cancellationToken);

            job.Status = ProvisionJobStatus.Succeeded;
            job.CurrentStep = "completed";
            job.ResultJson = JsonSerializer.Serialize(new
            {
                tenant.LanguageCode,
                tenant.CurrencyCode,
                tenant.TimeZone,
                RuntimeHealth = runtimeHealth
            });
            job.CompletedAt = DateTimeOffset.UtcNow;
            job.ErrorMessage = null;
            job.WorkerId = null;
            job.LeaseUntil = null;
            job.NextAttemptAt = null;
            job.UpdatedAt = DateTimeOffset.UtcNow;
            tenant.UpdatedAt = DateTimeOffset.UtcNow;

            await db.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            var now = DateTimeOffset.UtcNow;
            var terminalFailure = job.AttemptCount >= options.MaxAttempts;
            job.Status = ProvisionJobStatus.Failed;
            job.ErrorMessage = TruncateErrorMessage(exception.Message);
            job.CompletedAt = now;
            job.CurrentStep = terminalFailure ? "failed" : "retry_scheduled";
            job.WorkerId = null;
            job.LeaseUntil = null;
            job.NextAttemptAt = terminalFailure
                ? null
                : now.AddSeconds(options.RetryDelaySeconds * Math.Max(1, job.AttemptCount));
            job.UpdatedAt = now;
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
            .Where(current => current.Type == "tenant.create" && current.ResultJson != "{}")
            .Select(current => current.ResultJson)
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
            DatabaseName: $"tabflow_tenant_{tenant.Code}",
            DatabaseUser: ResolveTenantDatabaseOwner(options),
            DatabasePassword: ResolveTenantDatabasePassword(options),
            AdminApiKey: GenerateSecret(32),
            SessionSecret: GenerateSecret(48),
            TenantBaseUrl: $"https://{primaryDomain}",
            PrimaryDomain: primaryDomain,
            BackendPort: backendPort,
            WebPort: webPort);
    }

    private static async Task<ProvisionedRuntime> ReadExistingRuntimeAsync(
        Tenant tenant,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var runtimeConfigPath = Path.Combine(options.OutputRoot, "tenants", tenant.Code, "runtime-config.json");
        await using var stream = File.OpenRead(runtimeConfigPath);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var root = document.RootElement;

        return new ProvisionedRuntime(
            DatabaseName: root.GetProperty("DatabaseName").GetString() ?? throw new InvalidOperationException("Runtime database name is missing."),
            DatabaseUser: root.GetProperty("DatabaseUser").GetString() ?? throw new InvalidOperationException("Runtime database user is missing."),
            DatabasePassword: root.GetProperty("DatabasePassword").GetString() ?? throw new InvalidOperationException("Runtime database password is missing."),
            AdminApiKey: root.GetProperty("AdminApiKey").GetString() ?? throw new InvalidOperationException("Runtime admin API key is missing."),
            SessionSecret: root.GetProperty("SessionSecret").GetString() ?? throw new InvalidOperationException("Runtime session secret is missing."),
            TenantBaseUrl: root.GetProperty("TenantBaseUrl").GetString() ?? throw new InvalidOperationException("Runtime base URL is missing."),
            PrimaryDomain: root.GetProperty("TenantDomain").GetString() ?? tenant.Domains.First(domain => domain.IsPrimary).Host,
            BackendPort: root.GetProperty("BackendPort").GetInt32(),
            WebPort: root.GetProperty("WebPort").GetInt32());
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
        var sketchFiles = new List<string>();
        var template = LoadProvisionedFirmwareTemplate();
        for (var tableId = 1; tableId <= options.InitialTableCount; tableId++)
        {
            var filePath = Path.Combine(firmwareRoot, $"masa-{tableId:000}.ino");
            var deviceKey = $"{tenant.Code}-masa{tableId:000}-{Guid.NewGuid():N}"[..36];
            deviceSeeds.Add(new
            {
                tableNumber = tableId,
                deviceKey
            });
            var content = RenderProvisionedFirmwareSketch(
                template,
                tenant.DisplayName,
                tenant.Domains.First(domain => domain.IsPrimary).Host,
                tableId,
                deviceKey);
            await File.WriteAllTextAsync(filePath, content, cancellationToken);
            sketchFiles.Add(filePath);
        }

        var runtimeConfig = new
        {
            TenantCode = tenant.Code,
            TenantDomain = tenant.Domains.First(domain => domain.IsPrimary).Host,
            runtime.TenantBaseUrl,
            runtime.DatabaseName,
            runtime.DatabaseUser,
            runtime.DatabasePassword,
            runtime.AdminApiKey,
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
            FirmwareSketches = sketchFiles
        };
    }

    private static string LoadProvisionedFirmwareTemplate()
    {
        var candidatePaths = new[]
        {
            "/opt/tabflow/packages/firmware/arduino/tabflow-table-display/firmware.ino",
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../packages/firmware/arduino/tabflow-table-display/firmware.ino"))
        };

        var path = candidatePaths.FirstOrDefault(File.Exists)
            ?? throw new InvalidOperationException("Firmware template file could not be located.");

        return File.ReadAllText(path);
    }

    private static string RenderProvisionedFirmwareSketch(
        string template,
        string tenantDisplayName,
        string domain,
        int tableNumber,
        string deviceKey)
    {
        const string marker = "#include \"config.h\"";
        var configBlock = $$"""
        // Auto-generated by TabFlow provisioning.
        // Tenant: {{tenantDisplayName}}
        // Domain: {{domain}}
        // File: masa-{{tableNumber:000}}.ino

        #define WIFI_SSID "CHANGE_ME"
        #define WIFI_PASSWORD "CHANGE_ME"

        #define BACKEND_HOST "{{domain}}"
        #define BACKEND_PORT 443

        #define MASA_ID {{tableNumber}}
        #define WS_DEVICE_KEY "{{deviceKey}}"

        #define TFT_SCLK_PIN 0
        #define TFT_MOSI_PIN 1
        #define TFT_MISO_PIN -1
        #define TFT_CS_PIN 4
        #define TFT_DC_PIN 2
        #define TFT_RST_PIN 3
        #define TFT_BL_PIN -1
        #define TFT_BL_ON HIGH
        #define TFT_INITR_OPTION INITR_BLACKTAB
        #define TFT_ROTATION 0

        #define TOKEN_DURATION_MS 60000UL
        #define WIFI_TIMEOUT_MS 20000UL
        #define WS_RECONNECT_MS 3000UL
        #define WS_PING_MS 30000UL
        #define HEARTBEAT_MS 5000UL

        #define SERIAL_BAUD 115200
        """;

        return template.Contains(marker, StringComparison.Ordinal)
            ? template.Replace(marker, configBlock, StringComparison.Ordinal)
            : $"{configBlock}\n\n{template}";
    }

    private ProvisioningOptions ReadOptions()
    {
        var options = new ProvisioningOptions();
        configuration.GetSection("Provisioning").Bind(options);

        options.OutputRoot = string.IsNullOrWhiteSpace(options.OutputRoot)
            ? "runtime/generated"
            : Path.GetFullPath(options.OutputRoot);
        options.TenantApiDeployRoot = string.IsNullOrWhiteSpace(options.TenantApiDeployRoot)
            ? "/opt/tabflow-deploy/tenant-api"
            : Path.GetFullPath(options.TenantApiDeployRoot);
        options.TenantWebRoot = string.IsNullOrWhiteSpace(options.TenantWebRoot)
            ? "/opt/tabflow/apps/tenant-web"
            : Path.GetFullPath(options.TenantWebRoot);
        options.TenantEnvRoot = string.IsNullOrWhiteSpace(options.TenantEnvRoot)
            ? "/etc/tabflow/tenants"
            : Path.GetFullPath(options.TenantEnvRoot);
        options.NginxSitesAvailableRoot = string.IsNullOrWhiteSpace(options.NginxSitesAvailableRoot)
            ? "/etc/nginx/sites-available"
            : Path.GetFullPath(options.NginxSitesAvailableRoot);
        options.NginxSitesEnabledRoot = string.IsNullOrWhiteSpace(options.NginxSitesEnabledRoot)
            ? "/etc/nginx/sites-enabled"
            : Path.GetFullPath(options.NginxSitesEnabledRoot);
        options.TenantBackendPortStart = options.TenantBackendPortStart <= 0 ? 8100 : options.TenantBackendPortStart;
        options.TenantWebPortStart = options.TenantWebPortStart <= 0 ? 3100 : options.TenantWebPortStart;
        options.InitialTableCount = options.InitialTableCount <= 0 ? 5 : options.InitialTableCount;
        options.MaxAttempts = options.MaxAttempts <= 0 ? 5 : options.MaxAttempts;
        options.RetryDelaySeconds = options.RetryDelaySeconds <= 0 ? 60 : options.RetryDelaySeconds;
        options.LeaseSeconds = options.LeaseSeconds <= 0 ? 300 : options.LeaseSeconds;
        options.CertbotBinary = string.IsNullOrWhiteSpace(options.CertbotBinary) ? "certbot" : options.CertbotBinary.Trim();
        options.SystemctlBinary = string.IsNullOrWhiteSpace(options.SystemctlBinary) ? "systemctl" : options.SystemctlBinary.Trim();
        options.NginxBinary = string.IsNullOrWhiteSpace(options.NginxBinary) ? "nginx" : options.NginxBinary.Trim();
        options.DotnetBinary = string.IsNullOrWhiteSpace(options.DotnetBinary) ? "/usr/bin/dotnet" : options.DotnetBinary.Trim();
        options.NodeBinary = string.IsNullOrWhiteSpace(options.NodeBinary) ? "/usr/local/bin/node" : options.NodeBinary.Trim();
        options.HealthCheckTimeoutSeconds = options.HealthCheckTimeoutSeconds <= 0 ? 15 : options.HealthCheckTimeoutSeconds;
        options.WorkerId = string.IsNullOrWhiteSpace(options.WorkerId)
            ? $"{Environment.MachineName}:{Environment.ProcessId}"
            : options.WorkerId.Trim();

        return options;
    }

    private async Task ProvisionRuntimeAsync(
        Tenant tenant,
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(options.TenantEnvRoot);

        await EnsureTenantDatabaseAsync(runtime, cancellationToken);
        await WriteRuntimeEnvironmentFilesAsync(tenant, runtime, options, cancellationToken);
        await EnsureSystemdTemplatesAsync(options, cancellationToken);
        await EnsureNginxSiteAsync(tenant, runtime, options, cancellationToken);

        var nginxEnabledPath = Path.Combine(options.NginxSitesEnabledRoot, $"tabflow-{tenant.Code}");
        var nginxAvailablePath = Path.Combine(options.NginxSitesAvailableRoot, $"tabflow-{tenant.Code}");
        EnsureSymlink(nginxEnabledPath, nginxAvailablePath);

        await RunCommandAsync(options.NginxBinary, "-t", cancellationToken);
        await RunCommandAsync(options.SystemctlBinary, "daemon-reload", cancellationToken);
        await RunCommandAsync(options.SystemctlBinary, $"enable --now tabflow-tenant-api@{tenant.Code}.service", cancellationToken);
        await RunCommandAsync(options.SystemctlBinary, $"enable --now tabflow-tenant-web@{tenant.Code}.service", cancellationToken);
        await RunCommandAsync(options.SystemctlBinary, "reload nginx", cancellationToken);
        await EnsureCertificateAsync(runtime, options, cancellationToken);
    }

    private async Task<object> VerifyRuntimeHealthAsync(
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        using var http = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(options.HealthCheckTimeoutSeconds)
        };

        var internalUrl = $"http://127.0.0.1:{runtime.BackendPort}/health/ready";
        var externalUrl = $"{runtime.TenantBaseUrl}/admin/login";
        var bootstrapUrl = $"{runtime.TenantBaseUrl}/api/admin/bootstrap-status";

        await EnsureSuccessAsync(http, internalUrl, cancellationToken);
        await EnsureSuccessAsync(http, externalUrl, cancellationToken);
        await EnsureSuccessAsync(http, bootstrapUrl, cancellationToken);

        return new
        {
            Internal = new
            {
                Status = "ok",
                HealthUrl = internalUrl
            },
            External = new
            {
                Status = "ok",
                HealthUrl = externalUrl
            },
            Bootstrap = new
            {
                Status = "ok",
                HealthUrl = bootstrapUrl
            }
        };
    }

    private static async Task EnsureSuccessAsync(HttpClient http, string url, CancellationToken cancellationToken)
    {
        using var response = await http.GetAsync(url, cancellationToken);
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException($"Health probe failed for {url}: {(int)response.StatusCode} {response.ReasonPhrase} {body}".Trim());
    }

    private async Task EnsureTenantDatabaseAsync(ProvisionedRuntime runtime, CancellationToken cancellationToken)
    {
        var builder = new NpgsqlConnectionStringBuilder(
            configuration.GetConnectionString("PlatformDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:PlatformDatabase is not configured."))
        {
            Database = "postgres"
        };

        await using var connection = new NpgsqlConnection(builder.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        await using (var existsCommand = connection.CreateCommand())
        {
            existsCommand.CommandText = "SELECT 1 FROM pg_database WHERE datname = @database_name";
            existsCommand.Parameters.AddWithValue("database_name", runtime.DatabaseName);
            var exists = await existsCommand.ExecuteScalarAsync(cancellationToken);
            if (exists is not null)
            {
                return;
            }
        }

        await using var createCommand = connection.CreateCommand();
        createCommand.CommandText = $"CREATE DATABASE {QuoteIdentifier(runtime.DatabaseName)} OWNER {QuoteIdentifier(runtime.DatabaseUser)}";
        await createCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task WriteRuntimeEnvironmentFilesAsync(
        Tenant tenant,
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var tenantRoot = Path.Combine(options.OutputRoot, "tenants", tenant.Code);
        var runtimeConfigPath = Path.Combine(tenantRoot, "runtime-config.json");
        await using var runtimeConfigStream = File.OpenRead(runtimeConfigPath);
        using var runtimeConfig = await JsonDocument.ParseAsync(runtimeConfigStream, cancellationToken: cancellationToken);
        var deviceSeedJson = JsonSerializer.Serialize(runtimeConfig.RootElement.GetProperty("DeviceKeySeeds"));

        var apiEnvPath = Path.Combine(options.TenantEnvRoot, $"{tenant.Code}-api.env");
        var webEnvPath = Path.Combine(options.TenantEnvRoot, $"{tenant.Code}-web.env");
        var initialAdminEmail = tenant.InitialAdminEmail ?? $"admin@{tenant.Code}.tabflow.uk";

        var apiEnv = $$"""
        ASPNETCORE_ENVIRONMENT=Production
        DOTNET_ENVIRONMENT=Production
        TENANT_API_PORT={{runtime.BackendPort}}
        ConnectionStrings__TenantDatabase=Host=127.0.0.1;Port=5432;Database={{runtime.DatabaseName}};Username={{runtime.DatabaseUser}};Password={{runtime.DatabasePassword}}
        Tenant__Code={{tenant.Code}}
        Tenant__DisplayName={{tenant.DisplayName}}
        Tenant__BaseUrl={{runtime.TenantBaseUrl}}
        Tenant__InitialAdminEmail={{initialAdminEmail}}
        Tenant__LanguageCode={{tenant.LanguageCode}}
        Tenant__CurrencyCode={{tenant.CurrencyCode}}
        Tenant__TimeZone={{tenant.TimeZone}}
        Tenant__InitialTableCount={{options.InitialTableCount}}
        Tenant__DeviceTokenTtlSeconds=60
        Tenant__CustomerSessionTtlMinutes=120
        Tenant__DeviceKeySeedJson={{deviceSeedJson}}
        TenantAdmin__ApiKey={{runtime.AdminApiKey}}
        """;

        var webEnv = $$"""
        NODE_ENV=production
        PORT={{runtime.WebPort}}
        TENANT_API_BASE_URL=http://127.0.0.1:{{runtime.BackendPort}}
        NEXT_PUBLIC_TENANT_API_BASE_URL={{runtime.TenantBaseUrl}}
        TENANT_ADMIN_API_KEY={{runtime.AdminApiKey}}
        TENANT_SESSION_SECRET={{runtime.SessionSecret}}
        NEXT_PUBLIC_TENANT_LANGUAGE_CODE={{tenant.LanguageCode}}
        NEXT_PUBLIC_TENANT_CURRENCY_CODE={{tenant.CurrencyCode}}
        NEXT_PUBLIC_TENANT_TIME_ZONE={{tenant.TimeZone}}
        """;

        await File.WriteAllTextAsync(apiEnvPath, apiEnv + Environment.NewLine, cancellationToken);
        await File.WriteAllTextAsync(webEnvPath, webEnv + Environment.NewLine, cancellationToken);
    }

    private static async Task EnsureSystemdTemplatesAsync(ProvisioningOptions options, CancellationToken cancellationToken)
    {
        const string apiTemplatePath = "/etc/systemd/system/tabflow-tenant-api@.service";
        const string webTemplatePath = "/etc/systemd/system/tabflow-tenant-web@.service";

        var apiTemplate = $$"""
        [Unit]
        Description=TabFlow Tenant API (%i)
        After=network.target postgresql.service
        Wants=postgresql.service

        [Service]
        Type=simple
        WorkingDirectory={{options.TenantApiDeployRoot}}
        EnvironmentFile={{options.TenantEnvRoot}}/%i-api.env
        ExecStart={{options.DotnetBinary}} {{options.TenantApiDeployRoot}}/TabFlow.Tenant.Api.dll --urls http://127.0.0.1:${TENANT_API_PORT}
        Restart=always
        RestartSec=5
        User=root

        [Install]
        WantedBy=multi-user.target
        """;

        var webTemplate = $$"""
        [Unit]
        Description=TabFlow Tenant Web (%i)
        After=network.target tabflow-tenant-api@%i.service
        Wants=tabflow-tenant-api@%i.service

        [Service]
        Type=simple
        WorkingDirectory={{options.TenantWebRoot}}
        EnvironmentFile={{options.TenantEnvRoot}}/%i-web.env
        ExecStartPre=/bin/mkdir -p {{options.TenantWebRoot}}/.next/standalone/apps/tenant-web/.next
        ExecStartPre=/bin/sh -c 'rm -rf {{options.TenantWebRoot}}/.next/standalone/apps/tenant-web/.next/static && ln -s {{options.TenantWebRoot}}/.next/static {{options.TenantWebRoot}}/.next/standalone/apps/tenant-web/.next/static'
        ExecStart={{options.NodeBinary}} {{options.TenantWebRoot}}/.next/standalone/apps/tenant-web/server.js
        Restart=always
        RestartSec=5
        User=root

        [Install]
        WantedBy=multi-user.target
        """;

        await File.WriteAllTextAsync(apiTemplatePath, apiTemplate + Environment.NewLine, cancellationToken);
        await File.WriteAllTextAsync(webTemplatePath, webTemplate + Environment.NewLine, cancellationToken);
    }

    private static async Task EnsureNginxSiteAsync(
        Tenant tenant,
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(options.NginxSitesAvailableRoot);
        Directory.CreateDirectory(options.NginxSitesEnabledRoot);

        var sitePath = Path.Combine(options.NginxSitesAvailableRoot, $"tabflow-{tenant.Code}");
        var config = $$"""
        server {
            listen 80;
            listen [::]:80;
            server_name {{runtime.PrimaryDomain}};

            location /_next/static/ {
                alias {{options.TenantWebRoot}}/.next/static/;
                access_log off;
                expires 1y;
                add_header Cache-Control "public, immutable";
            }

            location /api/ {
                proxy_pass http://127.0.0.1:{{runtime.BackendPort}};
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location = /health {
                proxy_pass http://127.0.0.1:{{runtime.BackendPort}}/health;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
            }

            location = /health/ready {
                proxy_pass http://127.0.0.1:{{runtime.BackendPort}}/health/ready;
                proxy_http_version 1.1;
                proxy_set_header Host $host;
            }

            location /ws/ {
                proxy_pass http://127.0.0.1:{{runtime.BackendPort}};
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            location / {
                proxy_pass http://127.0.0.1:{{runtime.WebPort}};
                proxy_http_version 1.1;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
        """;

        await File.WriteAllTextAsync(sitePath, config + Environment.NewLine, cancellationToken);
    }

    private async Task EnsureCertificateAsync(
        ProvisionedRuntime runtime,
        ProvisioningOptions options,
        CancellationToken cancellationToken)
    {
        var args = string.IsNullOrWhiteSpace(options.CertbotEmail)
            ? $"--nginx --non-interactive --agree-tos --register-unsafely-without-email -d {runtime.PrimaryDomain} --redirect"
            : $"--nginx --non-interactive --agree-tos -m {options.CertbotEmail} -d {runtime.PrimaryDomain} --redirect";
        await RunCommandAsync(options.CertbotBinary, args, cancellationToken);
    }

    private static void EnsureSymlink(string path, string target)
    {
        if (File.Exists(path) || Directory.Exists(path))
        {
            File.Delete(path);
        }

        File.CreateSymbolicLink(path, target);
    }

    private static async Task RunCommandAsync(string fileName, string arguments, CancellationToken cancellationToken)
    {
        var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false
            }
        };

        if (!process.Start())
        {
            throw new InvalidOperationException($"Failed to start process: {fileName} {arguments}");
        }

        var stdoutTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);
        var stdout = await stdoutTask;
        var stderr = await stderrTask;

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Command failed ({process.ExitCode}): {fileName} {arguments}\nSTDOUT: {stdout}\nSTDERR: {stderr}".Trim());
        }
    }

    private string ResolveTenantDatabaseOwner(ProvisioningOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.TenantDatabaseOwner))
        {
            return options.TenantDatabaseOwner.Trim();
        }

        var builder = new NpgsqlConnectionStringBuilder(
            configuration.GetConnectionString("PlatformDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:PlatformDatabase is not configured."));
        if (string.IsNullOrWhiteSpace(builder.Username))
        {
            throw new InvalidOperationException("PlatformDatabase username is not configured.");
        }

        return builder.Username;
    }

    private string ResolveTenantDatabasePassword(ProvisioningOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.TenantDatabasePassword))
        {
            return options.TenantDatabasePassword;
        }

        var builder = new NpgsqlConnectionStringBuilder(
            configuration.GetConnectionString("PlatformDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:PlatformDatabase is not configured."));
        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            throw new InvalidOperationException("PlatformDatabase password is not configured.");
        }

        return builder.Password;
    }

    private static string QuoteIdentifier(string identifier) => $"\"{identifier.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";

    private static string GenerateSecret(int bytes = 24) =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(bytes))
            .Replace("+", "A", StringComparison.Ordinal)
            .Replace("/", "B", StringComparison.Ordinal)
            .TrimEnd('=');

    private static int FindAvailablePort(int start, HashSet<int> used)
    {
        var current = start;
        while (used.Contains(current) || !IsPortAvailable(current))
        {
            current++;
        }

        return current;
    }

    private static bool IsPortAvailable(int port)
    {
        try
        {
            using var listener = new TcpListener(IPAddress.Loopback, port);
            listener.Start();
            return true;
        }
        catch (SocketException)
        {
            return false;
        }
    }

    private static string TruncateErrorMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return "Provisioning failed.";
        }

        return message.Length <= MaxProvisionJobErrorMessageLength
            ? message
            : message[..MaxProvisionJobErrorMessageLength];
    }

    private sealed record ProvisionedRuntime(
        string DatabaseName,
        string DatabaseUser,
        string DatabasePassword,
        string AdminApiKey,
        string SessionSecret,
        string TenantBaseUrl,
        string PrimaryDomain,
        int BackendPort,
        int WebPort);
}
