'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PaymentMethod } from '@/types/database'

export type FeeFormState = { error: string } | { success: true } | null
export type BatchFeeFormState = { error: string } | { success: true; count: number } | null

export async function createFee(
  _prevState: FeeFormState,
  formData: FormData
): Promise<FeeFormState> {
  const player_id = formData.get('player_id') as string
  const concept = (formData.get('concept') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  const due_date = (formData.get('due_date') as string) || null

  if (!player_id) return { error: 'Selecciona un jugador' }
  if (!concept) return { error: 'El concepto es obligatorio' }
  if (isNaN(amount) || amount <= 0) return { error: 'El importe debe ser mayor que 0' }

  const supabase = await createClient()
  const { error } = await supabase.from('player_fees').insert({
    player_id,
    concept,
    amount,
    due_date,
    status: 'pendiente',
  })

  if (error) return { error: error.message }

  revalidatePath('/cuotas')
  redirect('/cuotas')
}

export async function createBatchFees(
  _prevState: BatchFeeFormState,
  formData: FormData
): Promise<BatchFeeFormState> {
  const concept = (formData.get('concept') as string)?.trim()
  const amount = parseFloat(formData.get('amount') as string)
  const due_date = (formData.get('due_date') as string) || null

  if (!concept) return { error: 'El concepto es obligatorio' }
  if (isNaN(amount) || amount <= 0) return { error: 'El importe debe ser mayor que 0' }

  const supabase = await createClient()
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('id')
    .eq('status', 'activo')

  if (playersError) return { error: playersError.message }
  if (!players || players.length === 0) return { error: 'No hay jugadores activos' }

  const fees = players.map((p) => ({
    player_id: p.id,
    concept,
    amount,
    due_date,
    status: 'pendiente' as const,
  }))

  const { error } = await supabase.from('player_fees').insert(fees)
  if (error) return { error: error.message }

  revalidatePath('/cuotas')
  return { success: true, count: players.length }
}

export async function markAsPaid(
  feeId: string,
  _prevState: FeeFormState,
  formData: FormData
): Promise<FeeFormState> {
  const payment_method = formData.get('payment_method') as PaymentMethod
  const paid_at = (formData.get('paid_at') as string) || new Date().toISOString().split('T')[0]

  if (!payment_method) return { error: 'Selecciona un método de pago' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('player_fees')
    .update({ status: 'pagado', payment_method, paid_at })
    .eq('id', feeId)

  if (error) return { error: error.message }

  revalidatePath('/cuotas')
  return { success: true }
}

// Reverts a fee to 'pendiente' and deletes the associated ingreso in team_transactions.
// Decision: we delete the caja entry because if the payment didn't happen, the ingreso
// shouldn't exist either. The manager can add a manual entry in Caja if needed.
export async function markAsPending(feeId: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: txError } = await supabase
    .from('team_transactions')
    .delete()
    .eq('related_fee_id', feeId)

  if (txError) return { error: txError.message }

  const { error } = await supabase
    .from('player_fees')
    .update({ status: 'pendiente', paid_at: null, payment_method: null })
    .eq('id', feeId)

  if (error) return { error: error.message }

  revalidatePath('/cuotas')
  return {}
}
