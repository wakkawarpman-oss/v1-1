export type TimestampedState = {
  _ts?: number
}

function finiteTs(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function atomicMerge<T extends Record<string, unknown>>(
  oldState: T & TimestampedState,
  newState: Partial<T> & TimestampedState,
): T & { _ts: number } {
  const oldTs = finiteTs(oldState._ts)
  const incomingTs = finiteTs(newState._ts)

  if (incomingTs < oldTs) {
    return { ...oldState, _ts: oldTs }
  }

  const nextTs = Math.max(oldTs, incomingTs, Date.now())
  return {
    ...oldState,
    ...newState,
    _ts: nextTs,
  }
}