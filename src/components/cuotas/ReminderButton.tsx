'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { FeeWithPlayer } from './MarkPaidModal'

function fmt(n: number): string {
  const s = n.toFixed(2)
  return s.endsWith('.00') ? `${Math.trunc(n)}€` : `${s}€`
}

function generateText(fees: FeeWithPlayer[], today: string): string {
  const sorted = [...fees].sort((a, b) =>
    (a.players?.full_name ?? '').localeCompare(b.players?.full_name ?? '', 'es') ||
    a.concept.localeCompare(b.concept, 'es')
  )

  const lines = sorted.map((fee) => {
    const name = fee.players?.full_name ?? 'Jugador desconocido'
    const overdue = fee.due_date && fee.due_date < today ? ' ⚠️ vencida' : ''
    return `• ${name} — ${fee.concept} (${fmt(fee.amount)})${overdue}`
  })

  const total = fees.reduce((sum, f) => sum + Number(f.amount), 0)

  return [
    '📋 Recordatorio de cuotas pendientes — Andalucistas',
    '',
    ...lines,
    '',
    `Total pendiente: ${fmt(total)}`,
    '',
    'Podéis pagar por Bizum cuando podáis 🎾',
  ].join('\n')
}

interface Props {
  pendingFees: FeeWithPlayer[]
}

export function ReminderButton({ pendingFees }: Props) {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const text = generateText(pendingFees, today)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    toast.success('Mensaje copiado')
  }

  if (pendingFees.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2.5 text-sm font-medium rounded-lg border border-borde text-apagado
                   hover:text-texto hover:border-verde/40 transition-colors"
      >
        Recordatorio
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="card w-full max-w-lg p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-texto">Recordatorio para WhatsApp</h2>
              <button
                onClick={close}
                className="text-apagado hover:text-texto transition-colors text-xl leading-none px-1"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <pre className="text-sm whitespace-pre-wrap font-mono bg-fondo border border-borde
                            rounded-xl p-4 text-texto leading-relaxed mb-4 select-all max-h-80 overflow-y-auto">
              {text}
            </pre>

            <p className="text-xs text-tenue mb-4">
              Haz clic sobre el texto para seleccionarlo, o usa el botón de abajo.
            </p>

            <div className="flex items-center gap-3">
              <button onClick={handleCopy} className="btn-primary">
                Copiar al portapapeles
              </button>
              <button onClick={close} className="btn-secondary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
