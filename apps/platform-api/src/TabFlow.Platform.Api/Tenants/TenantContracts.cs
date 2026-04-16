using TabFlow.Platform.Tenants;

namespace TabFlow.Platform.Api.Tenants;

public sealed record CreateTenantRequest(
    string Code,
    string DisplayName,
    string PrimaryDomain,
    string? InitialAdminEmail);

public sealed record UpdateTenantStatusRequest(TenantStatus Status);

public sealed record TenantResponse(
    Guid Id,
    string Code,
    string DisplayName,
    string? InitialAdminEmail,
    TenantStatus Status,
    string? PrimaryDomain,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record TenantRuntimeSummaryResponse(
    Guid TenantId,
    string TenantCode,
    string? BaseUrl,
    string? HealthStatus,
    string? HealthUrl,
    DateTimeOffset? HealthCheckedAt,
    string? ExposureStatus,
    string? ExposureUrl,
    DateTimeOffset? ExposureCheckedAt,
    string? ExposureError,
    int? BackendPort,
    int? WebPort,
    string? DatabaseName,
    string? DatabaseUser,
    string? ArtifactRoot,
    Guid? LatestJobId,
    ProvisionJobStatus? LatestJobStatus,
    string? LatestJobStep,
    DateTimeOffset? LatestJobUpdatedAt,
    string? LatestJobError);

public sealed record ProvisionJobResponse(
    Guid Id,
    Guid TenantId,
    string Type,
    ProvisionJobStatus Status,
    int AttemptCount,
    string CurrentStep,
    string PayloadJson,
    string ResultJson,
    string? ErrorMessage,
    DateTimeOffset CreatedAt,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset UpdatedAt);

public sealed record PlatformAuditLogResponse(
    Guid Id,
    Guid? ActorAdminId,
    string ActorEmail,
    string Action,
    string EntityType,
    string EntityId,
    string PayloadJson,
    DateTimeOffset CreatedAt);
