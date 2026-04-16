namespace TabFlow.Tenant.Api.Kitchen;

public sealed class ServiceStation
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string ColorHex { get; set; } = "#64748b";

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Catalog.MenuCategory> Categories { get; set; } = new List<Catalog.MenuCategory>();
}
