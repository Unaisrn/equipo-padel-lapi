'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const COLOR = '#2d9660'
const DELAY = 150

function isLocalLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href') ?? ''
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
  if (anchor.target === '_blank') return false
  try {
    return new URL(href, location.href).origin === location.origin
  } catch {
    return false
  }
}

function isSameURL(anchor: HTMLAnchorElement): boolean {
  try {
    const url = new URL(anchor.getAttribute('href') ?? '', location.href)
    return url.pathname + url.search === location.pathname + location.search
  } catch {
    return false
  }
}

export default function NavProgressBar() {
  const pathname = usePathname()
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  function show() {
    const bar = barRef.current
    if (!bar) return
    bar.style.transition = 'none'
    bar.style.opacity = '1'
    bar.style.width = '0%'
    void bar.offsetHeight // force reflow so transition starts from 0
    bar.style.transition = 'width 8s cubic-bezier(0.05, 0.8, 0.5, 1)'
    bar.style.width = '85%'
  }

  function hide() {
    const bar = barRef.current
    if (!bar) return
    bar.style.transition = 'width 0.15s ease, opacity 0.25s ease 0.1s'
    bar.style.width = '100%'
    bar.style.opacity = '0'
  }

  // Detect anchor clicks → start progress after delay
  // Must happen in capture phase so it fires before Link's own handler
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as Element).closest('a')
      if (!anchor || !isLocalLink(anchor) || isSameURL(anchor)) return

      if (delayTimer.current) clearTimeout(delayTimer.current)
      delayTimer.current = setTimeout(show, DELAY)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (delayTimer.current) clearTimeout(delayTimer.current)
    }
  }, [])

  // pathname change = new route rendered = navigation complete → stop bar
  useEffect(() => {
    if (delayTimer.current) {
      clearTimeout(delayTimer.current)
      delayTimer.current = null
    }
    hide()
  }, [pathname])

  return (
    <div
      ref={barRef}
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '0%',
        height: '2px',
        background: COLOR,
        zIndex: 99999,
        opacity: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
