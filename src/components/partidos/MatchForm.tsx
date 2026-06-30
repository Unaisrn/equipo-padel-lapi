'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { MatchFormState } from '@/app/partidos/actions'
import type { Database } from '@/types/database'
import { Spinner } from '@/components/ui/Spinner'

type Match = Database['public']['Tables']['matches']['Row']
type ActionFn = (prevState: MatchFormState, formData: FormData) => Promise<MatchFormState>

interface Props {
  action: ActionFn
  match?: Match
  cancelHref?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : 'Guardar'}
    </button>
  )
}

export function MatchForm({ action, match, cancelHref }: Props) {
  const router = useRouter()
  const [state, formAction] = useActionState(action, null)

  useEffect(() => {
    if (state && 'success' in state) {
      toast.success('Partido guardado')
      router.refresh()
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-5">
      {state && 'error' in state && (
        <div className="alert-error">{state.error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="date" className="field-label">
            Fecha <span className="text-rojo">*</span>
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={match?.date ?? ''}
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="home_away" className="field-label">
            Local / Visitante <span className="text-rojo">*</span>
          </label>
          <select
            id="home_away"
            name="home_away"
            required
            defaultValue={match?.home_away ?? ''}
            className="field-select"
          >
            <option value="" disabled>Seleccionar...</option>
            <option value="local">Local</option>
            <option value="visitante">Visitante</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="opponent" className="field-label">
            Rival <span className="text-rojo">*</span>
          </label>
          <input
            id="opponent"
            name="opponent"
            type="text"
            required
            defaultValue={match?.opponent ?? ''}
            placeholder="Nombre del equipo rival"
            className="field-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="location" className="field-label">Sede</label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={match?.location ?? ''}
            placeholder="Club / instalación (opcional)"
            className="field-input"
          />
        </div>

        {match && (
          <div>
            <label htmlFor="status" className="field-label">Estado</label>
            <select
              id="status"
              name="status"
              defaultValue={match.status}
              className="field-select"
            >
              <option value="programado">Programado</option>
              <option value="jugado">Jugado</option>
              <option value="aplazado">Aplazado</option>
            </select>
          </div>
        )}

        <div className={match ? '' : 'sm:col-span-2'}>
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={match?.notes ?? ''}
            placeholder="Información adicional (opcional)"
            className="field-textarea"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <SubmitButton />
        {cancelHref && (
          <Link href={cancelHref} className="btn-secondary">Cancelar</Link>
        )}
      </div>
    </form>
  )
}
