'use client'

import React, { useEffect, useRef, useState } from 'react'

const PREFIX = 'dronecalc:'

// Stored envelope — wraps state with a schema version number.
// When version doesn't match, stored data is discarded and defaultValue is used.
// This eliminates the need to rotate key suffixes (e.g. 'key2', 'key3') when
// the shape of a stored object changes — just increment version instead.
type Envelope<T> = { _v: number; _ts: number; data: T }

type PersistedStateOptions = {
  debounceMs?: number
  syncStrategy?: 'storage' | 'broadcast' | 'both'
}

type ParsedEnvelope<T> = {
  data: T
  ts: number
}

function parseStored<T>(
  raw: string | null,
  version: number,
): ParsedEnvelope<T> | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown

    if (parsed !== null && typeof parsed === 'object' && '_v' in parsed) {
      const envelope = parsed as Partial<Envelope<T>>
      if (envelope._v !== version || typeof envelope.data === 'undefined') return null
      const ts = typeof envelope._ts === 'number' && Number.isFinite(envelope._ts)
        ? envelope._ts
        : 0
      return { data: envelope.data, ts }
    }

    // Backward compatibility for old storage format without envelope metadata.
    return { data: parsed as T, ts: 0 }
  } catch {
    return null
  }
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  version = 1,
  options: PersistedStateOptions = {},
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = PREFIX + key
  const debounceMs = options.debounceMs ?? 250
  const syncStrategy = options.syncStrategy ?? 'both'
  const tsRef = useRef(0)
  const skipNextWriteRef = useRef(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue

    const parsed = parseStored<T>(localStorage.getItem(storageKey), version)
    if (!parsed) return defaultValue
    tsRef.current = parsed.ts
    return parsed.data
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const existing = parseStored<T>(localStorage.getItem(storageKey), version)
        if (existing && existing.ts > tsRef.current) {
          // Another writer has a newer state; adopt it and skip stale write.
          tsRef.current = existing.ts
          skipNextWriteRef.current = true
          setState(existing.data)
          return
        }

        const envelope: Envelope<T> = {
          _v: version,
          _ts: Date.now(),
          data: state,
        }
        localStorage.setItem(storageKey, JSON.stringify(envelope))
        tsRef.current = envelope._ts

        if (channelRef.current) {
          channelRef.current.postMessage(envelope)
        }
      } catch {
        /* storage full or unavailable */
      }
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [debounceMs, state, storageKey, version])

  useEffect(() => {
    if (typeof window === 'undefined') return

    function applyExternal(raw: string | null) {
    try {
        const parsed = parseStored<T>(raw, version)
        if (!parsed) return
        if (parsed.ts <= tsRef.current) return

        tsRef.current = parsed.ts
        skipNextWriteRef.current = true
        setState(parsed.data)
      } catch {
        /* ignore malformed external payload */
    }
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== storageKey) return
      applyExternal(event.newValue)
    }

    window.addEventListener('storage', onStorage)

    if ((syncStrategy === 'broadcast' || syncStrategy === 'both') && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`persist:${storageKey}`)
      channelRef.current = channel
      channel.onmessage = (event: MessageEvent<Envelope<T>>) => {
        if (!event?.data) return
        applyExternal(JSON.stringify(event.data))
      }
    }

    return () => {
      window.removeEventListener('storage', onStorage)
      if (channelRef.current) {
        channelRef.current.close()
        channelRef.current = null
      }
    }
  }, [storageKey, syncStrategy, version])

  return [state, setState]
}
