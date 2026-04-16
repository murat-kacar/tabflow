namespace Yenicafe.Platform.Tenants;

public sealed class Tenant
{
    public Guid Id { get; init; } = Guid.CreateVersion7();

    public required string Code { get; set; }

    public required string DisplayName { get; set; }

    public string? InitialAdminEmail { get; set; }

    public TenantStatus Status { get; set; } = TenantStatus.Provisioning;

    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<TenantDomain> Domains { get; } = [];

    public List<ProvisionJob> ProvisionJobs { get; } = [];
}
