using TabFlow.Tenant.Api.Catalog;

namespace TabFlow.Tenant.Api.Orders;

public static class CustomerOrderFactory
{
    public static CustomerOrder Build(
        Guid? tableId,
        string note,
        string currencyCode,
        IReadOnlyList<MenuItem> menuItems,
        IReadOnlyList<CreateCustomerOrderItemRequest> requestedItems)
    {
        if (requestedItems.Count == 0)
        {
            throw new InvalidOperationException("Order must contain at least one item.");
        }

        var lookup = menuItems.ToDictionary(item => item.Id);
        var order = new CustomerOrder
        {
            TableId = tableId,
            Note = note.Trim(),
            CurrencyCode = currencyCode,
            Status = CustomerOrderStatus.Submitted
        };

        foreach (var requestedItem in requestedItems)
        {
            if (!lookup.TryGetValue(requestedItem.MenuItemId, out var menuItem))
            {
                throw new InvalidOperationException($"Menu item not found: {requestedItem.MenuItemId}");
            }

            if (!menuItem.IsAvailable)
            {
                throw new InvalidOperationException($"Menu item is unavailable: {menuItem.Id}");
            }

            if (requestedItem.Quantity <= 0)
            {
                throw new InvalidOperationException("Item quantity must be greater than zero.");
            }

            var lineTotal = menuItem.PriceMinor * requestedItem.Quantity;
            order.Items.Add(new CustomerOrderItem
            {
                MenuItemId = menuItem.Id,
                Status = CustomerOrderStatus.Submitted,
                Quantity = requestedItem.Quantity,
                UnitPriceMinor = menuItem.PriceMinor,
                LineTotalMinor = lineTotal,
                Note = requestedItem.Note.Trim()
            });
            order.SubtotalMinor += lineTotal;
        }

        return order;
    }
}
