import { describe, expect, it } from 'vitest'
import {
  mapMotorDraftToInput,
  mapPropDraftToInput,
  mergeDraftNumber,
  type MotorDraft,
  type PropDraft,
} from '../propulsion-contracts'

const motorDefaults: MotorDraft = {
  kv: 920,
  riOhms: 0.05,
  i0A: 0.8,
  escMaxAmps: 60,
  statorDiameterMm: 28,
}

const propDefaults: PropDraft = {
  diameterIn: 12,
  pitchIn: 6,
  bladeCount: 2,
}

describe('propulsion contracts', () => {
  it('maps invalid motor numbers to finite clamped values', () => {
    const mapped = mapMotorDraftToInput(
      {
        kv: Number.NaN,
        riOhms: Number.POSITIVE_INFINITY,
        i0A: -10,
        escMaxAmps: -1,
        statorDiameterMm: 999,
      },
      motorDefaults,
    )

    expect(mapped.kv).toBe(920)
    expect(mapped.riOhms).toBe(0.05)
    expect(mapped.i0A).toBe(0)
    expect(mapped.escMaxAmps).toBe(1)
    expect(mapped.statorDiameterMm).toBe(120)
  })

  it('enforces prop dimensions and blade limits', () => {
    const mapped = mapPropDraftToInput(
      {
        diameterIn: 100,
        pitchIn: 0,
        bladeCount: 9,
      },
      propDefaults,
    )

    expect(mapped.diameterIn).toBe(50)
    expect(mapped.pitchIn).toBe(1)
    expect(mapped.bladeCount).toBe(6)
  })

  it('mergeDraftNumber ignores NaN and accepts finite updates', () => {
    const unchanged = mergeDraftNumber(propDefaults, 'diameterIn', Number.NaN)
    expect(unchanged).toEqual(propDefaults)

    const changed = mergeDraftNumber(propDefaults, 'diameterIn', 13)
    expect(changed.diameterIn).toBe(13)
  })
})
