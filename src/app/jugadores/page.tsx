import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { PlayerStatus } from '@/types/database'
import { EmptyState } from '@/components/ui/EmptyState'

const POSITION_LABELS: Record<string, string> = {
  drive: 'Drive',
  reves: 'Revés',
  ambos: 'Ambos',
}

const FILTROS = [
  { label: 'Activos', value: 'activo' },
  { label: 'Bajas',   value: 'baja' },
  { label: 'Todos',   value: 'todos' },
]

interface Props {
  searchParams: Promise<{ estado?: string }>
}

export default async function JugadoresPage({ searchParams }: Props) {
  const { estado } = await searchParams
  const filtro = (estado ?? 'activo') as PlayerStatus | 'todos'

  const supabase = await createClient()

  const query = supabase.from('players').select('*').order('full_name')
  const { data: players, error } = filtro === 'todos'
    ? await query
    : await query.eq('status', filtro)

  if (error) throw error

  const emptyTitle =
    filtro === 'todos'  ? 'No hay jugadores todavía. Añade el primero.' :
    filtro === 'activo' ? 'No hay jugadores activos en el equipo.' :
                          'No hay jugadores dados de baja.'

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
          Jugadores
        </h1>
        <Link href="/jugadores/nuevo" className="btn-primary">
          + Añadir jugador
        </Link>
      </div>

      <div className="pill-tabs mb-6">
        {FILTROS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/jugadores?estado=${value}`}
            className={`pill-tab ${filtro === value ? 'pill-tab-active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {players.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
              <circle cx="8" cy="5" r="3" />
              <path d="M1.5 15a6.5 6.5 0 0113 0H1.5z" />
            </svg>
          }
          title={emptyTitle}
          action={filtro !== 'baja' ? { href: '/jugadores/nuevo', label: '+ Añadir jugador' } : undefined}
        />
      ) : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head-row">
                <th className="table-th">Nombre</th>
                <th className="table-th">Posición</th>
                <th className="table-th">Nivel</th>
                <th className="table-th">Estado</th>
                <th className="table-th">Teléfono</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {players.map((player) => (
                <tr key={player.id} className="table-row cursor-pointer">
                  <td className="px-4 py-3">
                    <Link
                      href={`/jugadores/${player.id}`}
                      className="font-medium text-texto hover:text-verde-bright transition-colors"
                    >
                      {player.full_name}
                    </Link>
                    {player.email && (
                      <div className="text-xs text-apagado mt-0.5">{player.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-apagado">
                    {player.position ? POSITION_LABELS[player.position] : '—'}
                  </td>
                  <td className="px-4 py-3 text-apagado">{player.level ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={player.status === 'activo' ? 'badge-green' : 'badge-gray'}>
                      {player.status === 'activo' ? 'Activo' : 'Baja'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-apagado">{player.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
