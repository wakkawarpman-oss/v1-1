import { describe, it, expect } from 'vitest'
import {
  solderingHeatInput,
  requiredPower,
  heaterResistance,
  heaterResistanceFromCurrent,
  pidCoefficients,
  tipModelParams,
  reflowProfile,
  apertureSize,
  apertureAreaRatio,
  solderPasteVolume,
  pwmFrequencyFromPeriod,
  pwmPeriodFromFrequency,
} from '../soldering-tools'

describe('solderingHeatInput', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(solderingHeatInput(0, 10, 5, 100)).toBe(0)
    expect(solderingHeatInput(24, 0, 5, 100)).toBe(0)
    expect(solderingHeatInput(24, 10, 0, 100)).toBe(0)
    expect(solderingHeatInput(24, 10, 5, 0)).toBe(0)
  })

  it('returns positive for valid inputs', () => {
    expect(solderingHeatInput(24, 5, 3, 600)).toBeGreaterThan(0)
  })
})

describe('requiredPower', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(requiredPower(0, 200, 10)).toBe(0)
    expect(requiredPower(0.1, 200, 0)).toBe(0)
  })

  it('scales with temperature delta', () => {
    const p1 = requiredPower(0.01, 100, 5)
    const p2 = requiredPower(0.01, 200, 5)
    expect(p2).toBeCloseTo(p1 * 2, 4)
  })
})

describe('heaterResistance', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(heaterResistance(0, 60)).toBe(0)
    expect(heaterResistance(24, 0)).toBe(0)
  })

  it('R = V² / P', () => {
    expect(heaterResistance(24, 60)).toBeCloseTo(24 * 24 / 60, 4)
  })
})

describe('heaterResistanceFromCurrent', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(heaterResistanceFromCurrent(0, 2)).toBe(0)
    expect(heaterResistanceFromCurrent(24, 0)).toBe(0)
  })

  it('R = V / I', () => {
    expect(heaterResistanceFromCurrent(24, 2)).toBeCloseTo(12, 4)
  })
})

describe('pidCoefficients', () => {
  it('returns zeros for non-positive ku or tu', () => {
    const result = pidCoefficients(0, 1)
    expect(result.Kp).toBe(0)
    expect(result.Ki).toBe(0)
    expect(result.Kd).toBe(0)
  })

  it('Kp = 0.6 × Ku', () => {
    const result = pidCoefficients(2, 0.5)
    expect(result.Kp).toBeCloseTo(0.6 * 2, 6)
  })

  it('Ki = 1.2 × Ku / Tu', () => {
    const result = pidCoefficients(2, 0.5)
    expect(result.Ki).toBeCloseTo((1.2 * 2) / 0.5, 6)
  })

  it('Kd = 0.075 × Ku × Tu', () => {
    const result = pidCoefficients(2, 0.5)
    expect(result.Kd).toBeCloseTo(0.075 * 2 * 0.5, 6)
  })
})

describe('tipModelParams', () => {
  it('TS100_BC2 has gain 1.0', () => {
    const params = tipModelParams('TS100_BC2')
    expect(params.gain).toBe(1.0)
  })

  it('C210 is in JBC C210 family', () => {
    expect(tipModelParams('C210').family).toBe('JBC C210')
  })
})

describe('reflowProfile', () => {
  it('SAC305 peak is 245°C', () => {
    expect(reflowProfile('SAC305').peak).toBe(245)
  })

  it('SnPb63 peak is lower than SAC305', () => {
    expect(reflowProfile('SnPb63').peak).toBeLessThan(reflowProfile('SAC305').peak)
  })
})

describe('apertureSize', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = apertureSize(0, 1, 1)
    expect(result.width).toBe(0)
  })

  it('tighter pitch → smaller reduction factor', () => {
    const finePitch = apertureSize(1, 1, 0.4)
    const coarsePitch = apertureSize(1, 1, 1.0)
    expect(finePitch.reduction).toBeLessThan(coarsePitch.reduction)
  })
})

describe('apertureAreaRatio', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(apertureAreaRatio(0, 1, 0.15)).toBe(0)
  })

  it('returns positive ratio', () => {
    expect(apertureAreaRatio(0.5, 0.5, 0.15)).toBeGreaterThan(0)
  })
})

describe('solderPasteVolume', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(solderPasteVolume(0, 0.15)).toBe(0)
    expect(solderPasteVolume(1, 0)).toBe(0)
  })

  it('volume = area × thickness', () => {
    expect(solderPasteVolume(2, 0.15)).toBeCloseTo(0.3, 6)
  })
})

describe('pwmFrequencyFromPeriod / pwmPeriodFromFrequency', () => {
  it('20 µs period → 50 kHz', () => {
    expect(pwmFrequencyFromPeriod(20)).toBeCloseTo(50_000, 0)
  })

  it('round-trip: period → freq → period', () => {
    const period = 50
    expect(pwmPeriodFromFrequency(pwmFrequencyFromPeriod(period))).toBeCloseTo(period, 6)
  })

  it('returns 0 for non-positive inputs', () => {
    expect(pwmFrequencyFromPeriod(0)).toBe(0)
    expect(pwmPeriodFromFrequency(0)).toBe(0)
  })
})
