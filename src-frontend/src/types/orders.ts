export type OrderPriority = 'low' | 'high'
export type OrderStatus = 'created' | 'cancelled'

export interface Order {
  id: string
  customerId: string
  amount: number
  isVip: boolean
  requestedAt: string
  timeZone: string
  priority: OrderPriority
  status: OrderStatus
  createdAt: string
}

export interface CreateOrderInput {
  customerId: string
  amount: number
  isVip: boolean
  requestedAt?: string
  timeZone?: string
  priority?: OrderPriority
}
