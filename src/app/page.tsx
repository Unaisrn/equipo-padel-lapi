import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcularSaldoCaja } from '@/lib/stats'
import type { TransactionRow } from '@/lib/stats'

export const dynamic = 'force-dynamic'

type MatchRow = { date: string; match_type: string; opponent: string | null; location: string | null; home_away: string | null }

function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <circle cx="8" cy="5" r="3" />
      <path d="M1.5 15a6.5 6.5 0 0113 0H1.5z" />
    </svg>
  )
}
function IconReceipt() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <path d="M3 1a1 1 0 00-1 1v12l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V2a1 1 0 00-1-1H3zm1 4h8v1.5H4V5zm0 3h6v1.5H4V8z" />
    </svg>
  )
}
function IconWallet() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v1H2V3z" />
      <path d="M1 6a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V6zm9 2a1 1 0 000 2h2a1 1 0 000-2h-2z" />
    </svg>
  )
}
function IconArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <circle cx="6.5" cy="5" r="2.5" />
      <path d="M1 14a5.5 5.5 0 019.17-4.1M13 7h-3m3 0l-2-2m2 2l-2 2" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <path d="M5 1v2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1h-2V1h-1.5v2h-3V1H5zm-2 5h10v7H3V6z" />
    </svg>
  )
}
function IconChart() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
      <rect x="1" y="9" width="4" height="6" rx="0.5" />
      <rect x="6" y="5" width="4" height="10" rx="0.5" />
      <rect x="11" y="1" width="4" height="14" rx="0.5" />
    </svg>
  )
}

const NAV_LINKS = [
  { href: '/jugadores',    label: 'Jugadores',    desc: 'Gestión del equipo',        icon: <IconUser /> },
  { href: '/cuotas',       label: 'Cuotas',       desc: 'Pagos de jugadores',        icon: <IconReceipt /> },
  { href: '/caja',         label: 'Caja',         desc: 'Movimientos del equipo',    icon: <IconWallet /> },
  { href: '/retiradas',    label: 'Retiradas',    desc: 'Bajas de partido / equipo', icon: <IconArrowLeft /> },
  { href: '/partidos',     label: 'Partidos',     desc: 'Calendario y resultados',   icon: <IconCalendar /> },
  { href: '/estadisticas', label: 'Estadísticas', desc: 'Rankings y rendimiento',    icon: <IconChart /> },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { data: txData },
    { data: activePlayers },
    { data: pendingFees },
    { data: nextMatchData },
  ] = await Promise.all([
    supabase.from('team_transactions').select('type, amount'),
    supabase.from('players').select('id').eq('status', 'activo'),
    supabase.from('player_fees').select('amount').eq('status', 'pendiente'),
    supabase
      .from('matches')
      .select('date, match_type, opponent, location, home_away')
      .eq('status', 'programado')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1),
  ])

  const balance = calcularSaldoCaja((txData ?? []) as TransactionRow[])
  const pendingCount = (pendingFees ?? []).length
  const pendingTotal = (pendingFees ?? []).reduce((s, f) => s + Number(f.amount), 0)
  const nextMatch = ((nextMatchData ?? []) as MatchRow[])[0] ?? null

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mb-6">
        Resumen
      </h1>

      {/* Stat cards — 1 col mobile, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Saldo — tarjeta prominente */}
        <div className="card p-5 border-verde/40">
          <div className={`text-3xl font-bold font-mono tabular-nums ${balance >= 0 ? 'text-verde-bright' : 'text-rojo'}`}>
            {balance < 0 ? '−' : ''}{Math.abs(balance).toFixed(2)} €
          </div>
          <div className="text-xs text-apagado mt-1">Saldo caja</div>
        </div>

        <div className="card p-5">
          <div className="text-2xl font-bold text-texto">
            {(activePlayers ?? []).length}
          </div>
          <div className="text-xs text-apagado mt-1">Jugadores activos</div>
        </div>

        <div className="card p-5">
          <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-texto'}`}>
            {pendingCount}
          </div>
          <div className="text-xs text-apagado mt-0.5">Cuotas pendientes</div>
          {pendingCount > 0 && (
            <div className="text-xs text-tenue mt-1">
              {pendingTotal.toFixed(2)} € por cobrar
            </div>
          )}
        </div>
      </div>

      {/* Próximo partido */}
      <div className="card p-5 mb-5">
        <div className="section-label">Próximo partido</div>
        {nextMatch ? (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                nextMatch.match_type === 'entreno'
                  ? 'border-purple-500/40 text-purple-400'
                  : 'border-blue-700/40 text-blue-300'
              }`}>
                {nextMatch.match_type === 'entreno' ? 'Entreno' : 'Liga'}
              </span>
              <span className="text-base font-semibold text-texto">
                {nextMatch.match_type === 'entreno' ? 'Entreno interno' : `vs ${nextMatch.opponent}`}
              </span>
            </div>
            <div className="text-sm text-apagado mt-0.5">
              {new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {nextMatch.home_away && (
                <>
                  <span className="mx-1.5 text-tenue">·</span>
                  <span className="capitalize">{nextMatch.home_away}</span>
                </>
              )}
              {nextMatch.location && (
                <>
                  <span className="mx-1.5 text-tenue">·</span>
                  {nextMatch.location}
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-apagado">
            No hay partidos programados.{' '}
            <Link href="/partidos/nuevo" className="text-verde-bright hover:text-verde-mid underline-offset-2 hover:underline">
              Programar uno
            </Link>
          </p>
        )}
      </div>

      {/* Quick links */}
      <div>
        <div className="section-label">Secciones</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card p-4 hover:border-verde/50 hover:bg-tarjeta-hover transition-all group"
            >
              <div className="w-5 h-5 mb-2.5 text-apagado group-hover:text-verde-bright transition-colors">
                {link.icon}
              </div>
              <div className="text-sm font-semibold text-texto group-hover:text-verde-bright transition-colors">
                {link.label}
              </div>
              <div className="text-xs text-apagado mt-0.5">{link.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
