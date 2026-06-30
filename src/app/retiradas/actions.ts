'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { WithdrawalScope } from '@/types/database'

export type WithdrawalFormState = { error: string } | { success: true } | null

export async function createWithdrawal(
  _prevState: WithdrawalFormState,
  formData: FormData
): Promise<WithdrawalFormState> {
  const player_id = formData.get('player_id') as string
  const scope = formData.get('scope') as WithdrawalScope
  const match_id = (formData.get('match_id') as string) || null
  const reason = (formData.get('reason') as string)?.trim() || null
  const date = formData.get('date') as string

  if (!player_id) return { error: 'Selecciona un jugador' }
  if (!scope) return { error: 'Selecciona el ámbito' }
  if (scope === 'partido' && !match_id) return { error: 'Selecciona el partido' }
  if (!date) return { error: 'La fecha es obligatoria' }

  const supabase = await createClient()
  const { error } = await supabase.from('withdrawals').insert({
    player_id,
    scope,
    match_id,
    reason,
    date,
  })

  if (error) return { error: error.message }

  // Revalidate player page so status change from trigger is reflected immediately
  revalidatePath('/retiradas')
  revalidatePath('/jugadores')
  revalidatePath(`/jugadores/${player_id}`)
  return { success: true }
}
