// Pure calculation functions — receive already-fetched data, make no Supabase calls.

import type { MatchType } from '@/types/database'

export type TransactionRow = { type: 'ingreso' | 'gasto'; amount: number }
export type SetRow = { player_ids: string[]; won: boolean; match_type?: string }
export type MatchRow = { result_summary: string | null; match_type?: string }

// ── Caja ─────────────────────────────────────────────────────────────────────

export function calcularDesgloseCaja(transactions: TransactionRow[]): {
  balance: number
  totalIngresos: number
  totalGastos: number
} {
  const totalIngresos = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((s, t) => s + t.amount, 0)
  const totalGastos = transactions
    .filter((t) => t.type === 'gasto')
    .reduce((s, t) => s + t.amount, 0)
  return { balance: totalIngresos - totalGastos, totalIngresos, totalGastos }
}

export function calcularSaldoCaja(transactions: TransactionRow[]): number {
  return calcularDesgloseCaja(transactions).balance
}

// ── Equipo ────────────────────────────────────────────────────────────────────

export function calcularResumenEquipo(
  matches: MatchRow[],
  matchType?: MatchType
): { victorias: number; derrotas: number } {
  const src = matchType ? matches.filter((m) => m.match_type === matchType) : matches
  let victorias = 0
  let derrotas = 0
  for (const m of src) {
    if (!m.result_summary) continue
    const [w, l] = m.result_summary.split('-').map(Number)
    if (w > l) victorias++
    else if (l > w) derrotas++
  }
  return { victorias, derrotas }
}

// ── Jugadores ─────────────────────────────────────────────────────────────────

export type PlayerAgg = {
  id: string
  jugados: number
  ganados: number
  perdidos: number
  pct: number
}

export function calcularStatsJugador(
  sets: SetRow[],
  playerId: string,
  matchType?: MatchType
): PlayerAgg {
  const src = matchType ? sets.filter((s) => s.match_type === matchType) : sets
  const mine = src.filter((s) => (s.player_ids as string[]).includes(playerId))
  const jugados = mine.length
  const ganados = mine.filter((s) => s.won).length
  return {
    id: playerId,
    jugados,
    ganados,
    perdidos: jugados - ganados,
    pct: jugados > 0 ? (ganados / jugados) * 100 : 0,
  }
}

export function calcularRankingJugadores(
  sets: SetRow[],
  matchType?: MatchType
): PlayerAgg[] {
  const src = matchType ? sets.filter((s) => s.match_type === matchType) : sets
  const map = new Map<string, { jugados: number; ganados: number }>()
  for (const set of src) {
    for (const pid of set.player_ids as string[]) {
      if (!map.has(pid)) map.set(pid, { jugados: 0, ganados: 0 })
      const s = map.get(pid)!
      s.jugados++
      if (set.won) s.ganados++
    }
  }
  return [...map.entries()]
    .map(([id, s]) => ({
      id,
      jugados: s.jugados,
      ganados: s.ganados,
      perdidos: s.jugados - s.ganados,
      pct: s.jugados > 0 ? (s.ganados / s.jugados) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct || b.jugados - a.jugados)
}

// ── Parejas ───────────────────────────────────────────────────────────────────

export type PairAgg = {
  p1Id: string
  p2Id: string
  jugados: number
  ganadas: number
  perdidas: number
  pct: number
}

export function calcularStatsParejas(
  sets: SetRow[],
  playerId?: string,
  matchType?: MatchType
): PairAgg[] {
  const src = matchType ? sets.filter((s) => s.match_type === matchType) : sets
  const relevant = playerId
    ? src.filter((s) => (s.player_ids as string[]).includes(playerId))
    : src

  const map = new Map<string, { p1Id: string; p2Id: string; jugados: number; ganadas: number }>()
  for (const set of relevant) {
    if (set.player_ids.length < 2) continue
    const [p1, p2] = [...(set.player_ids as string[])].sort()
    const key = `${p1}--${p2}`
    if (!map.has(key)) map.set(key, { p1Id: p1, p2Id: p2, jugados: 0, ganadas: 0 })
    const s = map.get(key)!
    s.jugados++
    if (set.won) s.ganadas++
  }

  return [...map.values()]
    .map((s) => ({
      ...s,
      perdidas: s.jugados - s.ganadas,
      pct: s.jugados > 0 ? (s.ganadas / s.jugados) * 100 : 0,
    }))
    .sort((a, b) => b.pct - a.pct || b.jugados - a.jugados)
}
