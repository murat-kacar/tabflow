namespace Yenicafe.Platform.Tenants;

public sealed class ProvisionJob
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public Guid TenantId { get; init; }

    public Tenant? Tenant { get; init; }

    public required string Type { get; set; }

    public ProvisionJobStatus Status { get; set; } = ProvisionJobStatus.Pending;

    public int AttemptCount { get; set; }

    public string? WorkerId { get; set; }

    public DateTimeOffset? LeaseUntil { get; set; }

    public DateTimeOffset? NextAttemptAt { get; set; }

    public string CurrentStep { get; set; } = "queued";

    public string PayloadJson { get; set; } = "{}";

    public string ResultJson { get; set; } = "{}";

    public string? ErrorMessage { get; set; }

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
