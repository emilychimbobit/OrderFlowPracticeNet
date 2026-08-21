using System.Globalization;

namespace OrderFlow.Domain;

public static class OrderStatuses
{
    public const string Created = "created";
    public const string Cancelled = "cancelled";
}

public static class OrderPriorities
{
    public const string Low = "low";
    public const string High = "high";

    public static string Normalize(string priority)
    {
        if (string.Equals(priority, Low, StringComparison.OrdinalIgnoreCase))
        {
            return Low;
        }

        if (string.Equals(priority, High, StringComparison.OrdinalIgnoreCase))
        {
            return High;
        }

        throw new ArgumentException("priority must be 'low' or 'high'");
    }
}

public sealed record CreateOrderInput(
    string? CustomerId,
    double Amount,
    bool IsVip = false,
    string? RequestedAt = null,
    string? TimeZone = null,
    string? Priority = null);

public sealed record Order(
    string Id,
    string CustomerId,
    double Amount,
    bool IsVip,
    string RequestedAt,
    string TimeZone,
    string Priority,
    string Status,
    string CreatedAt)
{
    public static Order Create(CreateOrderInput input, DateTimeOffset? now = null)
    {
        if (string.IsNullOrWhiteSpace(input.CustomerId))
        {
            throw new ArgumentException("customerId is required");
        }

        if (!double.IsFinite(input.Amount) || input.Amount <= 0)
        {
            throw new ArgumentException("amount must be greater than zero");
        }

        var timestamp = FormatTimestamp(now ?? DateTimeOffset.UtcNow);

        return new Order(
            Guid.NewGuid().ToString(),
            input.CustomerId.Trim(),
            input.Amount,
            input.IsVip,
            input.RequestedAt ?? timestamp,
            input.TimeZone ?? "UTC",
            input.Priority is null ? OrderPriorities.Low : OrderPriorities.Normalize(input.Priority),
            OrderStatuses.Created,
            timestamp);
    }

    public Order UpdatePriority(string priority) =>
        this with { Priority = OrderPriorities.Normalize(priority) };

    public Order Cancel()
    {
        if (Status == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("order already cancelled");
        }

        if (Priority == OrderPriorities.Low)
        {
            throw new InvalidOperationException("order with low priority cannot be cancelled");
        }

        if (Amount > 1000)
        {
            throw new InvalidOperationException("order amount exceeds 1000");
        }

        return this with { Status = OrderStatuses.Cancelled };
    }

    public bool IsVipCustomer() => IsVip;

    private static string FormatTimestamp(DateTimeOffset value) =>
        value.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
}