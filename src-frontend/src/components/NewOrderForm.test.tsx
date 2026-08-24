import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewOrderForm } from './NewOrderForm'
import type { CreateOrderInput, Order } from '../types/orders'

describe('NewOrderForm', () => {
  it('blocks submit when the form is invalid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn<(_: CreateOrderInput) => Promise<Order | null>>()

    render(
      <NewOrderForm
        loading={false}
        error={null}
        successOrder={null}
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole('button', { name: /registrar pedido/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText(/el identificador del cliente es obligatorio/i)).toBeInTheDocument()
    expect(screen.getByText(/el monto es obligatorio/i)).toBeInTheDocument()
  })

  it('submits normalized payload when the form is valid', async () => {
    const user = userEvent.setup()
    const createdOrder: Order = {
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
    const onSubmit = vi.fn(async () => createdOrder)

    render(
      <NewOrderForm
        loading={false}
        error={null}
        successOrder={null}
        onSubmit={onSubmit}
      />,
    )

    await user.type(screen.getByLabelText(/^cliente$/i), ' C-100 ')
    await user.type(screen.getByLabelText(/monto/i), '250')
    await user.selectOptions(screen.getByLabelText(/prioridad/i), 'high')
    await user.clear(screen.getByLabelText(/zona horaria/i))
    await user.type(screen.getByLabelText(/zona horaria/i), 'America/Guayaquil')
    await user.click(screen.getByLabelText(/cliente vip/i))

    await user.click(screen.getByRole('button', { name: /registrar pedido/i }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      customerId: 'C-100',
      amount: 250,
      isVip: true,
      priority: 'high',
      timeZone: 'America/Guayaquil',
    })
  })
})
