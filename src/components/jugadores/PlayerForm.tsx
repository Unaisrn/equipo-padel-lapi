'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import type { PlayerFormState } from '@/app/jugadores/actions'
import { Spinner } from '@/components/ui/Spinner'

type Player = Database['public']['Tables']['players']['Row']
type ActionFn = (prevState: PlayerFormState, formData: FormData) => Promise<PlayerFormState>

interface Props {
  action: ActionFn
  player?: Player
  cancelHref?: string
}

const POSITION_LABELS: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : 'Guardar'}
    </button>
  )
}

function ViewField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-apagado mb-0.5">{label}</dt>
      <dd className="text-sm text-texto">{value || '—'}</dd>
    </div>
  )
}

export function PlayerForm({ action, player, cancelHref = '/jugadores' }: Props) {
  const router = useRouter()
  const [state, formAction] = useActionState(action, null)
  const [isEditing, setIsEditing] = useState(!player) // start in edit if creating
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (state && 'success' in state) {
      if (player) {
        toast.success('Jugador actualizado')
        setIsEditing(false)
        router.refresh()
      } else {
        toast.success('Jugador añadido')
        router.push('/jugadores')
      }
    }
  }, [state, player, router])

  // ── Modo vista ────────────────────────────────────────────────────
  if (!isEditing && player) {
    const joinedFormatted = player.joined_at
      ? new Date(player.joined_at + 'T00:00:00').toLocaleDateString('es-ES')
      : null

    return (
      <div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="sm:col-span-2">
            <ViewField label="Nombre completo" value={player.full_name} />
          </div>
          <ViewField label="Teléfono" value={player.phone} />
          <ViewField label="Email" value={player.email} />
          <ViewField
            label="Posición"
            value={player.position ? POSITION_LABELS[player.position] : null}
          />
          <ViewField label="Nivel / Categoría" value={player.level} />
          <ViewField label="Fecha de alta" value={joinedFormatted} />
          {player.notes && (
            <div className="sm:col-span-2">
              <ViewField label="Notas" value={player.notes} />
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
        <div className="sm:col-span-2">
          <label htmlFor="full_name" className="field-label">
            Nombre completo <span className="text-rojo">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            defaultValue={player?.full_name ?? ''}
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="phone" className="field-label">Teléfono</label>
          <input id="phone" name="phone" type="tel" defaultValue={player?.phone ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" defaultValue={player?.email ?? ''} className="field-input" />
        </div>

        <div>
          <label htmlFor="position" className="field-label">Posición</label>
          <select id="position" name="position" defaultValue={player?.position ?? ''} className="field-select">
            <option value="">No especificada</option>
            <option value="drive">Drive</option>
            <option value="reves">Revés</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        <div>
          <label htmlFor="level" className="field-label">Nivel / Categoría</label>
          <input
            id="level"
            name="level"
            type="text"
            defaultValue={player?.level ?? ''}
            placeholder="Ej. 2ª, A, principiante..."
            className="field-input"
          />
        </div>

        <div>
          <label htmlFor="joined_at" className="field-label">
            Fecha de alta <span className="text-rojo">*</span>
          </label>
          <input
            id="joined_at"
            name="joined_at"
            type="date"
            required
            defaultValue={player?.joined_at ?? today}
            className="field-input"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={player?.notes ?? ''}
            className="field-textarea"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        {player ? (
          <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary">
            Cancelar
          </button>
        ) : (
          <Link href={cancelHref} className="btn-secondary">Cancelar</Link>
        )}
      </div>
    </form>
  )
}
