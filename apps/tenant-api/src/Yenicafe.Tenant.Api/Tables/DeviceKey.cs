namespace Yenicafe.Tenant.Api.Tables;

public sealed class DeviceKey
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TableId { get; set; }

    public ServiceTable? Table { get; set; }

    public string KeyHash { get; set; } = string.Empty;

    public string KeyHint { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTimeOffset? LastSeenAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
