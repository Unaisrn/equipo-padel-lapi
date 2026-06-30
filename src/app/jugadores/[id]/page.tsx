import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PlayerForm } from '@/components/jugadores/PlayerForm'
import { BajaButton, DeletePlayerButton } from '@/components/jugadores/PlayerActions'
import { updatePlayer } from '@/app/jugadores/actions'
import type { PlayerFormState } from '@/app/jugadores/actions'
import type { FeeStatus } from '@/types/database'
import { calcularStatsJugador, calcularStatsParejas } from '@/lib/stats'

type UpdateAction = (prevState: PlayerFormState, formData: FormData) => Promise<PlayerFormState>

type WithdrawalRow = {
  id: string
  scope: 'equipo' | 'partido'
  reason: string | null
  date: string
  matches: { date: string; opponent: string } | null
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
      supabase.from('matches').select('id').eq('status', 'jugado'),
    ])

  if (error || !player) notFound()

  const withdrawals = (withdrawalsData ?? []) as WithdrawalRow[]
  const fees = (feesData ?? []) as FeeRow[]
  const jugadoMatchIds = (jugadoMatchesData ?? []).map((m) => m.id)

  let allSets: Array<{ player_ids: string[]; won: boolean }> = []
  if (jugadoMatchIds.length > 0) {
    const { data: setsData } = await supabase
      .from('match_sets')
      .select('player_ids, won')
      .in('match_id', jugadoMatchIds)
    allSets = (setsData ?? []) as Array<{ player_ids: string[]; won: boolean }>
  }

  const playerStats = calcularStatsJugador(allSets, id)
  const pjugados = playerStats.jugados
  const pganados = playerStats.ganados
  const ppct = pjugados > 0 ? Math.round(playerStats.pct) : null

  const pairAggs = calcularStatsParejas(allSets, id)
  const topPairAggs = [...pairAggs].sort((a, b) => b.jugados - a.jugados).slice(0, 3)
  let topPartners: PartnerStat[] = []
  if (topPairAggs.length > 0) {
    const partnerIds = topPairAggs.map((p) => (p.p1Id === id ? p.p2Id : p.p1Id))
    const { data: partnerData } = await supabase
      .from('players')
      .select('id, full_name')
      .in('id', partnerIds)
    const partnerMap = new Map((partnerData ?? []).map((p) => [p.id, p.full_name]))
    topPartners = topPairAggs.map((p) => {
      const partnerId = p.p1Id === id ? p.p2Id : p.p1Id
      return {
        name: partnerMap.get(partnerId) ?? 'Jugador eliminado',
        jugados: p.jugados,
        ganadas: p.ganadas,
      }
    })
  }

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
                      vs {w.matches.opponent} (
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

      {/* Estadísticas individuales */}
      <div className="card p-6 mb-5">
        <h2 className="text-sm font-semibold text-texto mb-3">Estadísticas</h2>
        {pjugados === 0 ? (
          <p className="text-sm text-apagado">Sin partidos jugados todavía.</p>
        ) : (
          <div className="space-y-4">
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

            {topPartners.length > 0 && (
              <div>
                <div className="text-xs font-medium text-apagado mb-2">Compañeros habituales</div>
                <div className="space-y-1.5">
                  {topPartners.map((p, i) => (
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
