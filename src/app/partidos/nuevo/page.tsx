import Link from 'next/link'
import { MatchForm } from '@/components/partidos/MatchForm'
import { createMatch } from '@/app/partidos/actions'
import type { MatchFormState } from '@/app/partidos/actions'

type ActionFn = (prevState: MatchFormState, formData: FormData) => Promise<MatchFormState>

export default function NuevoPartidoPage() {
  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <Link href="/partidos" className="back-link">← Partidos</Link>
        <h1 className="font-display text-3xl uppercase tracking-widest text-texto font-bold mt-2">
          Programar partido
        </h1>
      </div>
      <div className="card p-6">
        <MatchForm action={createMatch as ActionFn} cancelHref="/partidos" />
      </div>
    </div>
  )
}
