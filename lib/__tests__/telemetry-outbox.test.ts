import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import {
  createTelemetryIdempotencyKey,
  enqueueTelemetryOutbox,
  flushTelemetryOutbox,
  type TelemetryPayload,
} from '@/lib/telemetry-outbox'

type MemoryStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

function createLocalStorageMock(): MemoryStorage {
  const store = new Map<string, string>()

  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }
}

function samplePayload(idempotencyKey: string): TelemetryPayload {
  return {
    idempotencyKey,
    droneType: 'multirotor',
    flightTimeActual: '10',
    flightTimeCalc: '11',
    wind: '4',
    tempC: '12',
    altM: '200',
    notes: 'outbox-test',
  }
}

describe('telemetry outbox idempotency', () => {
  let storage: MemoryStorage
  let now = 1_000
  let dateNowSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    storage = createLocalStorageMock()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    dateNowSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  test('does not enqueue duplicate idempotency keys', async () => {
    const key = createTelemetryIdempotencyKey()

    enqueueTelemetryOutbox(samplePayload(key))
    enqueueTelemetryOutbox(samplePayload(key))

    let callCount = 0
    const send = vi.fn(async () => {
      callCount += 1
      return 200
    })

    const result = await flushTelemetryOutbox(send, 10)

    expect(callCount).toBe(1)
    expect(result.sent).toBe(1)
    expect(result.remaining).toBe(0)
  })

  test('preserves idempotency key across retry attempts', async () => {
    const key = 'retry-key-001'
    enqueueTelemetryOutbox(samplePayload(key))

    const seenKeys: string[] = []
    const send = vi
      .fn<(payload: TelemetryPayload) => Promise<number>>()
      .mockImplementationOnce(async (payload) => {
        seenKeys.push(payload.idempotencyKey)
        return 500
      })
      .mockImplementationOnce(async (payload) => {
        seenKeys.push(payload.idempotencyKey)
        return 200
      })

    const first = await flushTelemetryOutbox(send, 1)
    expect(first.retried).toBe(1)
    expect(first.remaining).toBe(1)

    now += 121_000

    const second = await flushTelemetryOutbox(send, 1)
    expect(second.sent).toBe(1)
    expect(second.remaining).toBe(0)

    expect(seenKeys).toEqual([key, key])
  })
})
