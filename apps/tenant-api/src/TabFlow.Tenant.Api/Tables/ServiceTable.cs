namespace TabFlow.Tenant.Api.Tables;

public sealed class ServiceTable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public int Number { get; set; }

    public string Name { get; set; } = string.Empty;

    public string ServiceNote { get; set; } = string.Empty;

    public string LayoutCode { get; set; } = "ana-kat";

    public int LayoutX { get; set; }

    public int LayoutY { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<DeviceKey> DeviceKeys { get; set; } = new List<DeviceKey>();
}
