'use client'

import { AppProgressBar } from 'next-nprogress-bar'

export default function NavProgress() {
  return (
    <AppProgressBar
      color="#2d9660"
      height="2px"
      options={{ showSpinner: false, trickleSpeed: 150 }}
      delay={150}
      shallowRouting
    />
  )
}
