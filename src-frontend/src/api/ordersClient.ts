import type { CreateOrderInput, Order } from '../types/orders'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl = import.meta.env.DEV
  ? '/api'
  : configuredBaseUrl && configuredBaseUrl.length > 0
    ? configuredBaseUrl
    : '/api'

interface ErrorPayload {
  error?: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)

  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null
    throw new ApiError(payload?.error ?? 'No se pudo completar la solicitud.', response.status)
  }

  return (await response.json()) as T
}

export function listOrders(): Promise<Order[]> {
  return request<Order[]>('/orders')
}

export function createOrder(input: CreateOrderInput): Promise<Order> {
  return request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
