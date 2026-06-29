'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
        alert(`Error al anular el pago: ${result.error}`)
      } else {
        router.refresh()
      }
      setUndoingId(null)
    })
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
      <div className="table-wrap">
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
                  <span className={fee.status === 'pagado' ? 'badge-green' : 'badge-amber'}>
                    {fee.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
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
                <td className="px-4 py-3">
                  {fee.status === 'pendiente' ? (
                    <button
                      onClick={() => setSelectedFee(fee)}
                      className="btn-sm-primary"
                    >
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
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
