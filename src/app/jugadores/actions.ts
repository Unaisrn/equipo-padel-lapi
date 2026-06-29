'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { PlayerPosition } from '@/types/database'

export type PlayerFormState = { error: string } | { success: true } | null

function extractPlayerData(formData: FormData) {
  const rawPosition = formData.get('position') as string
  return {
    full_name: (formData.get('full_name') as string)?.trim(),
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    position: (rawPosition || null) as PlayerPosition | null,
    level: (formData.get('level') as string) || null,
    joined_at: formData.get('joined_at') as string,
    notes: (formData.get('notes') as string) || null,
  }
}

export async function createPlayer(
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const data = extractPlayerData(formData)
  if (!data.full_name) return { error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const { error } = await supabase.from('players').insert({ ...data, status: 'activo' })
  if (error) return { error: error.message }

  revalidatePath('/jugadores')
  redirect('/jugadores')
}

export async function updatePlayer(
  id: string,
  _prevState: PlayerFormState,
  formData: FormData
): Promise<PlayerFormState> {
  const data = extractPlayerData(formData)
  if (!data.full_name) return { error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const { error } = await supabase.from('players').update(data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/jugadores')
  revalidatePath(`/jugadores/${id}`)
  return { success: true }
}

export async function darDeBaja(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('players').update({ status: 'baja' }).eq('id', id)
  revalidatePath('/jugadores')
  revalidatePath(`/jugadores/${id}`)
}

export async function deletePlayer(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('players').delete().eq('id', id)
  revalidatePath('/jugadores')
  redirect('/jugadores')
}
