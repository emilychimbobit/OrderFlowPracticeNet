using OrderFlow.Domain;

namespace OrderFlow.Application;

public sealed class OrderService(IOrderRepository repository)
{
    public IReadOnlyList<Order> List() => repository.List();

    public Order Create(CreateOrderInput input) => repository.Save(Order.Create(input));

    public Order Cancel(string id)
    {
        var order = repository.FindById(id)
            ?? throw new InvalidOperationException("order not found");

        return repository.Save(order.Cancel());
    }
}