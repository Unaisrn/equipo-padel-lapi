import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { WithdrawalForm } from '@/components/retiradas/WithdrawalForm'
import { createWithdrawal } from '@/app/retiradas/actions'

export const dynamic = 'force-dynamic'

export default async function NuevaRetiradaPage() {
  const supabase = await createClient()

  const [{ data: players }, { data: matches }] = await Promise.all([
    supabase
      .from('players')
      .select('id, full_name')
      .eq('status', 'activo')
      .order('full_name'),
    supabase
      .from('matches')
      .select('id, date, opponent')
      .order('date', { ascending: false }),
  ])

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/retiradas" className="back-link">← Retiradas</Link>
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mt-2">
          Nueva retirada
        </h1>
        <p className="text-sm text-apagado mt-1">
          Registra la baja de un jugador del equipo o de un partido concreto.
        </p>
      </div>

      <WithdrawalForm
        players={players ?? []}
        matches={matches ?? []}
        action={createWithdrawal}
      />
    </div>
  )
}
