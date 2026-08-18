import { randomUUID } from 'node:crypto';

export const ORDER_STATUS = Object.freeze({ CREATED: 'created', CANCELLED: 'cancelled' });

export function createOrder(input, now = new Date()) {
  if (!input?.customerId?.trim()) throw new Error('customerId is required');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('amount must be greater than zero');

  return {
    id: randomUUID(),
    customerId: input.customerId.trim(),
    amount: input.amount,
    isVip: Boolean(input.isVip),
    requestedAt: input.requestedAt ?? now.toISOString(),
    timeZone: input.timeZone ?? 'UTC',
    priority: 'normal',
    status: ORDER_STATUS.CREATED,
    createdAt: now.toISOString()
  };
}

export function cancelOrder(order) {
  if (!order) throw new Error('order not found');
  if (order.status === ORDER_STATUS.CANCELLED) throw new Error('order already cancelled');
  return { ...order, status: ORDER_STATUS.CANCELLED };
}

export function isOrderVip(order) {
  if (!order) throw new Error('order not found');
  return Boolean(order.isVip);
}
