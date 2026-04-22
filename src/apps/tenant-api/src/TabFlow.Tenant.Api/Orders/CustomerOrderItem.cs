using TabFlow.Tenant.Api.Catalog;

namespace TabFlow.Tenant.Api.Orders;

public sealed class CustomerOrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }

    public CustomerOrder? Order { get; set; }

    public Guid MenuItemId { get; set; }

    public MenuItem? MenuItem { get; set; }

    public int Quantity { get; set; }

    public int UnitPriceMinor { get; set; }

    public int LineTotalMinor { get; set; }

    public string Note { get; set; } = string.Empty;

    public CustomerOrderStatus Status { get; set; } = CustomerOrderStatus.Submitted;
}
