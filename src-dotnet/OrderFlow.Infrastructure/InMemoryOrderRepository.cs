using OrderFlow.Application;
using OrderFlow.Domain;

namespace OrderFlow.Infrastructure;

public sealed class InMemoryOrderRepository : IOrderRepository
{
    private readonly Dictionary<string, Order> orders = [];
    private readonly object sync = new();

    public IReadOnlyList<Order> List()
    {
        lock (sync)
        {
            return orders.Values.ToArray();
        }
    }

    public Order? FindById(string id)
    {
        lock (sync)
        {
            return orders.GetValueOrDefault(id);
        }
    }

    public Order Save(Order order)
    {
        lock (sync)
        {
            orders[order.Id] = order;
            return order;
        }
    }
}