import type { Order } from '../types/orders'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { OrderItem } from './OrderItem'

interface OrderListProps {
  orders: Order[]
  error?: string | null
  onRetry?: () => void
  onCreateClick?: () => void
}

export function OrderList({ orders, error, onRetry, onCreateClick }: OrderListProps) {
  if (error && onRetry) {
    return <ErrorState message={error} onRetry={onRetry} />
  }

  if (orders.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />
  }

  return (
    <section className="order-list" aria-label="Listado de pedidos">
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} />
      ))}
    </section>
  )
}
