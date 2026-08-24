interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section className="state" role="alert" aria-live="assertive">
      <h3>No se pudieron cargar los pedidos</h3>
      <p>{message}</p>
      <button className="button button--secondary" type="button" onClick={onRetry}>
        Reintentar
      </button>
    </section>
  )
}
