namespace TabFlow.Platform.Tenants;

public sealed class TenantDomain
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public Guid TenantId { get; init; }

    public Tenant? Tenant { get; init; }

    public required string Host { get; set; }

    public bool IsPrimary { get; set; }

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
