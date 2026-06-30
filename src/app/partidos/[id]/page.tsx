import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MatchForm } from '@/components/partidos/MatchForm'
import { ResultForm } from '@/components/partidos/ResultForm'
import { updateMatch } from '@/app/partidos/actions'
import type { MatchFormState } from '@/app/partidos/actions'
import type { Database } from '@/types/database'

type Match = Database['public']['Tables']['matches']['Row']
type MatchSet = Database['public']['Tables']['match_sets']['Row']
type UpdateAction = (prevState: MatchFormState, formData: FormData) => Promise<MatchFormState>

type WithdrawalRow = {
  id: string
  player_id: string
  players: { full_name: string } | null
  reason: string | null
}

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_BADGE: Record<string, string> = {
  programado: 'badge-blue',
  jugado:     'badge-green',
  aplazado:   'badge-amber',
}
const STATUS_LABEL: Record<string, string> = {
  programado: 'Programado',
  jugado:     'Jugado',
  aplazado:   'Aplazado',
}

export default async function PartidoPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: match, error },
    { data: setsData },
    { data: playersData },
    { data: withdrawalsData },
  ] = await Promise.all([
    supabase.from('matches').select('*').eq('id', id).single(),
    supabase.from('match_sets').select('*').eq('match_id', id).order('pair_number'),
    supabase.from('players').select('id, full_name').eq('status', 'activo').order('full_name'),
    supabase
      .from('withdrawals')
      .select('id, player_id, players(full_name), reason')
      .eq('scope', 'partido')
      .eq('match_id', id),
  ])

  if (error || !match) notFound()

  const typedMatch = match as Match
  const existingSets = (setsData ?? []) as MatchSet[]
  const players = playersData ?? []
  const withdrawals = (withdrawalsData ?? []) as unknown as WithdrawalRow[]

  const withdrawnPlayerIds = new Set(withdrawals.map((w) => w.player_id))
  const playerOptions = players.map((p) => ({
    id: p.id,
    full_name: p.full_name,
    hasWithdrawal: withdrawnPlayerIds.has(p.id),
  }))

  const updateAction = updateMatch.bind(null, typedMatch.id) as UpdateAction

  const matchDate = new Date(typedMatch.date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const setsKey =
    existingSets.length > 0
      ? existingSets
          .map((s) => `${s.pair_number}_${s.sets_won}_${s.sets_lost}_${s.player_ids.join('-')}`)
          .join('|')
      : 'empty'

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/partidos" className="back-link">← Partidos</Link>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
            {typedMatch.match_type === 'entreno' ? 'Entreno' : `vs ${typedMatch.opponent}`}
          </h1>
          <span className={STATUS_BADGE[typedMatch.status]}>
            {STATUS_LABEL[typedMatch.status]}
          </span>
          {typedMatch.result_summary && (
            <span className="font-mono text-lg font-bold text-verde-bright">
              {typedMatch.result_summary}
            </span>
          )}
        </div>
        <p className="text-sm text-apagado mt-1 capitalize">{matchDate}</p>
      </div>

      {/* Datos del partido */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-semibold text-texto mb-5">Datos del partido</h2>
        <MatchForm
          key={`${typedMatch.id}-${typedMatch.status}-${typedMatch.date}`}
          action={updateAction}
          match={typedMatch}
        />
      </div>

      {/* Retiradas */}
      {withdrawals.length > 0 && (
        <div className="alert-warning mb-5">
          <p className="text-sm font-semibold text-amber-200 mb-2">Retiradas para este partido</p>
          <ul className="space-y-1">
            {withdrawals.map((w) => (
              <li key={w.id} className="text-sm text-amber-300">
                <span className="font-medium">{w.players?.full_name ?? 'Jugador desconocido'}</span>
                {w.reason && <span className="ml-2 text-amber-400">— {w.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resultado */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-texto mb-4">Resultado</h2>

        {typedMatch.status !== 'jugado' ? (
          <p className="text-sm text-apagado">
            Cambia el estado a{' '}
            <span className="font-medium text-texto">Jugado</span>{' '}
            para registrar el resultado.
          </p>
        ) : (
          <ResultForm
            key={setsKey}
            matchId={typedMatch.id}
            matchType={typedMatch.match_type}
            players={playerOptions}
            existingSets={existingSets.map((s) => ({
              pair_number: s.pair_number,
              player_ids: s.player_ids,
              sets_won: s.sets_won,
              sets_lost: s.sets_lost,
            }))}
          />
        )}
      </div>
    </div>
  )
}
