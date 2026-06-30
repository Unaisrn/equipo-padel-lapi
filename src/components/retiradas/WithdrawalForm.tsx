'use client'

import { useState, useEffect } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import type { WithdrawalFormState } from '@/app/retiradas/actions'
import { Spinner } from '@/components/ui/Spinner'

type Player = { id: string; full_name: string }
type Match = { id: string; date: string; opponent: string }
type Scope = 'equipo' | 'partido'
type ActionFn = (prevState: WithdrawalFormState, formData: FormData) => Promise<WithdrawalFormState>

interface Props {
  players: Player[]
  matches: Match[]
  action: ActionFn
}

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending || disabled} className="btn-primary inline-flex items-center gap-2">
      {pending ? <><Spinner className="w-4 h-4" /> Guardando</> : 'Registrar retirada'}
    </button>
  )
}

export function WithdrawalForm({ players, matches, action }: Props) {
  const router = useRouter()
  const [state, formAction] = useActionState(action, null)
  const [scope, setScope] = useState<Scope>('equipo')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (state && 'success' in state) {
      toast.success('Retirada registrada')
      router.push('/retiradas')
    }
  }, [state, router])

  const submitDisabled = scope === 'partido' && matches.length === 0

  return (
    <form action={formAction} className="space-y-5">
      {state && 'error' in state && (
        <div className="alert-error">{state.error}</div>
      )}

      {/* Jugador */}
      <div>
        <label htmlFor="player_id" className="field-label">
          Jugador <span className="text-rojo">*</span>
        </label>
        {players.length === 0 ? (
          <p className="text-sm text-apagado">
            No hay jugadores activos.{' '}
            <Link href="/jugadores" className="underline text-verde-bright">Ver jugadores</Link>
          </p>
        ) : (
          <select id="player_id" name="player_id" required defaultValue="" className="field-select">
            <option value="" disabled>Seleccionar jugador...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Ámbito */}
      <div>
        <label className="field-label">
          Ámbito <span className="text-rojo">*</span>
        </label>
        <div className="pill-tabs">
          {(['equipo', 'partido'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`pill-tab ${scope === s ? 'pill-tab-active' : ''}`}
            >
              {s === 'equipo' ? 'Baja de equipo' : 'Baja de partido'}
            </button>
          ))}
        </div>
        <input type="hidden" name="scope" value={scope} />
      </div>

      {/* Aviso baja de equipo */}
      {scope === 'equipo' && (
        <div className="alert-warning">
          Al guardar, el jugador pasará automáticamente a estado{' '}
          <strong className="text-amber-200">baja del equipo</strong>. Esta acción es reversible desde la ficha del
          jugador si fue un error.
        </div>
      )}

      {/* Selector de partido */}
      {scope === 'partido' && (
        <div>
          <label htmlFor="match_id" className="field-label">
            Partido <span className="text-rojo">*</span>
          </label>
          {matches.length === 0 ? (
            <div className="alert-info">
              No hay partidos registrados todavía. Crea partidos desde la sección de Partidos y
              vuelve aquí para registrar la baja puntual.
            </div>
          ) : (
            <select id="match_id" name="match_id" required defaultValue="" className="field-select">
              <option value="" disabled>Seleccionar partido...</option>
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.opponent} –{' '}
                  {new Date(m.date + 'T00:00:00').toLocaleDateString('es-ES')}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Motivo */}
      <div>
        <label htmlFor="reason" className="field-label">Motivo</label>
        <input
          id="reason"
          name="reason"
          type="text"
          placeholder="Ej. Lesión, compromiso personal, viaje..."
          className="field-input"
        />
      </div>

      {/* Fecha */}
      <div>
        <label htmlFor="date" className="field-label">
          Fecha <span className="text-rojo">*</span>
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={today}
          className="field-input"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton disabled={submitDisabled} />
        <Link href="/retiradas" className="btn-secondary">Cancelar</Link>
      </div>
    </form>
  )
}
