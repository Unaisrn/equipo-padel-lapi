import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BatchFeeForm } from '@/components/cuotas/BatchFeeForm'
import { createBatchFees } from '@/app/cuotas/actions'

export const dynamic = 'force-dynamic'

export default async function LoteCuotaPage() {
  const supabase = await createClient()
  const { data: players, error } = await supabase
    .from('players')
    .select('id')
    .eq('status', 'activo')

  if (error) throw error

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/cuotas" className="back-link">← Cuotas</Link>
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mt-2">
          Cuota en lote
        </h1>
        <p className="text-sm text-apagado mt-1">
          Crea la misma cuota para los{' '}
          <span className="font-medium text-texto">{players.length} jugadores activos</span>{' '}
          del equipo.
        </p>
      </div>

      {players.length === 0 ? (
        <div className="alert-warning">
          No hay jugadores activos.{' '}
          <Link href="/jugadores/nuevo" className="font-medium underline">Añade jugadores</Link>{' '}
          primero.
        </div>
      ) : (
        <BatchFeeForm activePlayerCount={players.length} action={createBatchFees} />
      )}
    </div>
  )
}
