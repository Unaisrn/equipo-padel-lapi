'use client'

import { useRouter, usePathname } from 'next/navigation'

const TIPOS = [
  { label: 'Todos',    value: 'todos' },
  { label: 'Ingresos', value: 'ingreso' },
  { label: 'Gastos',   value: 'gasto' },
]

interface Props {
  tipo: string
  desde: string
  hasta: string
}

export function FilterBar({ tipo, desde, hasta }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function buildSearch(overrides: Partial<{ tipo: string; desde: string; hasta: string }>) {
    const merged = { tipo, desde, hasta, ...overrides }
    const params = new URLSearchParams()
    if (merged.tipo && merged.tipo !== 'todos') params.set('tipo', merged.tipo)
    if (merged.desde) params.set('desde', merged.desde)
    if (merged.hasta) params.set('hasta', merged.hasta)
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="pill-tabs">
        {TIPOS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => router.push(buildSearch({ tipo: value }))}
            className={`pill-tab ${tipo === value ? 'pill-tab-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-apagado">
        <span>Desde</span>
        <input
          type="date"
          value={desde}
          onChange={(e) => router.push(buildSearch({ desde: e.target.value }))}
          className="field-input w-auto px-2.5 py-1.5 text-sm"
        />
        <span>hasta</span>
        <input
          type="date"
          value={hasta}
          onChange={(e) => router.push(buildSearch({ hasta: e.target.value }))}
          className="field-input w-auto px-2.5 py-1.5 text-sm"
        />
        {(desde || hasta) && (
          <button
            onClick={() => router.push(buildSearch({ desde: '', hasta: '' }))}
            className="text-xs text-apagado hover:text-texto underline"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}
