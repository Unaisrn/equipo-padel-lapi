'use client'

import { useActionState, useEffect, useState } from 'react'
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

const STATUS_LABEL: Record<string, string> = {
  programado: 'Programado',
  jugado: 'Jugado',
  aplazado: 'Aplazado',
}
const STATUS_BADGE: Record<string, string> = {
  programado: 'badge-blue',
  jugado: 'badge-green',
  aplazado: 'badge-amber',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : 'Guardar'}
    </button>
  )
}

function ViewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-apagado mb-0.5">{label}</dt>
      <dd className="text-sm text-texto">{children}</dd>
    </div>
  )
}

export function MatchForm({ action, match, cancelHref }: Props) {
  const router = useRouter()
  const [state, formAction] = useActionState(action, null)
  const [isEditing, setIsEditing] = useState(!match) // start in edit if creating

  useEffect(() => {
    if (state && 'success' in state) {
      toast.success('Partido guardado')
      if (match) setIsEditing(false)
      router.refresh()
    }
  }, [state, match, router])

  // ── Modo vista ────────────────────────────────────────────────────
  if (!isEditing && match) {
    const dateFormatted = new Date(match.date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    return (
      <div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="sm:col-span-2">
            <ViewField label="Rival">
              <span className="font-medium">{match.opponent}</span>
            </ViewField>
          </div>
          <ViewField label="Fecha">
            <span className="capitalize">{dateFormatted}</span>
          </ViewField>
          <ViewField label="Local / Visitante">
            <span className="capitalize">{match.home_away}</span>
          </ViewField>
          <ViewField label="Sede">
            {match.location ?? '—'}
          </ViewField>
          <ViewField label="Estado">
            <span className={STATUS_BADGE[match.status]}>
              {STATUS_LABEL[match.status]}
            </span>
          </ViewField>
          {match.notes && (
            <div className="sm:col-span-2">
              <ViewField label="Notas">{match.notes}</ViewField>
            </div>
          )}
        </dl>
        <button onClick={() => setIsEditing(true)} className="btn-primary mt-6">
          Editar
        </button>
      </div>
    )
  }

  // ── Modo edición (o formulario de creación) ───────────────────────
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
        {match ? (
          <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
            Cancelar
          </button>
        ) : (
          cancelHref && <Link href={cancelHref} className="btn-secondary">Cancelar</Link>
        )}
      </div>
    </form>
  )
}
