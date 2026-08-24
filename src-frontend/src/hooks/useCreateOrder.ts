import { useState } from 'react'
import { ApiError, createOrder } from '../api/ordersClient'
import type { CreateOrderInput, Order } from '../types/orders'

export interface CreateOrderState {
  data: Order | null
  loading: boolean
  error: string | null
  submit: (input: CreateOrderInput) => Promise<Order | null>
  clearFeedback: () => void
}

export function useCreateOrder(): CreateOrderState {
  const [data, setData] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(input: CreateOrderInput): Promise<Order | null> {
    setLoading(true)
    setError(null)

    try {
      const createdOrder = await createOrder(input)
      setData(createdOrder)
      return createdOrder
    } catch (caughtError) {
      if (caughtError instanceof ApiError && [400, 409].includes(caughtError.status)) {
        setError(caughtError.message)
      } else {
        setError('No fue posible registrar el pedido.')
      }

      return null
    } finally {
      setLoading(false)
    }
  }

  function clearFeedback() {
    setData(null)
    setError(null)
  }

  return { data, loading, error, submit, clearFeedback }
}
