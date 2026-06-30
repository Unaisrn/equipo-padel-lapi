'use client'

import dynamic from 'next/dynamic'

const NavProgressBar = dynamic(() => import('./NavProgressBar'), { ssr: false })

export default function NavProgress() {
  return <NavProgressBar />
}
