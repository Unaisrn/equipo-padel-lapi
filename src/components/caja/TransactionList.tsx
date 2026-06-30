'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { deleteTransaction } from '@/app/caja/actions'
import { TransactionModal } from './TransactionModal'
import type { Database } from '@/types/database'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

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
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Movimiento eliminado')
        router.refresh()
      }
      setDeletingId(null)
    })
  }

  function formatAmount(tx: TransactionWithPlayer) {
    return (
      <span className={`font-mono font-semibold whitespace-nowrap tabular-nums ${
        tx.type === 'ingreso' ? 'text-verde-bright' : 'text-rojo'
      }`}>
        {tx.type === 'ingreso' ? '+' : '−'}
        {tx.amount.toFixed(2)} €
      </span>
    )
  }

  function actionCell(tx: TransactionWithPlayer) {
    return tx.related_fee_id ? (
      <span className="badge-gray">vinculado a cuota</span>
    ) : (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditingTx(tx)} className="btn-sm-ghost">Editar</button>
        <button
          onClick={() => handleDelete(tx)}
          disabled={deletingId === tx.id || isPending}
          className="btn-sm-danger inline-flex items-center gap-1.5"
        >
          {deletingId === tx.id ? <Spinner className="w-3 h-3" /> : 'Eliminar'}
        </button>
      </div>
    )
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
        <EmptyState
          icon={
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full" aria-hidden>
              <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v1H2V3z" />
              <path d="M1 6a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V6zm9 2a1 1 0 000 2h2a1 1 0 000-2h-2z" />
            </svg>
          }
          title="No hay movimientos con el filtro seleccionado."
        />
      ) : (
        <>
          {/* ── Desktop: tabla ─────────────────────────────────────── */}
          <div className="table-wrap hidden md:block">
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
                    <td className="px-4 py-3 text-right">{formatAmount(tx)}</td>
                    <td className="px-4 py-3">{actionCell(tx)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ──────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-texto text-sm truncate pr-2">{tx.concept}</span>
                  {formatAmount(tx)}
                </div>
                <div className="flex items-center justify-between text-xs text-apagado mb-3">
                  <span>{new Date(tx.date + 'T00:00:00').toLocaleDateString('es-ES')}</span>
                  {tx.players?.full_name && <span>{tx.players.full_name}</span>}
                </div>
                <div>{actionCell(tx)}</div>
              </div>
            ))}
          </div>
        </>
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
