import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { EmptyState } from '@/components/ui/EmptyState'

type Match = Database['public']['Tables']['matches']['Row']

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

function MatchRow({ match }: { match: Match }) {
  const date = new Date(match.date + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return (
    <tr className="table-row cursor-pointer">
      <td className="px-4 py-3 text-apagado whitespace-nowrap">{date}</td>
      <td className="px-4 py-3">
        <Link
          href={`/partidos/${match.id}`}
          className="font-medium text-texto hover:text-verde-bright transition-colors"
        >
          {match.opponent}
        </Link>
      </td>
      <td className="px-4 py-3 text-apagado capitalize">{match.home_away}</td>
      <td className="px-4 py-3 text-apagado">{match.location ?? '—'}</td>
      <td className="px-4 py-3">
        <span className={STATUS_BADGE[match.status]}>
          {STATUS_LABEL[match.status]}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-apagado">
        {match.result_summary ?? '—'}
      </td>
    </tr>
  )
}

function MatchCard({ match }: { match: Match }) {
  const date = new Date(match.date + 'T00:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return (
    <Link href={`/partidos/${match.id}`} className="block card p-4 hover:border-verde/40 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-medium text-texto truncate pr-2">{match.opponent}</span>
        <span className={`${STATUS_BADGE[match.status]} shrink-0`}>
          {STATUS_LABEL[match.status]}
        </span>
      </div>
      <p className="text-sm text-apagado mb-1">
        {date} · <span className="capitalize">{match.home_away}</span>
      </p>
      {match.location && (
        <p className="text-xs text-tenue truncate">{match.location}</p>
      )}
      {match.result_summary && (
        <p className="text-xs font-mono text-apagado mt-1">{match.result_summary}</p>
      )}
    </Link>
  )
}

export default async function PartidosPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error

  const matches = (data ?? []) as Match[]
  const today = new Date().toISOString().split('T')[0]

  const upcoming = matches
    .filter((m) => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = matches
    .filter((m) => m.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const tableHead = (
    <thead>
      <tr className="table-head-row">
        <th className="table-th">Fecha</th>
        <th className="table-th">Rival</th>
        <th className="table-th">L/V</th>
        <th className="table-th">Sede</th>
        <th className="table-th">Estado</th>
        <th className="table-th">Resultado</th>
      </tr>
    </thead>
  )

  function MatchList({ list }: { list: Match[] }) {
    return (
      <>
        {/* Desktop: tabla */}
        <div className="table-wrap hidden md:block">
          <table className="w-full text-sm">
            {tableHead}
            <tbody className="table-divider">
              {list.map((m) => <MatchRow key={m.id} match={m} />)}
            </tbody>
          </table>
        </div>
        {/* Mobile: cards */}
        <div className="md:hidden space-y-3">
          {list.map((m) => <MatchCard key={m.id} match={m} />)}
        </div>
      </>
    )
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
          Partidos
        </h1>
        <Link href="/partidos/nuevo" className="btn-primary">
          + Programar partido
        </Link>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
              <path d="M5 1v2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1h-2V1h-1.5v2h-3V1H5zm-2 5h10v7H3V6z" />
            </svg>
          }
          title="No hay partidos registrados todavía."
          action={{ href: '/partidos/nuevo', label: '+ Programar partido' }}
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="section-label">Próximos</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-apagado pl-1">No hay partidos próximos.</p>
            ) : (
              <MatchList list={upcoming} />
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="section-label">Historial</h2>
              <MatchList list={past} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
