'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { darDeBaja, deletePlayer } from '@/app/jugadores/actions'

export function BajaButton({ playerId }: { playerId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleBaja() {
    if (!confirm('¿Dar de baja a este jugador del equipo?\nSu estado cambiará a "baja".')) return
    startTransition(async () => {
      await darDeBaja(playerId)
      toast.success('Jugador dado de baja')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleBaja}
      disabled={isPending}
      className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                 text-amber-300 bg-amber-950/40 border-amber-700/30
                 hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Procesando...' : 'Dar de baja'}
    </button>
  )
}

export function DeletePlayerButton({ playerId }: { playerId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar este jugador?\nEsta acción no se puede deshacer.')) return
    startTransition(async () => {
      await deletePlayer(playerId)
      toast.success('Jugador eliminado')
      router.push('/jugadores')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                 text-red-300 bg-rojo/10 border-rojo/20
                 hover:bg-rojo/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Eliminando...' : 'Eliminar jugador'}
    </button>
  )
}
