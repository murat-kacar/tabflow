namespace TabFlow.Tenant.Api.Orders;

public static class CustomerOrderWorkflow
{
    public static IReadOnlyList<CustomerOrderStatus> GetAllowedNextStatuses(CustomerOrderStatus currentStatus) =>
        currentStatus switch
        {
            CustomerOrderStatus.Pending => [CustomerOrderStatus.Submitted, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Submitted => [CustomerOrderStatus.Preparing, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Preparing => [CustomerOrderStatus.Ready, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Ready => [CustomerOrderStatus.Served, CustomerOrderStatus.Cancelled],
            CustomerOrderStatus.Served => [],
            CustomerOrderStatus.Cancelled => [],
            _ => []
        };

    public static bool CanTransition(CustomerOrderStatus currentStatus, CustomerOrderStatus nextStatus) =>
        GetAllowedNextStatuses(currentStatus).Contains(nextStatus);
}
