import { describe, it, expect } from 'vitest'
import {
  dynamicPressurePa,
  reynoldsNumber,
  windCorrection,
  greatCircle,
  rhumbLine,
  pointOfNoReturn,
  e6bWindTriangle,
} from '../aero-navigation'

describe('dynamicPressurePa', () => {
  it('returns 0 for negative speed', () => {
    expect(dynamicPressurePa(-5)).toBe(0)
  })

  it('returns 0 for zero density', () => {
    expect(dynamicPressurePa(10, 0)).toBe(0)
  })

  it('returns 612.5 Pa at 10 m/s ISA sea level', () => {
    // q = 0.5 × 1.225 × 10² = 61.25
    expect(dynamicPressurePa(10)).toBeCloseTo(61.25, 2)
  })

  it('increases with the square of speed', () => {
    const q20 = dynamicPressurePa(20)
    const q10 = dynamicPressurePa(10)
    expect(q20).toBeCloseTo(q10 * 4, 4)
  })
})

describe('reynoldsNumber', () => {
  it('returns 0 for non-positive speed or chord', () => {
    expect(reynoldsNumber({ speedMs: 0, characteristicLengthM: 0.2 })).toBe(0)
    expect(reynoldsNumber({ speedMs: 10, characteristicLengthM: 0 })).toBe(0)
  })

  it('returns expected Re for typical drone wing', () => {
    // Re = (1.225 × 15 × 0.15) / 1.81e-5 ≈ 152,071
    const re = reynoldsNumber({ speedMs: 15, characteristicLengthM: 0.15 })
    expect(re).toBeCloseTo((1.225 * 15 * 0.15) / 1.81e-5, 0)
  })
})

describe('windCorrection', () => {
  it('returns zero drift with no wind', () => {
    const result = windCorrection({
      trueAirspeedKmh: 100,
      desiredTrackDeg: 90,
      windFromDeg: 0,
      windSpeedKmh: 0,
    })
    expect(result.driftDeg).toBeCloseTo(0, 4)
  })

  it('direct headwind reduces ground speed', () => {
    const result = windCorrection({
      trueAirspeedKmh: 100,
      desiredTrackDeg: 0,
      windFromDeg: 0,   // wind from north, aircraft flying north
      windSpeedKmh: 20,
    })
    expect(result.groundSpeedKmh).toBeLessThan(100)
  })

  it('direct tailwind increases ground speed', () => {
    const result = windCorrection({
      trueAirspeedKmh: 100,
      desiredTrackDeg: 0,
      windFromDeg: 180, // wind from south = tailwind for northbound flight
      windSpeedKmh: 20,
    })
    expect(result.groundSpeedKmh).toBeGreaterThan(100)
  })

  it('heading stays in [0, 360) range', () => {
    const result = windCorrection({
      trueAirspeedKmh: 80,
      desiredTrackDeg: 350,
      windFromDeg: 90,
      windSpeedKmh: 10,
    })
    expect(result.headingDeg).toBeGreaterThanOrEqual(0)
    expect(result.headingDeg).toBeLessThan(360)
  })
})

describe('greatCircle', () => {
  it('returns ~0 km for identical points', () => {
    const result = greatCircle({ fromLatDeg: 50, fromLonDeg: 30, toLatDeg: 50, toLonDeg: 30 })
    expect(result.distanceKm).toBeCloseTo(0, 3)
  })

  it('returns ~111 km per degree latitude (along meridian)', () => {
    const result = greatCircle({ fromLatDeg: 0, fromLonDeg: 0, toLatDeg: 1, toLonDeg: 0 })
    expect(result.distanceKm).toBeCloseTo(111.195, 0)
  })

  it('initial bearing is in [0, 360)', () => {
    const result = greatCircle({ fromLatDeg: 48, fromLonDeg: 16, toLatDeg: 51, toLonDeg: 0 })
    expect(result.initialBearingDeg).toBeGreaterThanOrEqual(0)
    expect(result.initialBearingDeg).toBeLessThan(360)
  })
})

describe('rhumbLine', () => {
  it('returns ~0 km for identical points', () => {
    const result = rhumbLine({ fromLatDeg: 50, fromLonDeg: 30, toLatDeg: 50, toLonDeg: 30 })
    expect(result.distanceKm).toBeCloseTo(0, 2)
  })

  it('gives approximately same distance as great circle for short segments', () => {
    const gc = greatCircle({ fromLatDeg: 48, fromLonDeg: 16, toLatDeg: 49, toLonDeg: 17 })
    const rh = rhumbLine({ fromLatDeg: 48, fromLonDeg: 16, toLatDeg: 49, toLonDeg: 17 })
    // Should be within 1% for 100+ km segment
    expect(Math.abs(gc.distanceKm - rh.distanceKm) / gc.distanceKm).toBeLessThan(0.01)
  })
})

describe('pointOfNoReturn', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = pointOfNoReturn({ safeEnduranceH: 0, gsOutKmh: 100, gsHomeKmh: 80 })
    expect(result.distanceKm).toBe(0)
  })

  it('higher outbound speed extends PNR distance', () => {
    // Same homebound speed; faster outbound → farther PNR
    // slowOut: (60×80)/(60+80) ≈ 34.3 km  fastOut: (120×80)/(120+80) = 48 km
    const slowOut = pointOfNoReturn({ safeEnduranceH: 1, gsOutKmh: 60, gsHomeKmh: 80 })
    const fastOut = pointOfNoReturn({ safeEnduranceH: 1, gsOutKmh: 120, gsHomeKmh: 80 })
    expect(slowOut.distanceKm).toBeLessThan(fastOut.distanceKm)
  })

  it('timeToTurn ≈ distance / gsOut', () => {
    const result = pointOfNoReturn({ safeEnduranceH: 2, gsOutKmh: 100, gsHomeKmh: 80 })
    expect(result.timeToTurnMin).toBeCloseTo((result.distanceKm / 100) * 60, 3)
  })
})

describe('e6bWindTriangle', () => {
  it('is an alias of windCorrection and works correctly', () => {
    const direct = windCorrection({
      trueAirspeedKmh: 100,
      desiredTrackDeg: 90,
      windFromDeg: 0,
      windSpeedKmh: 10,
    })
    const alias = e6bWindTriangle({
      trueAirspeedKmh: 100,
      desiredTrackDeg: 90,
      windFromDeg: 0,
      windSpeedKmh: 10,
    })
    expect(alias.headingDeg).toBeCloseTo(direct.headingDeg, 6)
    expect(alias.groundSpeedKmh).toBeCloseTo(direct.groundSpeedKmh, 6)
  })
})
