'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { NazariStar } from '@/components/NazariStar'

// ── Iconos SVG simples para la navegación ────────────────────────────────────
function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <circle cx="8" cy="5" r="3" />
      <path d="M1.5 15a6.5 6.5 0 0113 0H1.5z" />
    </svg>
  )
}

function IconReceipt() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M3 1a1 1 0 00-1 1v12l2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V2a1 1 0 00-1-1H3zm1 4h8v1.5H4V5zm0 3h6v1.5H4V8z" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v1H2V3z" />
      <path d="M1 6a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1H2a1 1 0 01-1-1V6zm9 2a1 1 0 000 2h2a1 1 0 000-2h-2z" />
    </svg>
  )
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <circle cx="6.5" cy="5" r="2.5" />
      <path d="M1 14a5.5 5.5 0 019.17-4.1M13 7h-3m3 0l-2-2m2 2l-2 2" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M5 1v2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1h-2V1h-1.5v2h-3V1H5zm-2 5h10v7H3V6z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <rect x="1" y="9" width="4" height="6" rx="0.5" />
      <rect x="6" y="5" width="4" height="10" rx="0.5" />
      <rect x="11" y="1" width="4" height="14" rx="0.5" />
    </svg>
  )
}

function IconMenu() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden>
      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3v-1.5H3.5v-9H6V2z" />
      <path d="M9 5l4 3-4 3V9H5.5V7H9V5z" />
    </svg>
  )
}

// ── Navegación ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/',            label: 'Resumen',      icon: <IconGrid /> },
  { href: '/jugadores',   label: 'Jugadores',    icon: <IconUser /> },
  { href: '/cuotas',      label: 'Cuotas',       icon: <IconReceipt /> },
  { href: '/caja',        label: 'Caja',         icon: <IconWallet /> },
  { href: '/retiradas',   label: 'Retiradas',    icon: <IconArrowLeft /> },
  { href: '/partidos',    label: 'Partidos',     icon: <IconCalendar /> },
  { href: '/estadisticas',label: 'Estadísticas', icon: <IconChart /> },
]

// ── Componente principal ─────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Login page: renderizar sin sidebar
  if (pathname === '/login') return <>{children}</>

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const sidebarInner = (
    <div className="flex flex-col h-full">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-borde">
        <NazariStar className="w-8 h-8 text-rojo shrink-0" />
        <div className="leading-tight min-w-0">
          <p className="font-display text-[15px] uppercase tracking-[0.15em] text-texto font-bold">
            Andalucistas
          </p>
          <p className="text-[10px] text-apagado tracking-widest uppercase">Pádel LAPI</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-verde text-white shadow-sm'
                  : 'text-apagado hover:text-texto hover:bg-verde/15'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Pie: cerrar sesión */}
      <div className="px-2.5 py-4 border-t border-borde">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-apagado
                     hover:text-rojo hover:bg-rojo/10 transition-all"
        >
          <IconSignOut />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-fondo overflow-hidden">
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-verde-dark flex flex-col
          border-r border-borde
          transition-transform duration-200 ease-out
          md:static md:translate-x-0 md:shrink-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarInner}
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar móvil */}
        <header className="md:hidden flex items-center gap-3 h-14 px-4 bg-verde-dark border-b border-borde shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg text-apagado hover:text-texto hover:bg-verde/20 transition-colors"
            aria-label="Abrir menú"
          >
            <IconMenu />
          </button>
          <NazariStar className="w-5 h-5 text-rojo shrink-0" />
          <span className="font-display text-sm uppercase tracking-widest text-texto font-bold">
            Andalucistas
          </span>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
