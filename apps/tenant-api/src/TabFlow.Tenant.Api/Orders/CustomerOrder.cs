using TabFlow.Tenant.Api.Tables;

namespace TabFlow.Tenant.Api.Orders;

public sealed class CustomerOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? BillId { get; set; }

    public CustomerBill? Bill { get; set; }

    public Guid? TableId { get; set; }

    public ServiceTable? Table { get; set; }

    public CustomerOrderStatus Status { get; set; } = CustomerOrderStatus.Pending;

    public string Note { get; set; } = string.Empty;

    public int SubtotalMinor { get; set; }

    public string CurrencyCode { get; set; } = "GBP";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<CustomerOrderItem> Items { get; set; } = new List<CustomerOrderItem>();
}
