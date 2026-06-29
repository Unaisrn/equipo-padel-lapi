import Link from 'next/link'
import { PlayerForm } from '@/components/jugadores/PlayerForm'
import { createPlayer } from '@/app/jugadores/actions'

export default function NuevoJugadorPage() {
  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/jugadores" className="back-link">← Jugadores</Link>
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mt-2">
          Añadir jugador
        </h1>
      </div>
      <div className="card p-6">
        <PlayerForm action={createPlayer} />
      </div>
    </div>
  )
}
