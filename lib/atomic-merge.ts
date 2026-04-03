export type TimestampedState = {
  _ts?: number
}

type FieldOwners<T extends Record<string, unknown>> = Record<Extract<keyof T, string>, string>

function finiteTs(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function atomicMerge<T extends Record<string, unknown>>(
  oldState: T & TimestampedState,
  newState: Partial<T> & TimestampedState,
  options?: {
    callerId?: string
    fieldOwners?: FieldOwners<T>
  },
): T & { _ts: number } {
  const oldTs = finiteTs(oldState._ts)
  const incomingTs = finiteTs(newState._ts)

  if (incomingTs < oldTs) {
    return { ...oldState, _ts: oldTs }
  }

  let filteredPatch: Partial<T> & TimestampedState = newState
  if (options?.callerId && options.fieldOwners) {
    const next: Partial<T> & TimestampedState = {}

    for (const [key, value] of Object.entries(newState)) {
      if (key === '_ts') {
        next._ts = value as number
        continue
      }

      const fieldOwner = options.fieldOwners[key as Extract<keyof T, string>]
      if (!fieldOwner || fieldOwner === options.callerId) {
        ;(next as Record<string, unknown>)[key] = value
      }
    }

    filteredPatch = next
  }

  const nextTs = Math.max(oldTs, incomingTs, Date.now())
  return {
    ...oldState,
    ...filteredPatch,
    _ts: nextTs,
  }
}