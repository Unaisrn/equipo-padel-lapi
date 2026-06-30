import type { Metadata } from 'next'
import { Geist, Barlow_Condensed } from 'next/font/google'
import { Toaster } from 'sonner'
import NavProgress from '@/components/NavProgress'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['600', '700'],
})

export const metadata: Metadata = {
  title: 'Andalucistas',
  description: 'Gestión del equipo de pádel LAPI',
  icons: {
    icon: [
      { url: '/branding/estrella-nazari.svg', type: 'image/svg+xml' },
      { url: '/branding/estrella-nazari.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/branding/estrella-nazari.svg', sizes: '32x32', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${barlowCondensed.variable} h-full`}
    >
      <body className="h-full bg-fondo text-texto antialiased">
        <AppShell>{children}</AppShell>
        <Toaster richColors theme="dark" position="bottom-right" />
        <NavProgress />
      </body>
    </html>
  )
}
