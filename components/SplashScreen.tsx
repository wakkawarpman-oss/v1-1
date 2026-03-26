'use client'

import { useEffect, useState } from 'react'

const DURATION = 800 // ms

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), DURATION - 400)
    const hideTimer = setTimeout(() => setVisible(false), DURATION)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0e1118] transition-opacity duration-400 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* GIF — plain img tag for max iOS Safari compatibility */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/splash_opt.gif"
        alt="droneCalc"
        width={256}
        height={144}
        className="object-contain"
        style={{ width: 256, height: 'auto' }}
      />

      {/* Spinner */}
      <div className="mt-6 flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-ecalc-orange"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm font-medium text-ecalc-muted tracking-wide">droneCalc 🇺🇦</span>
      </div>
    </div>
  )
}
