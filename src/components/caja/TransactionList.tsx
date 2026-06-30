'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTransaction } from '@/app/caja/actions'
import { TransactionModal } from './TransactionModal'
import type { Database } from '@/types/database'

export type TransactionWithPlayer = Database['public']['Tables']['team_transactions']['Row'] & {
  players: { full_name: string } | null
}

interface Props {
  transactions: TransactionWithPlayer[]
}

export function TransactionList({ transactions }: Props) {
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithPlayer | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleExportCSV() {
    const today = new Date().toISOString().slice(0, 10)
    const headers = ['Fecha', 'Tipo', 'Concepto', 'Importe', 'Jugador']
    const rows = transactions.map((tx) => [
      new Date(tx.date + 'T00:00:00').toLocaleDateString('es-ES'),
      tx.type === 'ingreso' ? 'Ingreso' : 'Gasto',
      tx.concept,
      (tx.type === 'gasto' ? '-' : '') + tx.amount.toFixed(2),
      tx.players?.full_name ?? '',
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `caja-andalucistas-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete(tx: TransactionWithPlayer) {
    if (!confirm(`¿Eliminar "${tx.concept}"?\nEsta acción no se puede deshacer.`)) return
    setDeletingId(tx.id)
    startTransition(async () => {
      const result = await deleteTransaction(tx.id)
      if (result.error) alert(`Error: ${result.error}`)
      else router.refresh()
      setDeletingId(null)
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-apagado">
          {transactions.length} movimiento{transactions.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <button onClick={handleExportCSV} className="btn-secondary">
              Exportar CSV
            </button>
          )}
          <button onClick={() => setShowNew(true)} className="btn-primary">
            + Nuevo movimiento
          </button>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 text-apagado text-sm">
          No hay movimientos con el filtro seleccionado.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-head-row">
                <th className="table-th">Fecha</th>
                <th className="table-th">Concepto</th>
                <th className="table-th">Jugador</th>
                <th className="table-th text-right">Importe</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody className="table-divider">
              {transactions.map((tx) => (
                <tr key={tx.id} className="table-row">
                  <td className="px-4 py-3 text-apagado whitespace-nowrap">
                    {new Date(tx.date + 'T00:00:00').toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-texto">{tx.concept}</td>
                  <td className="px-4 py-3 text-apagado">{tx.players?.full_name ?? '—'}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-semibold whitespace-nowrap tabular-nums ${
                      tx.type === 'ingreso' ? 'text-verde-bright' : 'text-rojo'
                    }`}
                  >
                    {tx.type === 'ingreso' ? '+' : '−'}
                    {tx.amount.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    {tx.related_fee_id ? (
                      <span className="badge-gray">vinculado a cuota</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditingTx(tx)} className="btn-sm-ghost">
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={deletingId === tx.id || isPending}
                          className="btn-sm-danger"
                        >
                          {deletingId === tx.id ? '...' : 'Eliminar'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <TransactionModal onClose={() => setShowNew(false)} />}
      {editingTx && (
        <TransactionModal
          key={editingTx.id}
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
    </>
  )
}
