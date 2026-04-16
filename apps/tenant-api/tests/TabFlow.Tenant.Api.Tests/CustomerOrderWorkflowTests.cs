using Xunit;
using TabFlow.Tenant.Api.Orders;

namespace TabFlow.Tenant.Api.Tests;

public sealed class CustomerOrderWorkflowTests
{
    [Theory]
    [InlineData(CustomerOrderStatus.Submitted, CustomerOrderStatus.Preparing, true)]
    [InlineData(CustomerOrderStatus.Submitted, CustomerOrderStatus.Cancelled, true)]
    [InlineData(CustomerOrderStatus.Submitted, CustomerOrderStatus.Ready, false)]
    [InlineData(CustomerOrderStatus.Ready, CustomerOrderStatus.Served, true)]
    [InlineData(CustomerOrderStatus.Served, CustomerOrderStatus.Cancelled, false)]
    [InlineData(CustomerOrderStatus.Cancelled, CustomerOrderStatus.Submitted, false)]
    public void CanTransitionEnforcesExpectedWorkflow(
        CustomerOrderStatus current,
        CustomerOrderStatus next,
        bool expected)
    {
        Assert.Equal(expected, CustomerOrderWorkflow.CanTransition(current, next));
    }

    [Fact]
    public void AllowedNextStatusesForReadyAreStable()
    {
        var next = CustomerOrderWorkflow.GetAllowedNextStatuses(CustomerOrderStatus.Ready);

        Assert.Equal([CustomerOrderStatus.Served, CustomerOrderStatus.Cancelled], next);
    }
}
