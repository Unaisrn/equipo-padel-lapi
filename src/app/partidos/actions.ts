'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { HomeAway, MatchStatus } from '@/types/database'

export type MatchFormState = { error: string } | { success: true } | null
export type ResultFormState = { error: string } | { success: true } | null

export type PairInput = {
  player1: string
  player2: string
  setsWon: number
  setsLost: number
}

function parseMatchFields(formData: FormData) {
  return {
    date: formData.get('date') as string,
    opponent: ((formData.get('opponent') as string) ?? '').trim(),
    location: ((formData.get('location') as string) ?? '').trim() || null,
    home_away: formData.get('home_away') as HomeAway,
    notes: ((formData.get('notes') as string) ?? '').trim() || null,
  }
}

function validateMatchFields(data: ReturnType<typeof parseMatchFields>): string | null {
  if (!data.date) return 'La fecha es obligatoria'
  if (!data.opponent) return 'El nombre del rival es obligatorio'
  if (!data.home_away) return 'Selecciona si es local o visitante'
  return null
}

export async function createMatch(
  _prevState: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const data = parseMatchFields(formData)
  const err = validateMatchFields(data)
  if (err) return { error: err }

  const supabase = await createClient()
  const { data: match, error } = await supabase
    .from('matches')
    .insert({ ...data, status: 'programado' })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/partidos')
  redirect(`/partidos/${match.id}`)
}

export async function updateMatch(
  id: string,
  _prevState: MatchFormState,
  formData: FormData
): Promise<MatchFormState> {
  const data = parseMatchFields(formData)
  const status = (formData.get('status') as MatchStatus) ?? 'programado'
  const err = validateMatchFields(data)
  if (err) return { error: err }

  const supabase = await createClient()
  const { error } = await supabase
    .from('matches')
    .update({ ...data, status })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/partidos')
  revalidatePath(`/partidos/${id}`)
  return { success: true }
}

export async function saveResult(
  matchId: string,
  pairs: PairInput[]
): Promise<ResultFormState> {
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i]
    if (!p.player1 || !p.player2) return { error: `Pareja ${i + 1}: selecciona los 2 jugadores` }
    if (p.player1 === p.player2) return { error: `Pareja ${i + 1}: los dos jugadores deben ser distintos` }
  }

  const allPlayers = pairs.flatMap((p) => [p.player1, p.player2])
  if (new Set(allPlayers).size < allPlayers.length) {
    return { error: 'Un jugador no puede aparecer en más de una pareja' }
  }

  const supabase = await createClient()

  await supabase.from('match_sets').delete().eq('match_id', matchId)

  const sets = pairs.map((p, i) => ({
    match_id: matchId,
    pair_number: i + 1,
    player_ids: [p.player1, p.player2],
    sets_won: p.setsWon,
    sets_lost: p.setsLost,
    won: p.setsWon > p.setsLost,
  }))

  const { error: insertError } = await supabase.from('match_sets').insert(sets)
  if (insertError) return { error: insertError.message }

  const wons = sets.filter((s) => s.won).length
  const result_summary = `${wons}-${sets.length - wons}`

  const { error: updateError } = await supabase
    .from('matches')
    .update({ result_summary, status: 'jugado' })
    .eq('id', matchId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/partidos')
  revalidatePath(`/partidos/${matchId}`)
  return { success: true }
}
