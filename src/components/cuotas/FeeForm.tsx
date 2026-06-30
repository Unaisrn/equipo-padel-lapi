'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import type { Database } from '@/types/database'
import type { FeeFormState } from '@/app/cuotas/actions'
import { Spinner } from '@/components/ui/Spinner'

type Player = Pick<Database['public']['Tables']['players']['Row'], 'id' | 'full_name'>
type ActionFn = (prevState: FeeFormState, formData: FormData) => Promise<FeeFormState>

interface Props {
  players: Player[]
  action: ActionFn
  defaultPlayerId?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : 'Crear cuota'}
    </button>
  )
}

export function FeeForm({ players, action, defaultPlayerId }: Props) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {state && 'error' in state && (
        <div className="alert-error">{state.error}</div>
      )}

      <div>
        <label htmlFor="player_id" className="field-label">
          Jugador <span className="text-rojo">*</span>
        </label>
        <select id="player_id" name="player_id" required defaultValue={defaultPlayerId ?? ''} className="field-select">
          <option value="" disabled>Seleccionar jugador...</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

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
            Importe (€) <span className="text-rojo">*</span>
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
        <SubmitButton />
        <Link href="/cuotas" className="btn-secondary">Cancelar</Link>
      </div>
    </form>
  )
}
