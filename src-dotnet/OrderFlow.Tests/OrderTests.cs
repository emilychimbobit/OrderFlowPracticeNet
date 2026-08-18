using OrderFlow.Domain;

namespace OrderFlow.Tests;

public sealed class OrderTests
{
    [Fact]
    public void Create_NormalizesCustomerAndAppliesDefaults()
    {
        var now = new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

        var order = Order.Create(new CreateOrderInput(" C-1 ", 10), now);

        Assert.Equal("C-1", order.CustomerId);
        Assert.Equal("normal", order.Priority);
        Assert.Equal(OrderStatuses.Created, order.Status);
        Assert.Equal("2026-01-01T00:00:00.000Z", order.RequestedAt);
        Assert.Equal("2026-01-01T00:00:00.000Z", order.CreatedAt);
        Assert.Equal("UTC", order.TimeZone);
    }

    [Fact]
    public void Create_RejectsMissingCustomer()
    {
        var error = Assert.Throws<ArgumentException>(() =>
            Order.Create(new CreateOrderInput(null, 10)));

        Assert.Contains("customerId", error.Message);
    }

    [Fact]
    public void Create_RejectsNonPositiveAmount()
    {
        var error = Assert.Throws<ArgumentException>(() =>
            Order.Create(new CreateOrderInput("C-1", 0)));

        Assert.Contains("amount", error.Message);
    }

    [Fact]
    public void Cancel_CancelsExistingOrder()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10));

        Assert.Equal(OrderStatuses.Cancelled, order.Cancel().Status);
    }

    [Fact]
    public void Cancel_DoesNotCancelTwice()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10)).Cancel();

        var error = Assert.Throws<InvalidOperationException>(() => order.Cancel());

        Assert.Contains("already", error.Message);
    }
}