using System.Globalization;

namespace OrderFlow.Domain;

public static class OrderStatuses
{
    public const string Created = "created";
    public const string Cancelled = "cancelled";
}

public sealed record CreateOrderInput(
    string? CustomerId,
    double Amount,
    bool IsVip = false,
    string? RequestedAt = null,
    string? TimeZone = null);

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
            "normal",
            OrderStatuses.Created,
            timestamp);
    }

    public Order Cancel()
    {
        if (Status == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("order already cancelled");
        }

        return this with { Status = OrderStatuses.Cancelled };
    }

    public bool IsVipCustomer() => IsVip;

    private static string FormatTimestamp(DateTimeOffset value) =>
        value.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
}