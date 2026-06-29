import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FeeForm } from '@/components/cuotas/FeeForm'
import { createFee } from '@/app/cuotas/actions'

export default async function NuevaCuotaPage() {
  const supabase = await createClient()
  const { data: players, error } = await supabase
    .from('players')
    .select('id, full_name')
    .eq('status', 'activo')
    .order('full_name')

  if (error) throw error

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/cuotas" className="back-link">← Cuotas</Link>
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mt-2">
          Nueva cuota
        </h1>
        <p className="text-sm text-apagado mt-1">Crea una cuota para un jugador concreto.</p>
      </div>

      {players.length === 0 ? (
        <div className="alert-warning">
          No hay jugadores activos.{' '}
          <Link href="/jugadores/nuevo" className="font-medium underline">Añade jugadores</Link>{' '}
          primero.
        </div>
      ) : (
        <FeeForm players={players} action={createFee} />
      )}
    </div>
  )
}
