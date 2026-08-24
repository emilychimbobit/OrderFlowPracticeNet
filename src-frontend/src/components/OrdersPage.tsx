import { useRef } from 'react'
import { useCreateOrder } from '../hooks/useCreateOrder'
import { useOrders } from '../hooks/useOrders'
import { LoadingState } from './LoadingState'
import { NewOrderForm } from './NewOrderForm'
import { OrderList } from './OrderList'

export function OrdersPage() {
  const { data, loading, error, refresh } = useOrders()
  const {
    data: createdOrder,
    loading: creating,
    error: createError,
    submit,
    clearFeedback,
  } = useCreateOrder()
  const formPanelRef = useRef<HTMLElement | null>(null)

  async function handleCreated() {
    await refresh()
  }

  function focusForm() {
    formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="hero">
          <p className="hero__eyebrow">OrderFlow</p>
          <h1>Consulta pedidos y registra nuevos ingresos sin salir del tablero.</h1>
          <p className="hero__description">
            La interfaz consume los endpoints reales del backend .NET para listar pedidos y crear
            registros con validaciones claras, feedback accesible y diseño responsive.
          </p>
        </header>

        <section className="layout">
          <article className="panel panel--form" ref={formPanelRef}>
            <div className="panel__header">
              <div>
                <h2>Nuevo pedido</h2>
                <p>Completa solo los campos que soporta el backend existente.</p>
              </div>
            </div>

            <NewOrderForm
              loading={creating}
              error={createError}
              successOrder={createdOrder}
              onSubmit={submit}
              onCreated={handleCreated}
              onInteract={clearFeedback}
            />
          </article>

          <article className="panel panel--list">
            <div className="panel__header">
              <div>
                <h2>Pedidos registrados</h2>
                <p>Vista actual de pedidos persistidos en memoria por el backend.</p>
              </div>

              <div className="actions-inline">
                <button className="button button--ghost" type="button" onClick={() => void refresh()}>
                  Actualizar
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : (
              <OrderList
                orders={data}
                error={error}
                onRetry={() => void refresh()}
                onCreateClick={focusForm}
              />
            )}
          </article>
        </section>
      </div>
    </main>
  )
}
