using Xunit;
using TabFlow.Tenant.Api.Catalog;
using TabFlow.Tenant.Api.Orders;

namespace TabFlow.Tenant.Api.Tests;

public sealed class CustomerOrderFactoryTests
{
    [Fact]
    public void BuildCalculatesSubtotalAndLineTotals()
    {
        var espressoId = Guid.NewGuid();
        var latteId = Guid.NewGuid();
        var menuItems = new[]
        {
            new MenuItem { Id = espressoId, Name = "Espresso", PriceMinor = 900, CurrencyCode = "GBP" },
            new MenuItem { Id = latteId, Name = "Latte", PriceMinor = 1200, CurrencyCode = "GBP" }
        };

        var order = CustomerOrderFactory.Build(
            Guid.NewGuid(),
            "Az sekerli",
            "GBP",
            menuItems,
            new[]
            {
                new CreateCustomerOrderItemRequest(espressoId, 2, ""),
                new CreateCustomerOrderItemRequest(latteId, 1, "Yulaf sut")
            });

        Assert.Equal(CustomerOrderStatus.Submitted, order.Status);
        Assert.Equal(3000, order.SubtotalMinor);
        Assert.Equal(2, order.Items.Count);
        Assert.All(order.Items, item => Assert.Null(item.MenuItem));
    }

    [Fact]
    public void BuildRejectsUnavailableItems()
    {
        var menuItem = new MenuItem
        {
            Id = Guid.NewGuid(),
            Name = "Cheesecake",
            PriceMinor = 1500,
            CurrencyCode = "GBP",
            IsAvailable = false
        };

        var exception = Assert.Throws<InvalidOperationException>(() =>
            CustomerOrderFactory.Build(
                null,
                "",
                "GBP",
                new[] { menuItem },
                new[] { new CreateCustomerOrderItemRequest(menuItem.Id, 1, "") }));

        Assert.Contains("unavailable", exception.Message);
    }
}
