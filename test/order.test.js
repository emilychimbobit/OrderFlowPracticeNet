import test from 'node:test';
import assert from 'node:assert/strict';
import { cancelOrder, createOrder } from '../src/domain/order.js';
import { InMemoryOrderRepository } from '../src/repositories/inMemoryOrderRepository.js';
import { OrderService } from '../src/services/orderService.js';

test('creates an order with normalized defaults', () => {
  const order = createOrder({ customerId: ' C-1 ', amount: 10 }, new Date('2026-01-01T00:00:00Z'));
  assert.equal(order.customerId, 'C-1');
  assert.equal(order.priority, 'normal');
  assert.equal(order.status, 'created');
});
test('rejects missing customer', () => assert.throws(() => createOrder({ amount: 10 }), /customerId/));
test('rejects non-positive amount', () => assert.throws(() => createOrder({ customerId: 'C-1', amount: 0 }), /amount/));
test('cancels an existing order', () => assert.equal(cancelOrder({ id: '1', status: 'created' }).status, 'cancelled'));
test('does not cancel twice', () => assert.throws(() => cancelOrder({ id: '1', status: 'cancelled' }), /already/));
test('repository returns null for unknown id', () => assert.equal(new InMemoryOrderRepository().findById('x'), null));
test('service persists created orders', () => {
  const service = new OrderService(new InMemoryOrderRepository());
  service.create({ customerId: 'C-1', amount: 10 });
  assert.equal(service.list().length, 1);
});
