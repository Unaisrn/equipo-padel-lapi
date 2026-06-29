'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { BatchFeeFormState } from '@/app/cuotas/actions'

type ActionFn = (prevState: BatchFeeFormState, formData: FormData) => Promise<BatchFeeFormState>

interface Props {
  activePlayerCount: number
  action: ActionFn
}

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Creando...' : `Crear cuota para los ${count} jugadores activos`}
    </button>
  )
}

export function BatchFeeForm({ activePlayerCount, action }: Props) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {state && 'error' in state && (
        <div className="alert-error">{state.error}</div>
      )}
      {state && 'success' in state && (
        <div className="alert-success">
          Se han creado {state.count} cuotas correctamente.{' '}
          <Link href="/cuotas" className="font-medium underline hover:no-underline">
            Ver cuotas →
          </Link>
        </div>
      )}

      <div>
        <label htmlFor="concept" className="field-label">
          Concepto <span className="text-rojo">*</span>
        </label>
        <input
          id="concept"
          name="concept"
          type="text"
          required
          placeholder="Ej. Inscripción liga 2026, Cuota marzo..."
          className="field-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="field-label">
            Importe por jugador (€) <span className="text-rojo">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="0.00"
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="due_date" className="field-label">Fecha límite</label>
          <input id="due_date" name="due_date" type="date" className="field-input" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton count={activePlayerCount} />
        <Link href="/cuotas" className="btn-secondary">Cancelar</Link>
      </div>
    </form>
  )
}
