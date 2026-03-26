'use client'

import { useEffect, useState } from 'react'

type TabDef = { value: string }

export function useDashboardNav(tabs: TabDef[], requestedTab: string) {
  function isDashboardTab(value: string | null): value is string {
    return tabs.some((tab) => tab.value === value)
  }

  const validatedTab = isDashboardTab(requestedTab) ? requestedTab : 'dashboard'
  const [activeTab, setActiveTab] = useState<string>(validatedTab)
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    setActiveTab(validatedTab)
  }, [validatedTab])

  function handleTabChange(nextTab: string) {
    if (!isDashboardTab(nextTab) || nextTab === activeTab) return
    setActiveTab(nextTab)
    // history.replaceState updates URL without any Next.js navigation —
    // no scroll reset, no re-render, no hydration side-effects
    window.history.replaceState(null, '', `/dashboard?tab=${nextTab}`)
  }

  function handleShare() {
    navigator.clipboard.writeText(location.href).then(() => {
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    }).catch(() => {
      // Clipboard API unavailable (non-HTTPS or permissions denied) — no-op
    })
  }

  return { activeTab, toastVisible, handleTabChange, handleShare }
}
