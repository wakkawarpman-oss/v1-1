import { describe, it, expect } from 'vitest'
import {
  mapInterceptDraftToInput,
  mapGlideDraftToInput,
  mergeDraftNumber,
  type InterceptDraft,
  type GlideDraft,
} from '../autopilot-contracts'

describe('autopilot contracts mappers', () => {
  const interceptDefaults: InterceptDraft = {
    targetDistanceM: 2000,
    targetSpeedMs: 20,
    targetHeadingDeg: 90,
    interceptorSpeedMs: 50,
    maxFlightTimeS: 300,
  }

  const glideDefaults: GlideDraft = {
    altitudeAglM: 150,
    bestGlideSpeedMs: 18,
    maxLdRatio: 12,
    windSpeedMs: 5,
  }

  it('maps invalid interception values to safe finite defaults', () => {
    const mapped = mapInterceptDraftToInput(
      {
        targetDistanceM: Number.NaN,
        targetSpeedMs: Number.POSITIVE_INFINITY,
        targetHeadingDeg: -30,
        interceptorSpeedMs: 0,
        maxFlightTimeS: Number.NaN,
      },
      interceptDefaults,
    )

    expect(mapped.targetDistanceM).toBe(2000)
    expect(mapped.targetSpeedMs).toBe(20)
    expect(mapped.targetHeadingDeg).toBe(0)
    expect(mapped.interceptorSpeedMs).toBe(1)
    expect(mapped.maxFlightTimeS).toBe(300)
  })

  it('clamps glide values to valid ranges', () => {
    const mapped = mapGlideDraftToInput(
      {
        altitudeAglM: 0,
        bestGlideSpeedMs: -1,
        maxLdRatio: Number.NaN,
        windSpeedMs: -5,
      },
      glideDefaults,
    )

    expect(mapped.altitudeAglM).toBe(1)
    expect(mapped.bestGlideSpeedMs).toBe(1)
    expect(mapped.maxLdRatio).toBe(12)
    expect(mapped.windSpeedMs).toBe(0)
  })

  it('mergeDraftNumber keeps previous state on NaN', () => {
    const prev: InterceptDraft = { ...interceptDefaults }
    const unchanged = mergeDraftNumber(prev, 'targetSpeedMs', Number.NaN)
    expect(unchanged).toEqual(prev)

    const changed = mergeDraftNumber(prev, 'targetSpeedMs', 27)
    expect(changed.targetSpeedMs).toBe(27)
  })
})
