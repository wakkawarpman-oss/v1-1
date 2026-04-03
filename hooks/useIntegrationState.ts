'use client'

import { useCallback, useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { atomicMerge } from '@/lib/atomic-merge'
import {
  INTEGRATION_DEFAULTS,
  sanitizeIntegrationState,
  summarizeIntegration,
  type IntegrationState,
} from '@/lib/integration-contracts'

type IntegrationStateInternal = IntegrationState & { _ts?: number }

const INTEGRATION_INTERNAL_DEFAULTS: IntegrationStateInternal = {
  ...INTEGRATION_DEFAULTS,
  _ts: 0,
}

export function useIntegrationState() {
  const [rawState, setRawState] = usePersistedState<IntegrationStateInternal>(
    'system.integration.v1',
    INTEGRATION_INTERNAL_DEFAULTS,
    1,
  )

  const state = useMemo(() => sanitizeIntegrationState(rawState), [rawState])
  const summary = useMemo(() => summarizeIntegration(state), [state])

  const patch = useCallback((next: Partial<IntegrationState>) => {
    setRawState((prev) => atomicMerge(prev, { ...next, updatedAt: Date.now(), _ts: Date.now() }))
  }, [setRawState])

  return {
    state,
    summary,
    patch,
  }
}
