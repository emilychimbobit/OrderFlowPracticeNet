using OrderFlow.Domain;

namespace OrderFlow.Application;

public interface IOrderRepository
{
    IReadOnlyList<Order> List();
    Order? FindById(string id);
    Order Save(Order order);
}