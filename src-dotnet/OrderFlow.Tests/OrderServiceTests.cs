using OrderFlow.Application;
using OrderFlow.Infrastructure;

namespace OrderFlow.Tests;

public sealed class OrderServiceTests
{
    [Fact]
    public void Repository_ReturnsNullForUnknownId()
    {
        Assert.Null(new InMemoryOrderRepository().FindById("x"));
    }

    [Fact]
    public void Service_PersistsCreatedOrders()
    {
        var service = new OrderService(new InMemoryOrderRepository());

        service.Create(new("C-1", 10));

        Assert.Single(service.List());
        Assert.Equal("low", service.List()[0].Priority);
    }

    [Fact]
    public void Service_FiltersOrdersByNormalizedPriority()
    {
        var service = new OrderService(new InMemoryOrderRepository());
        service.Create(new("C-1", 10));
        service.Create(new("C-2", 20, Priority: "HIGH"));

        var lowOrders = service.List("LOW");
        var highOrders = service.List("high");

        Assert.Single(lowOrders);
        Assert.Equal("C-1", lowOrders[0].CustomerId);
        Assert.Single(highOrders);
        Assert.Equal("C-2", highOrders[0].CustomerId);
    }

    [Fact]
    public void Service_RejectsInvalidPriorityFilter()
    {
        var service = new OrderService(new InMemoryOrderRepository());

        var error = Assert.Throws<ArgumentException>(() => service.List("medium"));

        Assert.Contains("priority", error.Message);
    }

    [Fact]
    public void Service_UpdatesPriorityAndPersistsIt()
    {
        var service = new OrderService(new InMemoryOrderRepository());
        var order = service.Create(new("C-1", 10));

        var updated = service.UpdatePriority(order.Id, "HIGH");

        Assert.Equal("high", updated.Priority);
        Assert.Equal("high", service.List()[0].Priority);
    }

    [Fact]
    public void Service_PreservesPriorityWhenUpdateOmitsIt()
    {
        var service = new OrderService(new InMemoryOrderRepository());
        var order = service.Create(new("C-1", 10, Priority: "high"));

        var updated = service.UpdatePriority(order.Id, null);

        Assert.Equal("high", updated.Priority);
    }

    [Fact]
    public void Service_RejectsPriorityUpdateForUnknownOrder()
    {
        var service = new OrderService(new InMemoryOrderRepository());

        var error = Assert.Throws<InvalidOperationException>(() =>
            service.UpdatePriority("missing", "low"));

        Assert.Contains("not found", error.Message);
    }
}