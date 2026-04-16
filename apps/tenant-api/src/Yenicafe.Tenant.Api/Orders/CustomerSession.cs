using Yenicafe.Tenant.Api.Tables;

namespace Yenicafe.Tenant.Api.Orders;

public sealed class CustomerSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TableId { get; set; }

    public ServiceTable? Table { get; set; }

    public string SessionTokenHash { get; set; } = string.Empty;

    public DateTimeOffset OpenedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset? ClosedAt { get; set; }

    public DateTimeOffset LastSeenAt { get; set; } = DateTimeOffset.UtcNow;
}
