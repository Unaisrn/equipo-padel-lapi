import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { calcularDesgloseCaja } from '@/lib/stats'
import { FilterBar } from '@/components/caja/FilterBar'
import { TransactionList } from '@/components/caja/TransactionList'
import type { TransactionWithPlayer } from '@/components/caja/TransactionList'
import type { TransactionType } from '@/types/database'

interface Props {
  searchParams: Promise<{ tipo?: string; desde?: string; hasta?: string }>
}

export default async function CajaPage({ searchParams }: Props) {
  const { tipo, desde, hasta } = await searchParams
  const tipoFiltro = (tipo ?? 'todos') as TransactionType | 'todos'

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('team_transactions')
    .select('*, players(full_name)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error

  const all = (data ?? []) as unknown as TransactionWithPlayer[]

  const { balance, totalIngresos, totalGastos } = calcularDesgloseCaja(all)

  let displayed = all
  if (tipoFiltro !== 'todos') displayed = displayed.filter((t) => t.type === tipoFiltro)
  if (desde) displayed = displayed.filter((t) => t.date >= desde)
  if (hasta) displayed = displayed.filter((t) => t.date <= hasta)

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mb-6">
        Caja
      </h1>

      {/* Balance card */}
      <div className={`card p-6 mb-6 ${balance >= 0 ? 'border-verde/30' : 'border-rojo/30'}`}>
        <p className="text-xs font-medium text-apagado uppercase tracking-wider mb-1">Saldo actual</p>
        <p className={`text-4xl font-bold font-mono ${balance >= 0 ? 'text-verde-bright' : 'text-rojo'}`}>
          {balance >= 0 ? '+' : ''}
          {balance.toFixed(2)} €
        </p>
        <p className="text-xs text-apagado mt-2">
          +{totalIngresos.toFixed(2)} € ingresos
          <span className="mx-1.5 text-tenue">·</span>
          {totalGastos > 0 ? '−' : ''}{totalGastos.toFixed(2)} € gastos
        </p>
      </div>

      <FilterBar tipo={tipoFiltro} desde={desde ?? ''} hasta={hasta ?? ''} />

      <TransactionList transactions={displayed} />
    </div>
  )
}
