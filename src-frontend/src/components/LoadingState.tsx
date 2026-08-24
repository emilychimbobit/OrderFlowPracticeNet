export function LoadingState() {
  return (
    <section className="state loading-state" aria-live="polite" aria-busy="true">
      <h3>Cargando pedidos</h3>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </section>
  )
}
