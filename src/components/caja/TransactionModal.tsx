'use client'

import { useActionState, useEffect, useCallback } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createTransaction, updateTransaction } from '@/app/caja/actions'
import type { TransactionFormState } from '@/app/caja/actions'
import type { TransactionWithPlayer } from './TransactionList'
import { Spinner } from '@/components/ui/Spinner'

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : isEdit ? 'Guardar cambios' : 'Añadir movimiento'}
    </button>
  )
}

interface Props {
  transaction?: TransactionWithPlayer
  onClose: () => void
}

export function TransactionModal({ transaction, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!transaction
  const today = new Date().toISOString().split('T')[0]

  const [state, formAction] = useActionState(
    isEdit
      ? (updateTransaction.bind(null, transaction!.id) as (
          prevState: TransactionFormState,
          formData: FormData
        ) => Promise<TransactionFormState>)
      : createTransaction,
    null
  )

  useEffect(() => {
    if (state && 'success' in state) {
      toast.success(isEdit ? 'Movimiento actualizado' : 'Movimiento añadido')
      router.refresh()
      onClose()
    }
  }, [state, isEdit, onClose, router])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-texto mb-5">
          {isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}
        </h2>

        {state && 'error' in state && (
          <div className="alert-error mb-4">{state.error}</div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="type" className="field-label">
              Tipo <span className="text-rojo">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue={transaction?.type ?? ''}
              className="field-select"
            >
              {!isEdit && <option value="" disabled>Seleccionar...</option>}
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
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
              defaultValue={transaction?.concept ?? ''}
              placeholder="Ej. Alquiler pista, Bote de bolas..."
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
                defaultValue={transaction?.amount ?? ''}
                placeholder="0.00"
                className="field-input"
              />
            </div>

            <div>
              <label htmlFor="date" className="field-label">
                Fecha <span className="text-rojo">*</span>
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={transaction?.date ?? today}
                className="field-input"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <SubmitButton isEdit={isEdit} />
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
