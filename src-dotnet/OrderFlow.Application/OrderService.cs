using OrderFlow.Domain;

namespace OrderFlow.Application;

public sealed class OrderService(IOrderRepository repository)
{
    public IReadOnlyList<Order> List(string? priority = null, double? amount = null)
    {
        if (priority is not null && amount is not null)
        {
            throw new ArgumentException("priority and amount filters are mutually exclusive");
        }

        if (amount is not null)
        {
            if (!double.IsFinite(amount.Value) || amount.Value <= 0)
            {
                throw new ArgumentException("amount must be greater than zero");
            }

            return repository.List()
                .Where(order => order.Amount == amount.Value)
                .ToArray();
        }

        if (priority is null)
        {
            return repository.List();
        }

        var normalizedPriority = OrderPriorities.Normalize(priority);
        return repository.List()
            .Where(order => order.Priority == normalizedPriority)
            .ToArray();
    }

    public Order Create(CreateOrderInput input) => repository.Save(Order.Create(input));

    public Order UpdatePriority(string id, string? priority)
    {
        var order = repository.FindById(id)
            ?? throw new InvalidOperationException("order not found");

        return priority is null
            ? order
            : repository.Save(order.UpdatePriority(priority));
    }

    public Order Cancel(string id)
    {
        var order = repository.FindById(id)
            ?? throw new InvalidOperationException("order not found");

        return repository.Save(order.Cancel());
    }
}