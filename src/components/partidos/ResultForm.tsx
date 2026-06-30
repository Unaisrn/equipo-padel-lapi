'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { saveResult } from '@/app/partidos/actions'
import type { PairInput, ResultFormState } from '@/app/partidos/actions'
import { Spinner } from '@/components/ui/Spinner'

type PlayerOption = {
  id: string
  full_name: string
  hasWithdrawal: boolean
}

type ExistingSet = {
  pair_number: number
  player_ids: string[]
  sets_won: number
  sets_lost: number
}

interface Props {
  matchId: string
  players: PlayerOption[]
  existingSets: ExistingSet[]
}

type PairState = {
  player1: string
  player2: string
  setsWon: number
  setsLost: number
}

export function ResultForm({ matchId, players, existingSets }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ResultFormState>(null)

  const [pairs, setPairs] = useState<PairState[]>(() =>
    [1, 2, 3].map((i) => {
      const ex = existingSets.find((s) => s.pair_number === i)
      return {
        player1: ex?.player_ids[0] ?? '',
        player2: ex?.player_ids[1] ?? '',
        setsWon: ex?.sets_won ?? 0,
        setsLost: ex?.sets_lost ?? 0,
      }
    })
  )

  const allSelected = pairs.flatMap((p) => [p.player1, p.player2])
  const duplicates = new Set(
    allSelected.filter((p, i) => p !== '' && allSelected.indexOf(p) !== i)
  )
  const hasDuplicates = duplicates.size > 0

  function updatePair(index: number, update: Partial<PairState>) {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, ...update } : p)))
    setResult(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hasDuplicates) return

    const pairInputs: PairInput[] = pairs.map((p) => ({
      player1: p.player1,
      player2: p.player2,
      setsWon: p.setsWon,
      setsLost: p.setsLost,
    }))

    startTransition(async () => {
      const res = await saveResult(matchId, pairInputs)
      setResult(res)
      if (res && 'success' in res) {
        toast.success('Resultado guardado')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasDuplicates && (
        <div className="alert-warning">
          Un jugador no puede aparecer en más de una pareja.
        </div>
      )}
      {result && 'error' in result && (
        <div className="alert-error">{result.error}</div>
      )}
      <div className="space-y-4">
        {pairs.map((pair, i) => {
          const pairNum = i + 1
          const won = pair.setsWon > pair.setsLost
          const lost = pair.setsLost > pair.setsWon
          const hasScore = pair.setsWon > 0 || pair.setsLost > 0

          return (
            <div key={pairNum} className="border border-borde rounded-xl p-4 bg-tarjeta">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-texto">Pareja {pairNum}</span>
                {hasScore && (
                  <span
                    className={
                      won
                        ? 'badge-green'
                        : lost
                        ? 'badge-red'
                        : 'badge-gray'
                    }
                  >
                    {won ? 'Ganado' : lost ? 'Perdido' : 'Empate'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {([1, 2] as const).map((slot) => {
                  const field = slot === 1 ? 'player1' : 'player2'
                  const value = pair[field]
                  const isDuplicate = value !== '' && duplicates.has(value)
                  return (
                    <div key={slot}>
                      <label className="field-label">Jugador {slot}</label>
                      <select
                        value={value}
                        onChange={(e) => updatePair(i, { [field]: e.target.value })}
                        className={`field-select ${isDuplicate ? 'border-rojo ring-1 ring-rojo' : ''}`}
                      >
                        <option value="">Seleccionar...</option>
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name}
                            {p.hasWithdrawal ? ' [retirada]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Sets ganados</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={pair.setsWon}
                    onChange={(e) =>
                      updatePair(i, { setsWon: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="field-input text-center"
                  />
                </div>
                <div>
                  <label className="field-label">Sets perdidos</label>
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={pair.setsLost}
                    onChange={(e) =>
                      updatePair(i, { setsLost: Math.max(0, parseInt(e.target.value) || 0) })
                    }
                    className="field-input text-center"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="submit"
        disabled={isPending || hasDuplicates}
        className="btn-primary w-full"
      >
        {isPending ? <span className="inline-flex items-center gap-2"><Spinner className="w-4 h-4" /> Guardando</span> : 'Guardar resultado'}
      </button>
    </form>
  )
}
