'use client'

import React, { useState, useEffect } from 'react'

const PREFIX = 'dronecalc:'

// Stored envelope — wraps state with a schema version number.
// When version doesn't match, stored data is discarded and defaultValue is used.
// This eliminates the need to rotate key suffixes (e.g. 'key2', 'key3') when
// the shape of a stored object changes — just increment version instead.
type Envelope<T> = { _v: number; data: T }

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  version = 1,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const storageKey = PREFIX + key

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return defaultValue
      const parsed = JSON.parse(raw) as unknown
      // Versioned envelope format
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        '_v' in parsed &&
        (parsed as Envelope<T>)._v === version
      ) {
        return (parsed as Envelope<T>).data
      }
      // Old format (no _v) or wrong version → reset to default
      return defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      const envelope: Envelope<T> = { _v: version, data: state }
      localStorage.setItem(storageKey, JSON.stringify(envelope))
    } catch {
      /* storage full or unavailable */
    }
  }, [storageKey, version, state])

  return [state, setState]
}
