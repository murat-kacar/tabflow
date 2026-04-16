namespace Yenicafe.Tenant.Api.Catalog;

public sealed class TenantProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Code { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string PrimaryDomain { get; set; } = string.Empty;

    public string CurrencyCode { get; set; } = "GBP";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
