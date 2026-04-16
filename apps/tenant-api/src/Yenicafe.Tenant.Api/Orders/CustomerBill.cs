using Yenicafe.Tenant.Api.Tables;

namespace Yenicafe.Tenant.Api.Orders;

public sealed class CustomerBill
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid TableId { get; set; }

    public ServiceTable? Table { get; set; }

    public CustomerBillStatus Status { get; set; } = CustomerBillStatus.Open;

    public int SubtotalMinor { get; set; }

    public string CurrencyCode { get; set; } = "GBP";

    public DateTimeOffset OpenedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? ClosedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CustomerOrder> Orders { get; set; } = new List<CustomerOrder>();
}
