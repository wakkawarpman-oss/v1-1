'use client'

import { useCallback, useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { atomicMerge } from '@/lib/atomic-merge'
import {
  FIELD_OWNERS,
  INTEGRATION_DEFAULTS,
  filterPatchByOwner,
  type IntegrationOwnerId,
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

  const patch = useCallback((next: Partial<IntegrationState>, ownerId: IntegrationOwnerId) => {
    const ownedPatch = filterPatchByOwner(next, ownerId)
    setRawState((prev) => atomicMerge(
      prev,
      { ...ownedPatch, _ts: Date.now() },
      {
        callerId: ownerId,
        fieldOwners: FIELD_OWNERS,
      },
    ))
  }, [setRawState])

  return {
    state,
    summary,
    patch,
  }
}
