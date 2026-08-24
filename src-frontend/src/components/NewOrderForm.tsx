import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { CreateOrderInput, Order } from '../types/orders'

const customerIdMaxLength = 50
const timeZoneMaxLength = 100

interface FormValues {
  customerId: string
  amount: string
  priority: 'low' | 'high'
  timeZone: string
  requestedAt: string
  isVip: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>

interface NewOrderFormProps {
  loading: boolean
  error: string | null
  successOrder: Order | null
  onSubmit: (input: CreateOrderInput) => Promise<Order | null>
  onCreated?: (order: Order) => void | Promise<void>
  onInteract?: () => void
}

function getDefaultTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function buildPayload(values: FormValues): CreateOrderInput {
  const payload: CreateOrderInput = {
    customerId: values.customerId.trim(),
    amount: Number(values.amount),
    isVip: values.isVip,
    priority: values.priority,
  }

  const trimmedTimeZone = values.timeZone.trim()

  if (trimmedTimeZone.length > 0) {
    payload.timeZone = trimmedTimeZone
  }

  if (values.requestedAt.length > 0) {
    payload.requestedAt = new Date(values.requestedAt).toISOString()
  }

  return payload
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const trimmedCustomerId = values.customerId.trim()
  const trimmedTimeZone = values.timeZone.trim()
  const parsedAmount = Number(values.amount)

  if (trimmedCustomerId.length === 0) {
    errors.customerId = 'El identificador del cliente es obligatorio.'
  } else if (trimmedCustomerId.length > customerIdMaxLength) {
    errors.customerId = `El identificador no puede superar ${customerIdMaxLength} caracteres.`
  }

  if (values.amount.trim().length === 0) {
    errors.amount = 'El monto es obligatorio.'
  } else if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'El monto debe ser numérico y mayor que 0.'
  }

  if (trimmedTimeZone.length > timeZoneMaxLength) {
    errors.timeZone = `La zona horaria no puede superar ${timeZoneMaxLength} caracteres.`
  }

  if (values.requestedAt.length > 0 && Number.isNaN(new Date(values.requestedAt).getTime())) {
    errors.requestedAt = 'La fecha solicitada no es válida.'
  }

  return errors
}

const initialValues: FormValues = {
  customerId: '',
  amount: '',
  priority: 'low',
  timeZone: getDefaultTimeZone(),
  requestedAt: '',
  isVip: false,
}

export function NewOrderForm({
  loading,
  error,
  successOrder,
  onSubmit,
  onCreated,
  onInteract,
}: NewOrderFormProps) {
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (successOrder) {
      setValues(initialValues)
      setErrors({})
    }
  }, [successOrder])

  const successMessage = useMemo(() => {
    if (!successOrder) {
      return null
    }

    return `Pedido ${successOrder.customerId} registrado correctamente.`
  }, [successOrder])

  function updateValue<Key extends keyof FormValues>(key: Key, value: FormValues[Key]) {
    onInteract?.()
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    const createdOrder = await onSubmit(buildPayload(values))

    if (createdOrder) {
      await onCreated?.(createdOrder)
    }
  }

  return (
    <form className="form" noValidate onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="customerId">Cliente</label>
          <input
            id="customerId"
            className="input"
            name="customerId"
            maxLength={customerIdMaxLength}
            value={values.customerId}
            onChange={(event) => updateValue('customerId', event.target.value)}
          />
          <span className="field-error" role={errors.customerId ? 'alert' : undefined}>
            {errors.customerId ?? ''}
          </span>
        </div>

        <div className="field">
          <label htmlFor="amount">Monto</label>
          <input
            id="amount"
            className="input"
            name="amount"
            inputMode="decimal"
            type="number"
            min="0.01"
            step="0.01"
            value={values.amount}
            onChange={(event) => updateValue('amount', event.target.value)}
          />
          <span className="field-error" role={errors.amount ? 'alert' : undefined}>
            {errors.amount ?? ''}
          </span>
        </div>

        <div className="field">
          <label htmlFor="priority">Prioridad</label>
          <select
            id="priority"
            className="select"
            name="priority"
            value={values.priority}
            onChange={(event) => updateValue('priority', event.target.value as 'low' | 'high')}
          >
            <option value="low">low</option>
            <option value="high">high</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="requestedAt">Fecha solicitada</label>
          <input
            id="requestedAt"
            className="input"
            name="requestedAt"
            type="datetime-local"
            value={values.requestedAt}
            onChange={(event) => updateValue('requestedAt', event.target.value)}
          />
          <span className="field-error" role={errors.requestedAt ? 'alert' : undefined}>
            {errors.requestedAt ?? ''}
          </span>
        </div>

        <div className="field">
          <label htmlFor="timeZone">Zona horaria</label>
          <input
            id="timeZone"
            className="input"
            name="timeZone"
            maxLength={timeZoneMaxLength}
            value={values.timeZone}
            onChange={(event) => updateValue('timeZone', event.target.value)}
          />
          <span className="field-error" role={errors.timeZone ? 'alert' : undefined}>
            {errors.timeZone ?? ''}
          </span>
        </div>

        <div className="checkbox-field">
          <input
            id="isVip"
            className="checkbox"
            name="isVip"
            type="checkbox"
            checked={values.isVip}
            onChange={(event) => updateValue('isVip', event.target.checked)}
          />
          <label htmlFor="isVip">Cliente VIP</label>
        </div>
      </div>

      <p className="hint">
        Los pedidos se registran usando los contratos existentes del backend .NET.
      </p>

      {error ? (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="form-message form-message--success" role="status">
          {successMessage}
        </p>
      ) : null}

      <button className="button button--primary button--full" type="submit" disabled={loading}>
        {loading ? 'Registrando pedido…' : 'Registrar pedido'}
      </button>
    </form>
  )
}
