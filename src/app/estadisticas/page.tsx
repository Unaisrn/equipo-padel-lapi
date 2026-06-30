import { createClient } from '@/lib/supabase/server'
import {
  calcularResumenEquipo,
  calcularRankingJugadores,
  calcularStatsParejas,
} from '@/lib/stats'
import { EmptyState } from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'

type MatchRow = { id: string; result_summary: string | null }
type SetRow = { player_ids: string[]; won: boolean }

type PlayerStat = {
  id: string
  name: string
  jugados: number
  ganados: number
  perdidos: number
  pct: number
}

type PairStat = {
  name1: string
  name2: string
  jugados: number
  ganadas: number
  perdidas: number
  pct: number
}

function PctBar({ pct }: { pct: number }) {
  const w = Math.round(pct)
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-borde rounded-full overflow-hidden">
        <div className="h-full bg-verde-bright rounded-full" style={{ width: `${w}%` }} />
      </div>
      <span className="text-sm tabular-nums text-apagado">{w} %</span>
    </div>
  )
}

export default async function EstadisticasPage() {
  const supabase = await createClient()

  const [{ data: matchesData }, { data: playersData }] = await Promise.all([
    supabase.from('matches').select('id, result_summary').eq('status', 'jugado'),
    supabase.from('players').select('id, full_name').order('full_name'),
  ])

  const matches = (matchesData ?? []) as MatchRow[]
  const playerMap = new Map(
    ((playersData ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name])
  )

  let sets: SetRow[] = []
  if (matches.length > 0) {
    const { data: setsData } = await supabase
      .from('match_sets')
      .select('player_ids, won')
      .in('match_id', matches.map((m) => m.id))
    sets = (setsData ?? []) as SetRow[]
  }

  const { victorias: teamVictorias, derrotas: teamDerrotas } = calcularResumenEquipo(matches)

  const playerRanking: PlayerStat[] = calcularRankingJugadores(sets).map((p) => ({
    ...p,
    name: playerMap.get(p.id) ?? 'Jugador eliminado',
  }))

  const pairRanking: PairStat[] = calcularStatsParejas(sets).map((p) => ({
    ...p,
    name1: playerMap.get(p.p1Id) ?? 'Jugador eliminado',
    name2: playerMap.get(p.p2Id) ?? 'Jugador eliminado',
  }))

  const noData = matches.length === 0

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mb-6">
        Estadísticas
      </h1>

      {noData ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
              <rect x="1" y="9" width="4" height="6" rx="0.5" />
              <rect x="6" y="5" width="4" height="10" rx="0.5" />
              <rect x="11" y="1" width="4" height="14" rx="0.5" />
            </svg>
          }
          title="Aquí aparecerán los rankings cuando registréis resultados de partidos."
          action={{ href: '/partidos', label: 'Ver partidos' }}
        />
      ) : (
        <div className="space-y-8">
          {/* Resumen del equipo */}
          <section>
            <h2 className="section-label">Resumen del equipo</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-5 text-center">
                <div className="text-3xl font-bold text-texto">{matches.length}</div>
                <div className="text-xs text-apagado mt-1">Partidos jugados</div>
              </div>
              <div className="card p-5 text-center">
                <div className={`text-3xl font-bold ${teamVictorias > 0 ? 'text-verde-bright' : 'text-apagado'}`}>
                  {teamVictorias}
                </div>
                <div className="text-xs text-apagado mt-1">Victorias</div>
              </div>
              <div className="card p-5 text-center">
                <div className={`text-3xl font-bold ${teamDerrotas > 0 ? 'text-rojo' : 'text-apagado'}`}>
                  {teamDerrotas}
                </div>
                <div className="text-xs text-apagado mt-1">Derrotas</div>
              </div>
            </div>
          </section>

          {/* Ranking jugadores */}
          <section>
            <h2 className="section-label">Ranking de jugadores</h2>
            {playerRanking.length === 0 ? (
              <p className="text-sm text-apagado">Sin datos de jugadores.</p>
            ) : (
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th">#</th>
                      <th className="table-th">Jugador</th>
                      <th className="table-th text-center">PJ</th>
                      <th className="table-th text-center">PG</th>
                      <th className="table-th text-center">PP</th>
                      <th className="table-th">% Vict.</th>
                    </tr>
                  </thead>
                  <tbody className="table-divider">
                    {playerRanking.map((p, i) => (
                      <tr key={p.id} className="table-row-static">
                        <td className="px-4 py-3 text-tenue text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-texto">{p.name}</span>
                            {p.jugados < 3 && (
                              <span className="badge-gray text-[10px]">pocas muestras</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-apagado tabular-nums">{p.jugados}</td>
                        <td className={`px-4 py-3 text-center font-medium tabular-nums ${p.ganados > 0 ? 'text-verde-bright' : 'text-apagado'}`}>
                          {p.ganados}
                        </td>
                        <td className={`px-4 py-3 text-center tabular-nums ${p.perdidos > 0 ? 'text-rojo' : 'text-apagado'}`}>
                          {p.perdidos}
                        </td>
                        <td className="px-4 py-3"><PctBar pct={p.pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Ranking parejas */}
          <section>
            <h2 className="section-label">Ranking de parejas</h2>
            {pairRanking.length === 0 ? (
              <p className="text-sm text-apagado">Sin datos de parejas.</p>
            ) : (
              <div className="table-wrap">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="table-head-row">
                      <th className="table-th">#</th>
                      <th className="table-th">Pareja</th>
                      <th className="table-th text-center">PJ</th>
                      <th className="table-th text-center">PG</th>
                      <th className="table-th text-center">PP</th>
                      <th className="table-th">% Vict.</th>
                    </tr>
                  </thead>
                  <tbody className="table-divider">
                    {pairRanking.map((pair, i) => (
                      <tr key={i} className="table-row-static">
                        <td className="px-4 py-3 text-tenue text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-texto">
                              {pair.name1} / {pair.name2}
                            </span>
                            {pair.jugados === 1 && (
                              <span className="badge-gray text-[10px]">1 partido</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-apagado tabular-nums">{pair.jugados}</td>
                        <td className={`px-4 py-3 text-center font-medium tabular-nums ${pair.ganadas > 0 ? 'text-verde-bright' : 'text-apagado'}`}>
                          {pair.ganadas}
                        </td>
                        <td className={`px-4 py-3 text-center tabular-nums ${pair.perdidas > 0 ? 'text-rojo' : 'text-apagado'}`}>
                          {pair.perdidas}
                        </td>
                        <td className="px-4 py-3"><PctBar pct={pair.pct} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
