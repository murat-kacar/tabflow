using Yenicafe.Tenant.Api.Kitchen;

namespace Yenicafe.Tenant.Api.Catalog;

public sealed class MenuCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Slug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Guid? StationId { get; set; }

    public ServiceStation? Station { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<MenuItem> Items { get; set; } = new List<MenuItem>();
}
