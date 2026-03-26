import { describe, it, expect } from 'vitest'
import {
  opticalHorizon,
  radioHorizonFull,
  radioHorizonSimple,
  radioHorizonFeet,
  linkRangeFull,
  linkRangeSimple,
  effectiveEarthRadius,
  nUnits,
  refractiveIndex,
  radioHorizonWithSurface,
  horizonElevationAngle,
  freeSpaceLoss,
  airGroundRange,
  airToAirRange,
  minAltitudeForRange,
  radarMaxRange,
  fresnelZoneRadius,
} from '../radio-horizon'

describe('opticalHorizon', () => {
  it('returns 0 for non-positive height', () => {
    expect(opticalHorizon(0)).toBe(0)
    expect(opticalHorizon(-1)).toBe(0)
  })

  it('returns positive distance for h > 0', () => {
    expect(opticalHorizon(100)).toBeGreaterThan(0)
  })

  it('increases with height', () => {
    expect(opticalHorizon(200)).toBeGreaterThan(opticalHorizon(100))
  })
})

describe('radioHorizonFull', () => {
  it('returns 0 for non-positive height or radius', () => {
    expect(radioHorizonFull(0)).toBe(0)
    expect(radioHorizonFull(100, 0)).toBe(0)
  })

  it('greater than optical horizon (4/3 earth model)', () => {
    expect(radioHorizonFull(100)).toBeGreaterThan(opticalHorizon(100))
  })
})

describe('radioHorizonSimple', () => {
  it('returns 0 for non-positive height', () => {
    expect(radioHorizonSimple(0)).toBe(0)
  })

  it('4.1 × √100 = 41 km', () => {
    expect(radioHorizonSimple(100)).toBeCloseTo(41, 4)
  })
})

describe('radioHorizonFeet', () => {
  it('returns 0 for non-positive height', () => {
    expect(radioHorizonFeet(0)).toBe(0)
  })

  it('1.23 × √400 = 24.6 nm', () => {
    expect(radioHorizonFeet(400)).toBeCloseTo(1.23 * 20, 4)
  })
})

describe('linkRangeFull', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(linkRangeFull(0, 100)).toBe(0)
    expect(linkRangeFull(100, 0)).toBe(0)
  })

  it('greater than single-station horizon', () => {
    const single = radioHorizonFull(100)
    const link = linkRangeFull(100, 100)
    expect(link).toBeGreaterThan(single)
  })
})

describe('linkRangeSimple', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(linkRangeSimple(0, 100)).toBe(0)
  })

  it('symmetric', () => {
    expect(linkRangeSimple(100, 200)).toBeCloseTo(linkRangeSimple(200, 100), 6)
  })
})

describe('effectiveEarthRadius', () => {
  it('returns 0 for non-positive k', () => {
    expect(effectiveEarthRadius(0)).toBe(0)
  })

  it('standard k=4/3 → 4/3 × 6371000 m', () => {
    expect(effectiveEarthRadius(4 / 3)).toBeCloseTo((4 / 3) * 6_371_000, 0)
  })
})

describe('nUnits / refractiveIndex', () => {
  it('nUnits round-trip: n → N → n', () => {
    const n = 1.000300
    const N = nUnits(n)
    const back = refractiveIndex(N)
    expect(back).toBeCloseTo(n, 6)
  })

  it('N = (n - 1) × 1e6', () => {
    expect(nUnits(1.0003)).toBeCloseTo(300, 4)
  })
})

describe('radioHorizonWithSurface', () => {
  it('returns 0 when height equals surface height', () => {
    expect(radioHorizonWithSurface(50, 50)).toBeCloseTo(0, 0)
  })

  it('less than free-space horizon when ground is elevated', () => {
    const free = radioHorizonFull(100)
    const elevated = radioHorizonWithSurface(100, 50)
    expect(elevated).toBeLessThan(free)
  })
})

describe('freeSpaceLoss', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(freeSpaceLoss(0, 2400)).toBe(0)
    expect(freeSpaceLoss(10, 0)).toBe(0)
  })

  it('increases with distance', () => {
    expect(freeSpaceLoss(20, 2400)).toBeGreaterThan(freeSpaceLoss(10, 2400))
  })

  it('matches FSPL formula: 20log(d) + 20log(f) + 32.44', () => {
    const result = freeSpaceLoss(10, 2400)
    const expected = 20 * Math.log10(10) + 20 * Math.log10(2400) + 32.44
    expect(result).toBeCloseTo(expected, 4)
  })
})

describe('airGroundRange', () => {
  it('returns 0 for non-positive aircraft altitude', () => {
    expect(airGroundRange(0)).toBe(0)
  })

  it('increases with altitude', () => {
    expect(airGroundRange(200)).toBeGreaterThan(airGroundRange(100))
  })
})

describe('airToAirRange', () => {
  it('symmetric', () => {
    expect(airToAirRange(100, 200)).toBeCloseTo(airToAirRange(200, 100), 6)
  })
})

describe('minAltitudeForRange', () => {
  it('returns 0 for non-positive distance', () => {
    expect(minAltitudeForRange(0)).toBe(0)
  })

  it('altitude increases with required range', () => {
    expect(minAltitudeForRange(50)).toBeGreaterThan(minAltitudeForRange(20))
  })
})

describe('radarMaxRange', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(radarMaxRange(0, 100)).toBe(0)
    expect(radarMaxRange(100, 0)).toBe(0)
  })

  it('equal to airToAirRange for same altitudes', () => {
    expect(radarMaxRange(100, 200)).toBeCloseTo(airToAirRange(100, 200), 6)
  })
})

describe('fresnelZoneRadius', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = fresnelZoneRadius(0, 2.4)
    expect(result.r1Radiusm).toBe(0)
  })

  it('clearance is 60% of r1', () => {
    const result = fresnelZoneRadius(10, 2.4)
    expect(result.clearanceM).toBeCloseTo(result.r1Radiusm * 0.6, 6)
  })

  it('r1 increases with distance', () => {
    const near = fresnelZoneRadius(5, 2.4)
    const far = fresnelZoneRadius(20, 2.4)
    expect(far.r1Radiusm).toBeGreaterThan(near.r1Radiusm)
  })
})
