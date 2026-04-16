using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Yenicafe.Platform.Api.Security;
using Yenicafe.Platform.Data;
using Yenicafe.Platform.Security;
using Yenicafe.Platform.Tenants;

namespace Yenicafe.Platform.Api.Tenants;

public static class TenantEndpoints
{
    public static RouteGroupBuilder MapTenantEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes
            .MapGroup("/api/platform/tenants")
            .WithTags("Tenants")
            .AddEndpointFilter<PlatformAdminKeyEndpointFilter>()
            .AddEndpointFilter<PlatformActorEndpointFilter>()
            .AddEndpointFilter<PlatformRoleEndpointFilter>();

        group.MapGet("/", ListTenants);
        group.MapGet("/{id:guid}", GetTenant);
        group.MapGet("/runtimes", ListTenantRuntimes);
        group.MapGet("/{id:guid}/runtime", GetTenantRuntime);
        group.MapGet("/{id:guid}/jobs", ListTenantJobs);
        group.MapPost("/", CreateTenant).WithMetadata(new RequirePlatformRoleAttribute(PlatformAdminRole.Admin, PlatformAdminRole.Owner));
        group.MapPatch("/{id:guid}/status", UpdateStatus).WithMetadata(new RequirePlatformRoleAttribute(PlatformAdminRole.Admin, PlatformAdminRole.Owner));
        group.MapGet("/jobs", ListJobs);
        group.MapGet("/jobs/{jobId:guid}", GetJob);
        group.MapGet("/audit", ListAuditLogs).WithMetadata(new RequirePlatformRoleAttribute(PlatformAdminRole.Admin, PlatformAdminRole.Owner));

        return group;
    }

    private static async Task<IResult> ListTenants(
        PlatformDbContext db,
        CancellationToken cancellationToken)
    {
        var tenants = await db.Tenants
            .AsNoTracking()
            .Include(tenant => tenant.Domains)
            .OrderBy(tenant => tenant.Code)
            .ToListAsync(cancellationToken);

        return Results.Ok(tenants.Select(ToResponse));
    }

    private static async Task<IResult> GetTenant(
        Guid id,
        PlatformDbContext db,
        CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants
            .AsNoTracking()
            .Include(current => current.Domains)
            .FirstOrDefaultAsync(current => current.Id == id, cancellationToken);

        return tenant is null ? Results.NotFound() : Results.Ok(ToResponse(tenant));
    }

    private static async Task<IResult> CreateTenant(
        CreateTenantRequest request,
        PlatformDbContext db,
        PlatformAuditWriter auditWriter,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        var code = TenantValidation.NormalizeCode(request.Code);
        var host = TenantValidation.NormalizeHost(request.PrimaryDomain);
        var displayName = request.DisplayName.Trim();
        var initialAdminEmail = string.IsNullOrWhiteSpace(request.InitialAdminEmail)
            ? null
            : request.InitialAdminEmail.Trim().ToLowerInvariant();

        if (!TenantValidation.IsValidCode(code))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["code"] = ["Tenant code must be 3-63 chars: lowercase letters, numbers, and hyphens."]
            });
        }

        if (displayName.Length is < 2 or > 160)
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["displayName"] = ["Display name must be between 2 and 160 characters."]
            });
        }

        if (!TenantValidation.IsValidHost(host))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["primaryDomain"] = ["Primary domain must be a valid hostname."]
            });
        }

        if (initialAdminEmail is not null && !System.Net.Mail.MailAddress.TryCreate(initialAdminEmail, out _))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["initialAdminEmail"] = ["Initial admin email must be a valid email address."]
            });
        }

        var conflicts = await db.Tenants.AnyAsync(tenant => tenant.Code == code, cancellationToken)
            || await db.TenantDomains.AnyAsync(domain => domain.Host == host, cancellationToken);

        if (conflicts)
        {
            return Results.Conflict(new { message = "Tenant code or domain already exists." });
        }

        var tenantCreatePayload = JsonSerializer.Serialize(new
        {
            code,
            primaryDomain = host,
            initialAdminEmail
        });

        var tenant = new Tenant
        {
            Code = code,
            DisplayName = displayName,
            InitialAdminEmail = initialAdminEmail,
            Status = TenantStatus.Provisioning
        };
        tenant.Domains.Add(new TenantDomain { Host = host, IsPrimary = true });
        tenant.ProvisionJobs.Add(new ProvisionJob
        {
            Type = "tenant.create",
            PayloadJson = tenantCreatePayload
        });

        db.Tenants.Add(tenant);
        await db.SaveChangesAsync(cancellationToken);
        await auditWriter.WriteAsync(
            PlatformActorAccessor.Read(httpContext),
            "tenant.create_requested",
            "tenant",
            tenant.Id.ToString(),
            tenantCreatePayload,
            cancellationToken);

        return Results.Created($"/api/platform/tenants/{tenant.Id}", ToResponse(tenant));
    }

    private static async Task<IResult> UpdateStatus(
        Guid id,
        UpdateTenantStatusRequest request,
        PlatformDbContext db,
        PlatformAuditWriter auditWriter,
        HttpContext httpContext,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Status))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]>
            {
                ["status"] = ["Unknown tenant status."]
            });
        }

        var tenant = await db.Tenants
            .Include(current => current.Domains)
            .FirstOrDefaultAsync(current => current.Id == id, cancellationToken);

        if (tenant is null)
        {
            return Results.NotFound();
        }

        tenant.Status = request.Status;
        tenant.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await auditWriter.WriteAsync(
            PlatformActorAccessor.Read(httpContext),
            "tenant.status_changed",
            "tenant",
            tenant.Id.ToString(),
            JsonSerializer.Serialize(new { status = request.Status.ToString().ToLowerInvariant() }),
            cancellationToken);

        return Results.Ok(ToResponse(tenant));
    }

    private static async Task<IResult> ListJobs(PlatformDbContext db, CancellationToken cancellationToken)
    {
        var jobs = await db.ProvisionJobs
            .AsNoTracking()
            .OrderByDescending(job => job.CreatedAt)
            .Take(50)
            .Select(job => ToResponse(job))
            .ToListAsync(cancellationToken);

        return Results.Ok(jobs);
    }

    private static async Task<IResult> GetJob(Guid jobId, PlatformDbContext db, CancellationToken cancellationToken)
    {
        var job = await db.ProvisionJobs.AsNoTracking().FirstOrDefaultAsync(current => current.Id == jobId, cancellationToken);
        return job is null ? Results.NotFound() : Results.Ok(ToResponse(job));
    }

    private static async Task<IResult> ListTenantJobs(Guid id, PlatformDbContext db, CancellationToken cancellationToken)
    {
        var jobs = await db.ProvisionJobs
            .AsNoTracking()
            .Where(job => job.TenantId == id)
            .OrderByDescending(job => job.CreatedAt)
            .Select(job => ToResponse(job))
            .ToListAsync(cancellationToken);

        return Results.Ok(jobs);
    }

    private static async Task<IResult> ListTenantRuntimes(PlatformDbContext db, CancellationToken cancellationToken)
    {
        var tenants = await db.Tenants
            .AsNoTracking()
            .Include(tenant => tenant.Domains)
            .Include(tenant => tenant.ProvisionJobs)
            .OrderBy(tenant => tenant.Code)
            .ToListAsync(cancellationToken);

        return Results.Ok(tenants.Select(ToRuntimeResponse));
    }

    private static async Task<IResult> GetTenantRuntime(Guid id, PlatformDbContext db, CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants
            .AsNoTracking()
            .Include(current => current.Domains)
            .Include(current => current.ProvisionJobs)
            .FirstOrDefaultAsync(current => current.Id == id, cancellationToken);

        return tenant is null ? Results.NotFound() : Results.Ok(ToRuntimeResponse(tenant));
    }

    private static async Task<IResult> ListAuditLogs(PlatformDbContext db, CancellationToken cancellationToken)
    {
        var logs = await db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(log => log.CreatedAt)
            .Take(100)
            .Select(log => new PlatformAuditLogResponse(
                log.Id,
                log.ActorAdminId,
                log.ActorEmail,
                log.Action,
                log.EntityType,
                log.EntityId,
                log.PayloadJson,
                log.CreatedAt))
            .ToListAsync(cancellationToken);

        return Results.Ok(logs);
    }

    private static TenantResponse ToResponse(Tenant tenant)
    {
        var primaryDomain = tenant.Domains.FirstOrDefault(domain => domain.IsPrimary)?.Host;

        return new TenantResponse(
            tenant.Id,
            tenant.Code,
            tenant.DisplayName,
            tenant.InitialAdminEmail,
            tenant.Status,
            primaryDomain,
            tenant.CreatedAt,
            tenant.UpdatedAt);
    }

    private static ProvisionJobResponse ToResponse(ProvisionJob job) =>
        new(
            job.Id,
            job.TenantId,
            job.Type,
            job.Status,
            job.AttemptCount,
            job.CurrentStep,
            job.PayloadJson,
            job.ResultJson,
            job.ErrorMessage,
            job.CreatedAt,
            job.StartedAt,
            job.CompletedAt,
            job.UpdatedAt);

    private static TenantRuntimeSummaryResponse ToRuntimeResponse(Tenant tenant)
    {
        var latestJob = tenant.ProvisionJobs
            .OrderByDescending(job => job.UpdatedAt)
            .ThenByDescending(job => job.CreatedAt)
            .FirstOrDefault();

        string? baseUrl = null;
        string? healthStatus = null;
        string? healthUrl = null;
        DateTimeOffset? healthCheckedAt = null;
        string? exposureStatus = null;
        string? exposureUrl = null;
        DateTimeOffset? exposureCheckedAt = null;
        string? exposureError = null;
        int? backendPort = null;
        int? webPort = null;
        string? databaseName = null;
        string? databaseUser = null;
        string? artifactRoot = null;

        if (latestJob is not null && latestJob.ResultJson != "{}")
        {
            try
            {
                using var document = JsonDocument.Parse(latestJob.ResultJson);
                var root = document.RootElement;

                if (root.TryGetProperty("TenantBaseUrl", out var baseUrlElement))
                {
                    baseUrl = baseUrlElement.GetString();
                }

                if (root.TryGetProperty("BackendPort", out var backendPortElement))
                {
                    backendPort = backendPortElement.GetInt32();
                }

                if (root.TryGetProperty("WebPort", out var webPortElement))
                {
                    webPort = webPortElement.GetInt32();
                }

                if (root.TryGetProperty("DatabaseName", out var databaseNameElement))
                {
                    databaseName = databaseNameElement.GetString();
                }

                if (root.TryGetProperty("DatabaseUser", out var databaseUserElement))
                {
                    databaseUser = databaseUserElement.GetString();
                }

                if (root.TryGetProperty("Artifacts", out var artifactsElement)
                    && artifactsElement.TryGetProperty("TenantRoot", out var tenantRootElement))
                {
                    artifactRoot = tenantRootElement.GetString();
                }

                if (root.TryGetProperty("RuntimeHealth", out var runtimeHealthElement))
                {
                    if (runtimeHealthElement.TryGetProperty("Internal", out var internalHealthElement))
                    {
                        if (internalHealthElement.TryGetProperty("Status", out var statusElement))
                        {
                            healthStatus = statusElement.GetString();
                        }

                        if (internalHealthElement.TryGetProperty("HealthUrl", out var healthUrlElement))
                        {
                            healthUrl = healthUrlElement.GetString();
                        }

                        if (internalHealthElement.TryGetProperty("CheckedAt", out var checkedAtElement)
                            && checkedAtElement.TryGetDateTimeOffset(out var checkedAt))
                        {
                            healthCheckedAt = checkedAt;
                        }
                    }

                    if (runtimeHealthElement.TryGetProperty("External", out var externalHealthElement))
                    {
                        if (externalHealthElement.TryGetProperty("Status", out var exposureStatusElement))
                        {
                            exposureStatus = exposureStatusElement.GetString();
                        }

                        if (externalHealthElement.TryGetProperty("HealthUrl", out var exposureUrlElement))
                        {
                            exposureUrl = exposureUrlElement.GetString();
                        }

                        if (externalHealthElement.TryGetProperty("CheckedAt", out var exposureCheckedAtElement)
                            && exposureCheckedAtElement.TryGetDateTimeOffset(out var checkedAt))
                        {
                            exposureCheckedAt = checkedAt;
                        }

                        if (externalHealthElement.TryGetProperty("Error", out var exposureErrorElement))
                        {
                            exposureError = exposureErrorElement.GetString();
                        }
                    }
                }
            }
            catch
            {
                // Ignore malformed historical job results and fall back to null summary fields.
            }
        }

        return new TenantRuntimeSummaryResponse(
            tenant.Id,
            tenant.Code,
            baseUrl,
            healthStatus,
            healthUrl,
            healthCheckedAt,
            exposureStatus,
            exposureUrl,
            exposureCheckedAt,
            exposureError,
            backendPort,
            webPort,
            databaseName,
            databaseUser,
            artifactRoot,
            latestJob?.Id,
            latestJob?.Status,
            latestJob?.CurrentStep,
            latestJob?.UpdatedAt,
            latestJob?.ErrorMessage);
    }
}
