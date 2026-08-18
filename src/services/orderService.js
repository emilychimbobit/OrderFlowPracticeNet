import { cancelOrder, createOrder } from '../domain/order.js';

export class OrderService {
  constructor(repository) { this.repository = repository; }
  list() { return this.repository.list(); }
  create(input) { return this.repository.save(createOrder(input)); }
  cancel(id) {
    const updated = cancelOrder(this.repository.findById(id));
    return this.repository.save(updated);
  }
}
