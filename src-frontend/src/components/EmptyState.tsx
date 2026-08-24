interface EmptyStateProps {
  onCreateClick?: () => void
}

export function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <section className="state" aria-live="polite">
      <h3>No hay pedidos registrados</h3>
      <p>Registra el primer pedido para empezar a consultar el tablero de OrderFlow.</p>
      {onCreateClick ? (
        <button className="button button--primary" type="button" onClick={onCreateClick}>
          Crear pedido
        </button>
      ) : null}
    </section>
  )
}
