import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlayerForm } from '@/components/jugadores/PlayerForm'
import { BajaButton, DeletePlayerButton } from '@/components/jugadores/PlayerActions'
import { updatePlayer } from '@/app/jugadores/actions'
import type { PlayerFormState } from '@/app/jugadores/actions'
import type { FeeStatus } from '@/types/database'
import { calcularStatsJugador, calcularStatsParejas } from '@/lib/stats'
import type { SetRow } from '@/lib/stats'

export const dynamic = 'force-dynamic'

type UpdateAction = (prevState: PlayerFormState, formData: FormData) => Promise<PlayerFormState>

type WithdrawalRow = {
  id: string
  scope: 'equipo' | 'partido'
  reason: string | null
  date: string
  matches: { date: string; opponent: string | null } | null
}

type FeeRow = {
  id: string
  concept: string
  amount: number
  status: FeeStatus
  paid_at: string | null
  due_date: string | null
}

type PartnerStat = {
  name: string
  jugados: number
  ganadas: number
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function JugadorPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: player, error }, { data: withdrawalsData }, { data: feesData }, { data: jugadoMatchesData }] =
    await Promise.all([
      supabase.from('players').select('*').eq('id', id).single(),
      supabase
        .from('withdrawals')
        .select('id, scope, reason, date, matches(date, opponent)')
        .eq('player_id', id)
        .order('date', { ascending: false }),
      supabase
        .from('player_fees')
        .select('id, concept, amount, status, paid_at, due_date')
        .eq('player_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('matches').select('id, match_type').eq('status', 'jugado'),
    ])

  if (error || !player) notFound()

  const withdrawals = (withdrawalsData ?? []) as WithdrawalRow[]
  const fees = (feesData ?? []) as FeeRow[]

  const jugadoMatches = (jugadoMatchesData ?? []) as { id: string; match_type: string }[]
  const jugadoMatchIds = jugadoMatches.map((m) => m.id)
  const matchTypeMap = new Map(jugadoMatches.map((m) => [m.id, m.match_type]))

  // One set query, annotated with match_type via the map
  let allSets: SetRow[] = []
  if (jugadoMatchIds.length > 0) {
    const { data: setsData } = await supabase
      .from('match_sets')
      .select('match_id, player_ids, won')
      .in('match_id', jugadoMatchIds)
    allSets = ((setsData ?? []) as { match_id: string; player_ids: string[]; won: boolean }[]).map((s) => ({
      player_ids: s.player_ids,
      won: s.won,
      match_type: matchTypeMap.get(s.match_id),
    }))
  }

  // Stats per type using the matchType filter param
  const ligaStats = calcularStatsJugador(allSets, id, 'liga')
  const entrenoStats = calcularStatsJugador(allSets, id, 'entreno')
  const ligaPairAggs = calcularStatsParejas(allSets, id, 'liga').sort((a, b) => b.jugados - a.jugados).slice(0, 3)
  const entrenoPairAggs = calcularStatsParejas(allSets, id, 'entreno').sort((a, b) => b.jugados - a.jugados).slice(0, 3)

  // Fetch partner names for both types in one query
  const allPartnerIds = [...new Set([
    ...ligaPairAggs.map((p) => (p.p1Id === id ? p.p2Id : p.p1Id)),
    ...entrenoPairAggs.map((p) => (p.p1Id === id ? p.p2Id : p.p1Id)),
  ])]
  let partnerMap = new Map<string, string>()
  if (allPartnerIds.length > 0) {
    const { data: partnerData } = await supabase
      .from('players')
      .select('id, full_name')
      .in('id', allPartnerIds)
    partnerMap = new Map((partnerData ?? []).map((p) => [p.id, p.full_name]))
  }

  function buildPartners(aggs: typeof ligaPairAggs): PartnerStat[] {
    return aggs.map((p) => {
      const partnerId = p.p1Id === id ? p.p2Id : p.p1Id
      return {
        name: partnerMap.get(partnerId) ?? 'Jugador eliminado',
        jugados: p.jugados,
        ganadas: p.ganadas,
      }
    })
  }

  const ligaPartners = buildPartners(ligaPairAggs)
  const entrenoPartners = buildPartners(entrenoPairAggs)

  const updateAction = updatePlayer.bind(null, player.id) as UpdateAction
  const teamWithdrawal = withdrawals.find((w) => w.scope === 'equipo')
  const matchWithdrawals = withdrawals.filter((w) => w.scope === 'partido')
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/jugadores" className="back-link">← Jugadores</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
            {player.full_name}
          </h1>
          <span className={player.status === 'activo' ? 'badge-green' : 'badge-gray'}>
            {player.status === 'activo' ? 'Activo' : 'Baja'}
          </span>
        </div>
      </div>

      {/* Datos del jugador */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-semibold text-texto mb-5">Datos del jugador</h2>
        <PlayerForm action={updateAction} player={player} cancelHref="/jugadores" />
      </div>

      {/* Histórico de pagos */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-texto">Histórico de pagos</h2>
          <Link
            href={`/cuotas/nueva?player_id=${player.id}`}
            className="text-xs text-verde-bright hover:text-verde-mid transition-colors"
          >
            + Nueva cuota
          </Link>
        </div>
        {fees.length === 0 ? (
          <p className="text-sm text-apagado">Sin cuotas registradas.</p>
        ) : (
          <div className="divide-y divide-borde">
            {fees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-texto truncate">{fee.concept}</span>
                  {fee.paid_at && (
                    <span className="ml-2 text-xs text-apagado">
                      {new Date(fee.paid_at + 'T00:00:00').toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="text-sm font-medium text-texto tabular-nums font-mono">
                    {Number(fee.amount).toFixed(2)} €
                  </span>
                  {(() => {
                    const vencida = fee.status === 'pendiente' && !!fee.due_date && fee.due_date < today
                    return (
                      <span className={fee.status === 'pagado' ? 'badge-green' : vencida ? 'badge-red' : 'badge-amber'}>
                        {fee.status === 'pagado' ? 'Pagado' : vencida ? 'Vencida' : 'Pendiente'}
                      </span>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retiradas */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-texto">Retiradas</h2>
          <Link href="/retiradas/nueva" className="text-xs text-verde-bright hover:text-verde-mid transition-colors">
            + Registrar
          </Link>
        </div>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-apagado">Sin retiradas registradas.</p>
        ) : (
          <div className="space-y-2">
            {teamWithdrawal && (
              <div className="flex items-start gap-3 p-3 bg-rojo/10 border border-rojo/20 rounded-lg">
                <span className="badge-red shrink-0 mt-0.5">Baja de equipo</span>
                <div className="text-sm text-texto">
                  <span className="text-apagado">
                    {new Date(teamWithdrawal.date + 'T00:00:00').toLocaleDateString('es-ES')}
                  </span>
                  {teamWithdrawal.reason && (
                    <span className="ml-2 text-texto">— {teamWithdrawal.reason}</span>
                  )}
                </div>
              </div>
            )}
            {matchWithdrawals.map((w) => (
              <div
                key={w.id}
                className="flex items-start gap-3 p-3 bg-blue-950/30 border border-blue-700/20 rounded-lg"
              >
                <span className="badge-blue shrink-0 mt-0.5">Baja de partido</span>
                <div className="text-sm text-texto">
                  <span className="text-apagado">
                    {new Date(w.date + 'T00:00:00').toLocaleDateString('es-ES')}
                  </span>
                  {w.matches && (
                    <span className="ml-2 text-apagado">
                      {w.matches.opponent ? `vs ${w.matches.opponent}` : 'Entreno'} (
                      {new Date(w.matches.date + 'T00:00:00').toLocaleDateString('es-ES')})
                    </span>
                  )}
                  {w.reason && <span className="ml-2 text-tenue">— {w.reason}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas individuales — Liga y Entreno separadas */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-semibold text-texto mb-4">Estadísticas</h2>
        <div className="space-y-5">
          {(['liga', 'entreno'] as const).map((tipo) => {
            const stats = tipo === 'liga' ? ligaStats : entrenoStats
            const partners = tipo === 'liga' ? ligaPartners : entrenoPartners
            const pjugados = stats.jugados
            const pganados = stats.ganados
            const ppct = pjugados > 0 ? Math.round(stats.pct) : null

            return (
              <div key={tipo}>
                <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${
                  tipo === 'liga' ? 'text-blue-300' : 'text-purple-400'
                }`}>
                  {tipo === 'liga' ? 'Liga' : 'Entreno'}
                </div>
                {pjugados === 0 ? (
                  <p className="text-sm text-apagado">
                    Sin {tipo === 'liga' ? 'partidos de liga' : 'entrenos'} jugados.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="text-xl font-bold text-texto">{pjugados}</div>
                        <div className="text-xs text-apagado mt-0.5">Jugados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-verde-bright">{pganados}</div>
                        <div className="text-xs text-apagado mt-0.5">Ganados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-texto">
                          {ppct !== null ? `${ppct} %` : '—'}
                        </div>
                        <div className="text-xs text-apagado mt-0.5">% victorias</div>
                      </div>
                    </div>
                    {partners.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-apagado mb-2">Compañeros habituales</div>
                        <div className="space-y-1.5">
                          {partners.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-texto">{p.name}</span>
                              <span className="text-apagado text-xs tabular-nums">
                                {p.jugados} {p.jugados === 1 ? 'partido' : 'partidos'} juntos
                                {' · '}{p.ganadas}G / {p.jugados - p.ganadas}P
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {tipo === 'liga' && (
                  <div className="border-t border-borde mt-4" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-texto mb-1">Acciones</h2>
        <p className="text-sm text-apagado mb-4">Cambios de estado permanentes del jugador.</p>
        <div className="flex flex-wrap gap-3">
          {player.status === 'activo' && <BajaButton playerId={player.id} />}
          <DeletePlayerButton playerId={player.id} />
        </div>
      </div>
    </div>
  )
}
