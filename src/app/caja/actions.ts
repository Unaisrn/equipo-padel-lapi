'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TransactionType } from '@/types/database'

export type TransactionFormState = { error: string } | { success: true } | null

function parseForm(formData: FormData) {
  return {
    type: formData.get('type') as TransactionType,
    concept: (formData.get('concept') as string)?.trim(),
    amount: parseFloat(formData.get('amount') as string),
    date: formData.get('date') as string,
  }
}

function validate(data: ReturnType<typeof parseForm>): string | null {
  if (!data.type) return 'Selecciona el tipo'
  if (!data.concept) return 'El concepto es obligatorio'
  if (isNaN(data.amount) || data.amount <= 0) return 'El importe debe ser mayor que 0'
  if (!data.date) return 'La fecha es obligatoria'
  return null
}

export async function createTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const data = parseForm(formData)
  const err = validate(data)
  if (err) return { error: err }

  const supabase = await createClient()
  const { error } = await supabase
    .from('team_transactions')
    .insert({ type: data.type, concept: data.concept, amount: data.amount, date: data.date })

  if (error) return { error: error.message }

  revalidatePath('/caja')
  return { success: true }
}

export async function updateTransaction(
  id: string,
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const data = parseForm(formData)
  const err = validate(data)
  if (err) return { error: err }

  const supabase = await createClient()

  // Safety: never edit fee-linked transactions
  const { data: tx } = await supabase
    .from('team_transactions')
    .select('related_fee_id')
    .eq('id', id)
    .single()

  if (tx?.related_fee_id) {
    return { error: 'Este movimiento está vinculado a una cuota; gestiónalo desde Cuotas' }
  }

  const { error } = await supabase
    .from('team_transactions')
    .update({ type: data.type, concept: data.concept, amount: data.amount, date: data.date })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/caja')
  return { success: true }
}

export async function deleteTransaction(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Safety: never delete fee-linked transactions
  const { data: tx } = await supabase
    .from('team_transactions')
    .select('related_fee_id')
    .eq('id', id)
    .single()

  if (tx?.related_fee_id) {
    return { error: 'Este movimiento está vinculado a una cuota; gestiónalo desde Cuotas' }
  }

  const { error } = await supabase.from('team_transactions').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/caja')
  return {}
}
