import { describe, it, expect } from 'vitest'
import {
  trueAirspeed,
  equivalentAirspeed,
  thrustAltitude,
  tsfc,
  breguetRange,
  breguetEndurance,
  climbAngle,
  rateOfClimb,
  takeoffDistance,
  landingDistance,
  fuelWeight,
  wingLoading,
  clMax,
  dragCoefficient,
  liftDragRatio,
  advanceRatio,
  propellerEfficiency,
  motorTorque,
  stallSpeed,
  staticMarginPct,
  recommendedEscRating,
  cableVoltageDrop,
  systemEfficiency,
  gLoad,
  cRate,
} from '../aviation-engineering'

describe('trueAirspeed', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(trueAirspeed(0, 1.225)).toBe(0)
    expect(trueAirspeed(100, 0)).toBe(0)
  })
  it('TAS = IAS at sea level (rho = rho0)', () => {
    expect(trueAirspeed(100, 1.225, 1.225)).toBeCloseTo(100, 5)
  })
  it('TAS > IAS at altitude (lower rho)', () => {
    expect(trueAirspeed(100, 0.9, 1.225)).toBeGreaterThan(100)
  })
})

describe('equivalentAirspeed', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(equivalentAirspeed(0, 0.7)).toBe(0)
    expect(equivalentAirspeed(100, 0)).toBe(0)
  })
  it('EAS = IAS × √σ', () => {
    expect(equivalentAirspeed(100, 0.64)).toBeCloseTo(80, 4)
  })
})

describe('thrustAltitude', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(thrustAltitude(0, 1.0)).toBe(0)
  })
  it('thrust scales linearly with rho (electric, exponent=1)', () => {
    expect(thrustAltitude(100, 0.9, 1.225, 1)).toBeCloseTo(100 * (0.9 / 1.225), 4)
  })
})

describe('tsfc', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(tsfc(0, 10)).toBe(0)
    expect(tsfc(5, 0)).toBe(0)
  })
  it('fuelFlow / thrustKN', () => {
    expect(tsfc(10, 50)).toBeCloseTo(0.2, 5)
  })
})

describe('breguetRange', () => {
  it('returns 0 for invalid inputs', () => {
    expect(breguetRange(0, 0.5, 15, 1000, 700)).toBe(0)
    expect(breguetRange(200, 0, 15, 1000, 700)).toBe(0)
  })
  it('returns 0 when initial ≤ final weight', () => {
    expect(breguetRange(200, 0.5, 15, 700, 1000)).toBe(0)
  })
  it('returns positive range for valid mission', () => {
    expect(breguetRange(200, 0.5, 15, 1000, 700)).toBeGreaterThan(0)
  })
})

describe('breguetEndurance', () => {
  it('returns 0 for invalid TSFC', () => {
    expect(breguetEndurance(0, 15, 1000, 700)).toBe(0)
  })
  it('returns 0 when initial ≤ final weight', () => {
    expect(breguetEndurance(0.5, 15, 500, 1000)).toBe(0)
  })
  it('endurance × speed ≈ range for same mission', () => {
    const range = breguetRange(200, 0.5, 15, 1000, 700)
    const endurance = breguetEndurance(0.5, 15, 1000, 700)
    expect(range).toBeCloseTo(endurance * 200, 3)
  })
})

describe('climbAngle', () => {
  it('returns 0 for non-positive weight', () => {
    expect(climbAngle(100, 20, 0)).toBe(0)
  })
  it('positive thrust excess → positive climb angle', () => {
    expect(climbAngle(50, 10, 98.1)).toBeGreaterThan(0)
  })
})

describe('rateOfClimb', () => {
  it('returns 0 for non-positive speed', () => {
    expect(rateOfClimb(0, 0.1)).toBe(0)
  })
  it('roc = v × sin(γ)', () => {
    const gamma = Math.asin(0.1)
    expect(rateOfClimb(30, gamma)).toBeCloseTo(30 * Math.sin(gamma), 5)
  })
})

describe('takeoffDistance', () => {
  it('returns 0 for any non-positive input', () => {
    expect(takeoffDistance(0, 1.225, 1, 1.5, 50)).toBe(0)
  })
  it('returns positive distance for valid inputs', () => {
    expect(takeoffDistance(196.2, 1.225, 0.5, 1.5, 50)).toBeGreaterThan(0)
  })
})

describe('landingDistance', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(landingDistance(0, 1.225, 1, 1.5, 50)).toBe(0)
  })
  it('landing distance > takeoff distance (1.69 vs 1.44 factor)', () => {
    const to = takeoffDistance(196.2, 1.225, 0.5, 1.5, 50)
    const ld = landingDistance(196.2, 1.225, 0.5, 1.5, 50)
    expect(ld).toBeGreaterThan(to)
  })
})

describe('fuelWeight', () => {
  it('returns 0 for invalid inputs', () => {
    expect(fuelWeight(0, 700)).toBe(0)
    expect(fuelWeight(700, 1000)).toBe(0)
  })
  it('initial - final', () => {
    expect(fuelWeight(1000, 700)).toBeCloseTo(300, 5)
  })
})

describe('wingLoading', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(wingLoading(0, 1)).toBe(0)
    expect(wingLoading(100, 0)).toBe(0)
  })
  it('weight / area', () => {
    expect(wingLoading(200, 2)).toBeCloseTo(100, 5)
  })
})

describe('clMax', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(clMax(0, 1.225, 15, 0.5)).toBe(0)
  })
  it('2W / (ρ × v² × S)', () => {
    const expected = (2 * 50) / (1.225 * 100 * 0.5)
    expect(clMax(50, 1.225, 10, 0.5)).toBeCloseTo(expected, 4)
  })
})

describe('dragCoefficient', () => {
  it('cd0 + k × cl²', () => {
    expect(dragCoefficient(0.02, 0.05, 1.0)).toBeCloseTo(0.07, 5)
  })
})

describe('liftDragRatio', () => {
  it('returns 0 for non-positive cd', () => {
    expect(liftDragRatio(1.2, 0)).toBe(0)
  })
  it('cl / cd', () => {
    expect(liftDragRatio(1.2, 0.06)).toBeCloseTo(20, 4)
  })
})

describe('advanceRatio', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(advanceRatio(0, 8000, 0.3)).toBe(0)
    expect(advanceRatio(10, 0, 0.3)).toBe(0)
  })
  it('J = v / (n × d)', () => {
    const n = 8000 / 60
    expect(advanceRatio(10, 8000, 0.3)).toBeCloseTo(10 / (n * 0.3), 4)
  })
})

describe('propellerEfficiency', () => {
  it('peaks near J = 0.6', () => {
    const atPeak = propellerEfficiency(0.6)
    const away = propellerEfficiency(1.5)
    expect(atPeak).toBeGreaterThan(away)
  })
})

describe('motorTorque', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(motorTorque(0, 8000)).toBe(0)
    expect(motorTorque(300, 0)).toBe(0)
  })
  it('P / ω', () => {
    const omega = (2 * Math.PI * 8000) / 60
    expect(motorTorque(300, 8000)).toBeCloseTo(300 / omega, 4)
  })
})

describe('stallSpeed', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = stallSpeed({ weightKg: 0, wingAreaM2: 0.5, clMax: 1.2 })
    expect(result.stallSpeedMs).toBe(0)
  })
  it('level flight load factor = 1', () => {
    const result = stallSpeed({ weightKg: 2, wingAreaM2: 0.5, clMax: 1.2 })
    expect(result.loadFactorG).toBeCloseTo(1, 5)
  })
  it('banked stall speed > level stall speed', () => {
    const level = stallSpeed({ weightKg: 2, wingAreaM2: 0.5, clMax: 1.2 })
    const banked = stallSpeed({ weightKg: 2, wingAreaM2: 0.5, clMax: 1.2, bankAngleDeg: 60 })
    expect(banked.stallBankedMs).toBeGreaterThan(level.stallSpeedMs)
  })
})

describe('staticMarginPct', () => {
  it('returns 0 for non-positive MAC', () => {
    expect(staticMarginPct(0.3, 0.1, 0)).toBe(0)
  })
  it('positive SM when AC is ahead of CG', () => {
    // macLePos=0.5, MAC=0.4 → AC=0.5+0.1=0.6; CG=0.3 → SM=(0.6-0.3)/0.4=75%
    expect(staticMarginPct(0.3, 0.5, 0.4)).toBeCloseTo(75, 3)
  })
})

describe('recommendedEscRating', () => {
  it('returns 0 for non-positive motor current', () => {
    expect(recommendedEscRating(0)).toBe(0)
  })
  it('motorMaxA × 1.4 (default safety factor)', () => {
    expect(recommendedEscRating(30)).toBeCloseTo(42, 5)
  })
})

describe('cableVoltageDrop', () => {
  it('returns 0 for non-positive current', () => {
    expect(cableVoltageDrop({ awg: '20', currentA: 0, cableLengthM: 0.5 })).toBe(0)
  })
  it('AWG 20, 10 A, 0.5 m: V = (12.77e-3 × 10 × 1.0)', () => {
    expect(cableVoltageDrop({ awg: '20', currentA: 10, cableLengthM: 0.5 })).toBeCloseTo(12.77e-3 * 10 * 1.0, 4)
  })
  it('falls back to AWG20 resistance for unknown gauge', () => {
    const known = cableVoltageDrop({ awg: '20', currentA: 10, cableLengthM: 0.5 })
    const unknown = cableVoltageDrop({ awg: '99', currentA: 10, cableLengthM: 0.5 })
    expect(known).toBeCloseTo(unknown, 5)
  })
})

describe('systemEfficiency', () => {
  it('returns 0 for non-positive electrical power', () => {
    expect(systemEfficiency(10, 5, 0, 12)).toBe(0)
  })
  it('η = (F × v) / (I × V)', () => {
    const expected = (10 * 5) / (10 * 14.8)
    expect(systemEfficiency(10, 5, 10, 14.8)).toBeCloseTo(expected, 5)
  })
})

describe('gLoad', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(gLoad(0, 1, 9.81)).toBe(0)
    expect(gLoad(50, 0, 9.81)).toBe(0)
  })
  it('F / (m × g)', () => {
    expect(gLoad(98.1, 5, 9.81)).toBeCloseTo(2, 5)
  })
})

describe('cRate', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(cRate(0, 5)).toBe(0)
    expect(cRate(20, 0)).toBe(0)
  })
  it('I / C', () => {
    expect(cRate(20, 5)).toBeCloseTo(4, 5)
  })
})
