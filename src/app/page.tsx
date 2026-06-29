import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calcularSaldoCaja } from '@/lib/stats'
import type { TransactionRow } from '@/lib/stats'

type MatchRow = { date: string; opponent: string; location: string | null; home_away: string }

const NAV_LINKS = [
  { href: '/jugadores',    label: 'Jugadores',    desc: 'Gestión del equipo' },
  { href: '/cuotas',       label: 'Cuotas',       desc: 'Pagos de jugadores' },
  { href: '/caja',         label: 'Caja',         desc: 'Movimientos del equipo' },
  { href: '/retiradas',    label: 'Retiradas',    desc: 'Bajas de partido / equipo' },
  { href: '/partidos',     label: 'Partidos',     desc: 'Calendario y resultados' },
  { href: '/estadisticas', label: 'Estadísticas', desc: 'Rankings y rendimiento' },
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
      .select('date, opponent, location, home_away')
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <div className="card p-5">
          <div className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-verde-bright' : 'text-rojo'}`}>
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

        <div className="card p-5 col-span-2 sm:col-span-1">
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
            <div className="text-base font-semibold text-texto">
              vs {nextMatch.opponent}
            </div>
            <div className="text-sm text-apagado mt-0.5">
              {new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              <span className="mx-1.5 text-tenue">·</span>
              <span className="capitalize">{nextMatch.home_away}</span>
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
