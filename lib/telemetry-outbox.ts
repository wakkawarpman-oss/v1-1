export type TelemetryPayload = {
  idempotencyKey: string
  droneType: string
  flightTimeActual: string
  flightTimeCalc: string
  wind: string
  tempC: string
  altM: string
  notes: string
}

type QueueItem = {
  id: string
  payload: TelemetryPayload
  createdAt: number
  attempts: number
  nextRetryAt: number
}

type FlushResult = {
  sent: number
  retried: number
  dropped: number
  remaining: number
}

const OUTBOX_KEY = 'dronecalc:telemetry:outbox:v1'
const MAX_ITEMS = 50
const MAX_ATTEMPTS = 8

export function createTelemetryIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${nowMs()}-${Math.random().toString(36).slice(2, 12)}`
}

function nowMs() {
  return Date.now()
}

function backoffMs(attempt: number): number {
  const base = 60_000
  const cappedAttempt = Math.min(attempt, 6)
  return base * Math.pow(2, cappedAttempt)
}

function readQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is QueueItem => {
      if (!item || typeof item !== 'object') return false
      const candidate = item as Partial<QueueItem>
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.payload === 'object' &&
        typeof candidate.createdAt === 'number' &&
        typeof candidate.attempts === 'number' &&
        typeof candidate.nextRetryAt === 'number'
      )
    })
  } catch {
    return []
  }
}

function writeQueue(items: QueueItem[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
  } catch {
    // Best effort only. If storage is full, drop silently for non-critical path.
  }
}

export function enqueueTelemetryOutbox(payload: TelemetryPayload): void {
  const queue = readQueue()
  if (queue.some((item) => item.payload.idempotencyKey === payload.idempotencyKey)) {
    return
  }

  const entry: QueueItem = {
    id: `${nowMs()}-${Math.random().toString(36).slice(2, 9)}`,
    payload,
    createdAt: nowMs(),
    attempts: 0,
    nextRetryAt: nowMs(),
  }

  const next = [entry, ...queue].slice(0, MAX_ITEMS)
  writeQueue(next)
}

export async function flushTelemetryOutbox(
  send: (payload: TelemetryPayload) => Promise<number>,
  maxBatch = 5,
): Promise<FlushResult> {
  const queue = readQueue()
  if (!queue.length) {
    return { sent: 0, retried: 0, dropped: 0, remaining: 0 }
  }

  const now = nowMs()
  let processed = 0
  let sent = 0
  let retried = 0
  let dropped = 0

  const updated: QueueItem[] = []

  for (const item of queue) {
    const due = item.nextRetryAt <= now
    const canProcess = due && processed < maxBatch

    if (!canProcess) {
      updated.push(item)
      continue
    }

    processed++

    try {
      const status = await send(item.payload)

      if (status >= 200 && status < 300 && status !== 202) {
        sent++
        continue
      }

      if (status === 400 || status === 403) {
        dropped++
        continue
      }

      const attempts = item.attempts + 1
      if (attempts >= MAX_ATTEMPTS) {
        dropped++
        continue
      }

      retried++
      updated.push({
        ...item,
        attempts,
        nextRetryAt: now + backoffMs(attempts),
      })
    } catch {
      const attempts = item.attempts + 1
      if (attempts >= MAX_ATTEMPTS) {
        dropped++
        continue
      }

      retried++
      updated.push({
        ...item,
        attempts,
        nextRetryAt: now + backoffMs(attempts),
      })
    }
  }

  writeQueue(updated)
  return {
    sent,
    retried,
    dropped,
    remaining: updated.length,
  }
}
