export class InMemoryOrderRepository {
  #orders = new Map();
  list() { return [...this.#orders.values()]; }
  findById(id) { return this.#orders.get(id) ?? null; }
  save(order) { this.#orders.set(order.id, order); return order; }
}
