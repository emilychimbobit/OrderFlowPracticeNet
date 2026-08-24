import { render, screen } from '@testing-library/react'
import { OrderList } from './OrderList'
import type { Order } from '../types/orders'

const order: Order = {
  id: 'order-1',
  customerId: 'C-100',
  amount: 250,
  isVip: true,
  requestedAt: '2026-08-14T15:00:00.000Z',
  timeZone: 'America/Guayaquil',
  priority: 'high',
  status: 'created',
  createdAt: '2026-08-14T15:00:00.000Z',
}

describe('OrderList', () => {
  it('renders the empty state when no orders are available', () => {
    render(<OrderList orders={[]} onCreateClick={() => undefined} />)

    expect(screen.getByText(/no hay pedidos registrados/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear pedido/i })).toBeInTheDocument()
  })

  it('renders order data when orders exist', () => {
    render(<OrderList orders={[order]} />)

    expect(screen.getByText('C-100')).toBeInTheDocument()
    expect(screen.getByText(/pedido #order-1/i)).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('created')).toBeInTheDocument()
  })

  it('renders the error state when an error is provided', () => {
    render(<OrderList orders={[]} error="Error backend" onRetry={() => undefined} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/error backend/i)
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })
})
