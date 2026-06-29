'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { markAsPaid } from '@/app/cuotas/actions'
import type { FeeFormState } from '@/app/cuotas/actions'
import type { Database } from '@/types/database'

export type FeeWithPlayer = Database['public']['Tables']['player_fees']['Row'] & {
  players: { full_name: string } | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? 'Guardando...' : 'Confirmar pago'}
    </button>
  )
}

interface Props {
  fee: FeeWithPlayer
  onClose: () => void
}

export function MarkPaidModal({ fee, onClose }: Props) {
  const router = useRouter()
  const [state, formAction] = useActionState(
    markAsPaid.bind(null, fee.id) as (prevState: FeeFormState, formData: FormData) => Promise<FeeFormState>,
    null
  )
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (state && 'success' in state) {
      router.refresh()
      onClose()
    }
  }, [state, onClose, router])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-texto mb-1">Marcar como pagado</h2>
        <p className="text-sm text-apagado mb-5">
          <span className="font-medium text-texto">{fee.players?.full_name}</span>
          {' · '}
          {fee.concept}
          {' · '}
          <span className="font-mono font-medium text-texto">{fee.amount.toFixed(2)} €</span>
        </p>

        {state && 'error' in state && (
          <div className="alert-error mb-4">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="payment_method" className="field-label">
              Método de pago <span className="text-rojo">*</span>
            </label>
            <select
              id="payment_method"
              name="payment_method"
              required
              defaultValue=""
              className="field-select"
            >
              <option value="" disabled>Seleccionar...</option>
              <option value="efectivo">Efectivo</option>
              <option value="bizum">Bizum</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="paid_at" className="field-label">Fecha de pago</label>
            <input
              id="paid_at"
              name="paid_at"
              type="date"
              defaultValue={today}
              className="field-input"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <SubmitButton />
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
