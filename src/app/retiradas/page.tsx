import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'

type WithdrawalRow = {
  id: string
  scope: 'equipo' | 'partido'
  reason: string | null
  date: string
  players: { full_name: string } | null
  matches: { date: string; opponent: string } | null
}

export default async function RetiradasPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('withdrawals')
    .select('id, scope, reason, date, players(full_name), matches(date, opponent)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  const withdrawals = (data ?? []) as unknown as WithdrawalRow[]

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
          Retiradas
        </h1>
        <Link href="/retiradas/nueva" className="btn-primary">
          + Nueva retirada
        </Link>
      </div>

      {withdrawals.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
              <circle cx="6.5" cy="5" r="2.5" />
              <path d="M1 14a5.5 5.5 0 019.17-4.1M13 7h-3m3 0l-2-2m2 2l-2 2" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="No hay retiradas registradas todavía."
          action={{ href: '/retiradas/nueva', label: '+ Nueva retirada' }}
        />
      ) : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head-row">
                <th className="table-th">Jugador</th>
                <th className="table-th">Ámbito</th>
                <th className="table-th">Partido</th>
                <th className="table-th">Motivo</th>
                <th className="table-th">Fecha</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {withdrawals.map((w) => (
                <tr key={w.id} className="table-row-static">
                  <td className="px-4 py-3 font-medium text-texto">
                    {w.players?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={w.scope === 'equipo' ? 'badge-red' : 'badge-blue'}>
                      {w.scope === 'equipo' ? 'Equipo' : 'Partido'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-apagado">
                    {w.matches
                      ? `${w.matches.opponent} – ${new Date(w.matches.date + 'T00:00:00').toLocaleDateString('es-ES')}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-apagado">{w.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-apagado whitespace-nowrap">
                    {new Date(w.date + 'T00:00:00').toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
