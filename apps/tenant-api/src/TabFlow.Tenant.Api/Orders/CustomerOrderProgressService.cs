namespace TabFlow.Tenant.Api.Orders;

public static class CustomerOrderProgressService
{
    public static void SyncOrderFromItems(CustomerOrder order)
    {
        if (order.Items.Count == 0)
        {
            order.Status = CustomerOrderStatus.Cancelled;
            order.SubtotalMinor = 0;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            return;
        }

        order.SubtotalMinor = order.Items
            .Where(item => item.Status != CustomerOrderStatus.Cancelled)
            .Sum(item => item.LineTotalMinor);

        var activeItems = order.Items
            .Where(item => item.Status != CustomerOrderStatus.Cancelled)
            .ToArray();

        order.Status = activeItems.Length switch
        {
            0 => CustomerOrderStatus.Cancelled,
            _ when activeItems.All(item => item.Status == CustomerOrderStatus.Served) => CustomerOrderStatus.Served,
            _ when activeItems.All(item => item.Status is CustomerOrderStatus.Ready or CustomerOrderStatus.Served) => CustomerOrderStatus.Ready,
            _ when activeItems.Any(item => item.Status == CustomerOrderStatus.Preparing) => CustomerOrderStatus.Preparing,
            _ => CustomerOrderStatus.Submitted
        };

        order.UpdatedAt = DateTimeOffset.UtcNow;
    }

    public static void ApplyOrderStatusToItems(CustomerOrder order, CustomerOrderStatus targetStatus)
    {
        foreach (var item in order.Items)
        {
            switch (targetStatus)
            {
                case CustomerOrderStatus.Preparing when item.Status == CustomerOrderStatus.Submitted:
                    item.Status = CustomerOrderStatus.Preparing;
                    break;
                case CustomerOrderStatus.Ready when item.Status is CustomerOrderStatus.Submitted or CustomerOrderStatus.Preparing:
                    item.Status = CustomerOrderStatus.Ready;
                    break;
                case CustomerOrderStatus.Served when item.Status != CustomerOrderStatus.Cancelled:
                    item.Status = CustomerOrderStatus.Served;
                    break;
                case CustomerOrderStatus.Cancelled when item.Status != CustomerOrderStatus.Served:
                    item.Status = CustomerOrderStatus.Cancelled;
                    break;
            }
        }

        SyncOrderFromItems(order);
    }

    public static IReadOnlyList<CustomerOrderStatus> GetAllowedKitchenItemStatuses(CustomerOrderStatus currentStatus) =>
        currentStatus switch
        {
            CustomerOrderStatus.Submitted => [CustomerOrderStatus.Preparing, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Preparing => [CustomerOrderStatus.Ready, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Ready => [CustomerOrderStatus.Preparing],
            _ => []
        };
}
