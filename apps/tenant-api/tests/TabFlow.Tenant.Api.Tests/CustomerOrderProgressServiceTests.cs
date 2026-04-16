using Xunit;
using TabFlow.Tenant.Api.Orders;

namespace TabFlow.Tenant.Api.Tests;

public sealed class CustomerOrderProgressServiceTests
{
    [Fact]
    public void SyncOrderFromItemsCalculatesReadyStateAndSubtotal()
    {
        var order = new CustomerOrder
        {
            Items =
            [
                new CustomerOrderItem { LineTotalMinor = 900, Status = CustomerOrderStatus.Ready },
                new CustomerOrderItem { LineTotalMinor = 1200, Status = CustomerOrderStatus.Cancelled },
                new CustomerOrderItem { LineTotalMinor = 1500, Status = CustomerOrderStatus.Ready }
            ]
        };

        CustomerOrderProgressService.SyncOrderFromItems(order);

        Assert.Equal(CustomerOrderStatus.Ready, order.Status);
        Assert.Equal(2400, order.SubtotalMinor);
    }

    [Fact]
    public void ApplyOrderStatusToItemsServesAllActiveItems()
    {
        var order = new CustomerOrder
        {
            Items =
            [
                new CustomerOrderItem { Status = CustomerOrderStatus.Ready, LineTotalMinor = 900 },
                new CustomerOrderItem { Status = CustomerOrderStatus.Preparing, LineTotalMinor = 1200 }
            ]
        };

        CustomerOrderProgressService.ApplyOrderStatusToItems(order, CustomerOrderStatus.Served);

        Assert.All(order.Items, item => Assert.Equal(CustomerOrderStatus.Served, item.Status));
        Assert.Equal(CustomerOrderStatus.Served, order.Status);
    }
}
