'use client'

import { useId } from 'react'

/**
 * Estrella Nazarí de 8 puntas — geometría de dos cuadrados superpuestos (lacería).
 *
 * Construcción matemática:
 *   Cuadrado 1 (◇): vértices en los ejes N/E/S/W (50,6)(94,50)(50,94)(6,50)
 *   Cuadrado 2 (□): vértices en las diagonales NE/SE/SW/NW (81,19)(81,81)(19,81)(19,19)
 *   Sus aristas se cruzan en los 8 puntos valle, que forman el contorno de la estrella.
 *   Las bandas de ambos cuadrados dibujadas sobre el relleno crean el patrón de lacería.
 */
export function NazariStar({ className }: { className?: string }) {
  const uid = useId()
  const clipId = `nz${uid.replace(/[^a-zA-Z0-9]/g, '')}`

  // 16 vértices: tips del ◇ y del □ alternados con los valles (puntos de intersección)
  const starPts =
    '50,6 63,19 81,19 81,37 94,50 81,63 81,81 63,81 50,94 37,81 19,81 19,63 6,50 19,37 19,19 37,19'

  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={className}>
      <defs>
        <clipPath id={clipId}>
          <polygon points={starPts} />
        </clipPath>
      </defs>

      {/* Relleno base de la estrella */}
      <polygon points={starPts} fill="currentColor" />

      {/* Bandas de lacería: Cuadrado 1 (◇) + Cuadrado 2 (□), recortadas al contorno */}
      <g clipPath={`url(#${clipId})`}>
        <polygon
          points="50,6 94,50 50,94 6,50"
          stroke="white"
          strokeWidth="11"
          fill="none"
          strokeLinejoin="miter"
        />
        <rect
          x="19" y="19" width="62" height="62"
          stroke="white"
          strokeWidth="11"
          fill="none"
        />
      </g>

      {/* Medallón central: disco en color estrella + anillo blanco */}
      <circle cx="50" cy="50" r="12" fill="currentColor" />
      <circle cx="50" cy="50" r="7.5" stroke="white" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
