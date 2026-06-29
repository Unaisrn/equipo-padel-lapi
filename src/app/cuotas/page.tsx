import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeeList } from '@/components/cuotas/FeeList'
import type { FeeWithPlayer } from '@/components/cuotas/MarkPaidModal'
import type { FeeStatus } from '@/types/database'

const FILTROS = [
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Pagadas',    value: 'pagado' },
  { label: 'Todas',      value: 'todas' },
]

interface Props {
  searchParams: Promise<{ estado?: string }>
}

export default async function CuotasPage({ searchParams }: Props) {
  const { estado } = await searchParams
  const filtro = (estado ?? 'pendiente') as FeeStatus | 'todas'

  const supabase = await createClient()

  const query = supabase
    .from('player_fees')
    .select('*, players(full_name)')
    .order('created_at', { ascending: false })

  const { data, error } =
    filtro === 'todas' ? await query : await query.eq('status', filtro)

  if (error) throw error

  const fees = (data ?? []) as unknown as FeeWithPlayer[]

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold">
          Cuotas
        </h1>
        <div className="flex gap-2">
          <Link
            href="/cuotas/lote"
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-borde text-apagado
                       hover:text-texto hover:border-verde/40 transition-colors"
          >
            + Cuota en lote
          </Link>
          <Link href="/cuotas/nueva" className="btn-primary">
            + Nueva cuota
          </Link>
        </div>
      </div>

      <div className="pill-tabs mb-6">
        {FILTROS.map(({ label, value }) => (
          <Link
            key={value}
            href={`/cuotas?estado=${value}`}
            className={`pill-tab ${filtro === value ? 'pill-tab-active' : ''}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <FeeList fees={fees} />
    </div>
  )
}
