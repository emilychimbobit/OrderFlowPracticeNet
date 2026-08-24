import type { Order } from '../types/orders'

interface OrderItemProps {
  order: Order
}

function formatDate(value: string): string {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function OrderItem({ order }: OrderItemProps) {
  return (
    <article className="order-card">
      <div className="order-card__header">
        <div>
          <h3 className="order-card__title">{order.customerId}</h3>
          <p className="hint">Pedido #{order.id}</p>
        </div>
        <span className={`badge badge--status-${order.status}`}>{order.status}</span>
      </div>

      <div className="order-card__meta">
        <strong>{formatAmount(order.amount)}</strong>
        <span className={`badge badge--priority-${order.priority}`}>{order.priority}</span>
      </div>

      <dl className="order-card__details">
        <div>
          <dt>Solicitado</dt>
          <dd>{formatDate(order.requestedAt)}</dd>
        </div>
        <div>
          <dt>Registrado</dt>
          <dd>{formatDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt>Zona horaria</dt>
          <dd>{order.timeZone}</dd>
        </div>
        <div>
          <dt>Cliente VIP</dt>
          <dd>{order.isVip ? 'Sí' : 'No'}</dd>
        </div>
      </dl>
    </article>
  )
}
