import { useCallback, useEffect, useState } from 'react'
import { ApiError, listOrders } from '../api/ordersClient'
import type { Order } from '../types/orders'

export interface OrdersState {
  data: Order[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useOrders(): OrdersState {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const orders = await listOrders()
      setData(orders)
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message)
      } else {
        setError('No fue posible cargar los pedidos.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
