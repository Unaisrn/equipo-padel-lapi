'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { markAsPending } from '@/app/cuotas/actions'
import { MarkPaidModal } from './MarkPaidModal'
import type { FeeWithPlayer } from './MarkPaidModal'

const METHOD_LABEL: Record<string, string> = {
  efectivo:      'Efectivo',
  bizum:         'Bizum',
  transferencia: 'Transferencia',
  otro:          'Otro',
}

interface Props {
  fees: FeeWithPlayer[]
}

export function FeeList({ fees }: Props) {
  const router = useRouter()
  const [selectedFee, setSelectedFee] = useState<FeeWithPlayer | null>(null)
  const [isPending, startTransition] = useTransition()
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const today = new Date().toISOString().slice(0, 10)

  function handleUndo(fee: FeeWithPlayer) {
    const name = fee.players?.full_name ?? 'este jugador'
    if (
      !confirm(
        `¿Anular el pago de "${fee.concept}" de ${name}?\n\nSe eliminará el ingreso de caja correspondiente.`
      )
    )
      return

    setUndoingId(fee.id)
    startTransition(async () => {
      const result = await markAsPending(fee.id)
      if (result.error) {
        toast.error(`Error al anular el pago: ${result.error}`)
      } else {
        toast.success('Pago anulado')
        router.refresh()
      }
      setUndoingId(null)
    })
  }

  function statusBadge(fee: FeeWithPlayer) {
    const vencida = fee.status === 'pendiente' && !!fee.due_date && fee.due_date < today
    const cls = fee.status === 'pagado' ? 'badge-green' : vencida ? 'badge-red' : 'badge-amber'
    const label = fee.status === 'pagado' ? 'Pagado' : vencida ? 'Vencida' : 'Pendiente'
    return <span className={cls}>{label}</span>
  }

  function actionButton(fee: FeeWithPlayer) {
    return fee.status === 'pendiente' ? (
      <button onClick={() => setSelectedFee(fee)} className="btn-sm-primary">
        Marcar pagado
      </button>
    ) : (
      <button
        onClick={() => handleUndo(fee)}
        disabled={undoingId === fee.id || isPending}
        className="btn-sm-danger"
      >
        {undoingId === fee.id ? 'Anulando...' : 'Anular pago'}
      </button>
    )
  }

  if (fees.length === 0) {
    return (
      <div className="text-center py-16 text-apagado text-sm">
        No hay cuotas con el filtro seleccionado.
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop: tabla ─────────────────────────────────────────── */}
      <div className="table-wrap hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head-row">
              <th className="table-th">Jugador</th>
              <th className="table-th">Concepto</th>
              <th className="table-th text-right">Importe</th>
              <th className="table-th">Estado</th>
              <th className="table-th">Fecha límite</th>
              <th className="table-th">Acciones</th>
            </tr>
          </thead>
          <tbody className="table-divider">
            {fees.map((fee) => (
              <tr key={fee.id} className="table-row">
                <td className="px-4 py-3 font-medium text-texto">
                  {fee.players?.full_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-apagado">{fee.concept}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-texto tabular-nums">
                  {fee.amount.toFixed(2)} €
                </td>
                <td className="px-4 py-3">
                  {statusBadge(fee)}
                  {fee.status === 'pagado' && fee.payment_method && (
                    <span className="ml-2 text-xs text-tenue">
                      {METHOD_LABEL[fee.payment_method]}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-apagado">
                  {fee.due_date
                    ? new Date(fee.due_date + 'T00:00:00').toLocaleDateString('es-ES')
                    : '—'}
                </td>
                <td className="px-4 py-3">{actionButton(fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile: cards ──────────────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {fees.map((fee) => (
          <div key={fee.id} className="card p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-medium text-texto text-sm">
                {fee.players?.full_name ?? '—'}
              </span>
              {statusBadge(fee)}
            </div>
            <p className="text-sm text-apagado mb-2">{fee.concept}</p>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono font-semibold text-texto tabular-nums">
                {fee.amount.toFixed(2)} €
              </span>
              <span className="text-xs text-apagado">
                {fee.due_date
                  ? `Vence: ${new Date(fee.due_date + 'T00:00:00').toLocaleDateString('es-ES')}`
                  : 'Sin fecha límite'}
              </span>
            </div>
            <div>{actionButton(fee)}</div>
            {fee.status === 'pagado' && fee.payment_method && (
              <p className="text-xs text-tenue mt-2">{METHOD_LABEL[fee.payment_method]}</p>
            )}
          </div>
        ))}
      </div>

      {selectedFee && (
        <MarkPaidModal
          key={selectedFee.id}
          fee={selectedFee}
          onClose={() => setSelectedFee(null)}
        />
      )}
    </>
  )
}
