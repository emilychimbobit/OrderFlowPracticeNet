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
        Assert.Equal(OrderPriorities.Low, order.Priority);
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

    [Theory]
    [InlineData("low", OrderPriorities.Low)]
    [InlineData("LOW", OrderPriorities.Low)]
    [InlineData("High", OrderPriorities.High)]
    [InlineData("high", OrderPriorities.High)]
    public void Create_NormalizesValidPriority(string priority, string expected)
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10, Priority: priority));

        Assert.Equal(expected, order.Priority);
    }

    [Theory]
    [InlineData("medium")]
    [InlineData("normal")]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("urgent")]
    public void Create_RejectsInvalidPriority(string priority)
    {
        var error = Assert.Throws<ArgumentException>(() =>
            Order.Create(new CreateOrderInput("C-1", 10, Priority: priority)));

        Assert.Contains("priority", error.Message);
    }

    [Fact]
    public void UpdatePriority_NormalizesPriorityWithoutChangingOrder()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10));

        var updated = order.UpdatePriority("HIGH");

        Assert.Equal(OrderPriorities.High, updated.Priority);
        Assert.Equal(order.Id, updated.Id);
        Assert.Equal(order.CustomerId, updated.CustomerId);
        Assert.Equal(order.Status, updated.Status);
    }

    [Fact]
    public void Cancel_CancelsExistingOrder()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10, Priority: "high"));

        Assert.Equal(OrderStatuses.Cancelled, order.Cancel().Status);
    }

    [Fact]
    public void Cancel_DoesNotCancelTwice()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10, Priority: "high")).Cancel();

        var error = Assert.Throws<InvalidOperationException>(() => order.Cancel());

        Assert.Contains("already", error.Message);
    }

    [Fact]
    public void Cancel_AllowsWhenAmountEqualsLimit()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 1000, Priority: "high"));

        Assert.Equal(OrderStatuses.Cancelled, order.Cancel().Status);
    }

    [Fact]
    public void Cancel_RejectsWhenAmountExceedsLimit()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 1500, Priority: "high"));

        var error = Assert.Throws<InvalidOperationException>(() => order.Cancel());

        Assert.Contains("exceeds 1000", error.Message);
    }

    [Fact]
    public void Cancel_RejectsWhenPriorityIsLow()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10));

        var error = Assert.Throws<InvalidOperationException>(() => order.Cancel());

        Assert.Contains("low priority", error.Message);
    }

    [Fact]
    public void Cancel_AllowsWhenPriorityIsHigh()
    {
        var order = Order.Create(new CreateOrderInput("C-1", 10, Priority: "HIGH"));

        Assert.Equal(OrderStatuses.Cancelled, order.Cancel().Status);
    }
}