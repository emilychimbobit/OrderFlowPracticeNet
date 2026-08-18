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
    }
}