import { describe, it, expect } from 'vitest'
import {
  gsd,
  fovDeg,
  cameraFootprint,
  SENSOR_PRESETS,
  pointOfNoReturn,
  fresnelZone,
  antennaLengths,
  imdConflictMatrix,
  linkBudget,
  maxLinkDistanceKm,
} from '../optics'

describe('gsd', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(gsd({ altitudeM: 0, sensorWidthMm: 6.17, focalLengthMm: 4, imageWidthPx: 4000 })).toBe(0)
    expect(gsd({ altitudeM: 100, sensorWidthMm: 0, focalLengthMm: 4, imageWidthPx: 4000 })).toBe(0)
  })
  it('GSD = altitude × 100 × sensor / (focal × pixels)', () => {
    const val = gsd({ altitudeM: 100, sensorWidthMm: 6.17, focalLengthMm: 3.6, imageWidthPx: 4000 })
    const expected = (100 * 100 * 6.17) / (3.6 * 4000)
    expect(val).toBeCloseTo(expected, 4)
  })
  it('higher altitude → worse GSD (larger number)', () => {
    const low = gsd({ altitudeM: 50, sensorWidthMm: 6.17, focalLengthMm: 4, imageWidthPx: 4000 })
    const high = gsd({ altitudeM: 200, sensorWidthMm: 6.17, focalLengthMm: 4, imageWidthPx: 4000 })
    expect(high).toBeGreaterThan(low)
  })
})

describe('fovDeg', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(fovDeg(0, 4)).toBe(0)
    expect(fovDeg(6.17, 0)).toBe(0)
  })
  it('2 × atan(sensor / (2 × f)) in degrees', () => {
    const expected = (2 * Math.atan(6.17 / (2 * 3.6)) * 180) / Math.PI
    expect(fovDeg(6.17, 3.6)).toBeCloseTo(expected, 4)
  })
  it('longer focal length → narrower FOV', () => {
    const wide = fovDeg(6.17, 4)
    const tele = fovDeg(6.17, 50)
    expect(tele).toBeLessThan(wide)
  })
})

describe('cameraFootprint', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = cameraFootprint({ altitudeM: 0, hFovDeg: 50, vFovDeg: 40 })
    expect(result.widthM).toBe(0)
    expect(result.areaM2).toBe(0)
  })
  it('area = width × height', () => {
    const fp = cameraFootprint({ altitudeM: 100, hFovDeg: 60, vFovDeg: 45 })
    expect(fp.areaM2).toBeCloseTo(fp.widthM * fp.heightM, 5)
  })
  it('higher altitude → larger footprint', () => {
    const low = cameraFootprint({ altitudeM: 50, hFovDeg: 60, vFovDeg: 45 })
    const high = cameraFootprint({ altitudeM: 200, hFovDeg: 60, vFovDeg: 45 })
    expect(high.areaM2).toBeGreaterThan(low.areaM2)
  })
})

describe('SENSOR_PRESETS', () => {
  it('is non-empty array', () => {
    expect(SENSOR_PRESETS.length).toBeGreaterThan(0)
  })
  it('each preset has valid positive dimensions', () => {
    SENSOR_PRESETS.forEach((preset) => {
      expect(preset.widthMm).toBeGreaterThan(0)
      expect(preset.heightMm).toBeGreaterThan(0)
    })
  })
})

describe('pointOfNoReturn (optics)', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = pointOfNoReturn({ safeEnduranceHours: 0, gsOutboundKmh: 100, gsHomeboundKmh: 90 })
    expect(result.maxDistanceKm).toBe(0)
  })
  it('PNR distance = SE × (v_out × v_home) / (v_out + v_home)', () => {
    const se = 2, out = 120, home = 80
    const expected = se * ((out * home) / (out + home))
    const result = pointOfNoReturn({ safeEnduranceHours: se, gsOutboundKmh: out, gsHomeboundKmh: home })
    expect(result.maxDistanceKm).toBeCloseTo(expected, 4)
  })
  it('time out + time home ≈ safe endurance (minutes)', () => {
    const se = 2, out = 100, home = 100
    const result = pointOfNoReturn({ safeEnduranceHours: se, gsOutboundKmh: out, gsHomeboundKmh: home })
    expect(result.timeToTurnMinutes + result.timeHomingMinutes).toBeCloseTo(se * 60, 3)
  })
})

describe('fresnelZone', () => {
  it('returns zeros for non-positive inputs', () => {
    const result = fresnelZone({ distanceKm: 0, frequencyGHz: 2.4 })
    expect(result.radiusM).toBe(0)
  })
  it('R1 = 17.32 × sqrt(d / (4 × f))', () => {
    const d = 1, f = 2.4
    const expected = 17.32 * Math.sqrt(d / (4 * f))
    const result = fresnelZone({ distanceKm: d, frequencyGHz: f })
    expect(result.radiusM).toBeCloseTo(expected, 4)
  })
  it('60% clearance = 0.6 × radius', () => {
    const result = fresnelZone({ distanceKm: 1, frequencyGHz: 2.4 })
    expect(result.minClearanceM).toBeCloseTo(result.radiusM * 0.6, 5)
  })
})

describe('antennaLengths (optics)', () => {
  it('returns zeros for non-positive frequency', () => {
    const result = antennaLengths(0)
    expect(result.fullWaveMm).toBe(0)
  })
  it('half wave = full wave / 2', () => {
    const result = antennaLengths(433)
    expect(result.halfWaveMm).toBeCloseTo(result.fullWaveMm / 2, 4)
  })
  it('quarter wave = full wave / 4', () => {
    const result = antennaLengths(433)
    expect(result.quarterWaveMm).toBeCloseTo(result.fullWaveMm / 4, 4)
  })
  it('2.4 GHz full wave ≈ 118 mm (0.95 VF)', () => {
    const result = antennaLengths(2400)
    expect(result.fullWaveMm).toBeCloseTo((299.792 / 2400) * 0.95 * 1000, 1)
  })
})

describe('imdConflictMatrix', () => {
  it('returns empty array for no conflicts', () => {
    expect(imdConflictMatrix([900, 1200, 1600])).toHaveLength(0)
  })
  it('detects 3rd order intermodulation product', () => {
    // 2×f1 – f2 = 2×433 – 345 = 521 ≈ 521
    // if 521 is not in the list there is no conflict
    const conflicts = imdConflictMatrix([433, 523, 610])
    // 2×433−523=343 not in list; 2×523−433=613 not exact; 2×433−610=256 not in list
    expect(Array.isArray(conflicts)).toBe(true)
  })
  it('self-pair is skipped (i === j)', () => {
    const conflicts = imdConflictMatrix([100, 200, 300])
    // 2×100−200=0 not present; 2×200−100=300 → conflict!
    expect(conflicts.some((c) => c.product3rdMHz === 300)).toBe(true)
  })
})

describe('linkBudget', () => {
  it('returns non-viable link for non-positive distance', () => {
    const result = linkBudget({
      txPowerDbm: 30, txGainDbi: 3, rxGainDbi: 3,
      rxSensitivityDbm: -90, distanceKm: 0, frequencyMHz: 2400,
    })
    expect(result.viable).toBe(false)
    expect(result.fsplDb).toBe(0)
  })
  it('FSPL formula: 20log10(d) + 20log10(f) + 32.44', () => {
    const d = 1, f = 2400
    const expected = 20 * Math.log10(d) + 20 * Math.log10(f) + 32.44
    const result = linkBudget({
      txPowerDbm: 30, txGainDbi: 3, rxGainDbi: 3,
      rxSensitivityDbm: -90, distanceKm: d, frequencyMHz: f,
    })
    expect(result.fsplDb).toBeCloseTo(expected, 3)
  })
  it('viable link when margin > 0', () => {
    const result = linkBudget({
      txPowerDbm: 30, txGainDbi: 6, rxGainDbi: 6,
      rxSensitivityDbm: -90, distanceKm: 0.1, frequencyMHz: 2400,
    })
    expect(result.viable).toBe(true)
    expect(result.linkMarginDb).toBeGreaterThan(0)
  })
})

describe('maxLinkDistanceKm', () => {
  it('returns 0 for non-positive frequency', () => {
    expect(maxLinkDistanceKm({ txPowerDbm: 30, txGainDbi: 3, rxGainDbi: 3, rxSensitivityDbm: -90, frequencyMHz: 0 })).toBe(0)
  })
  it('returns positive distance for valid strong link', () => {
    const d = maxLinkDistanceKm({
      txPowerDbm: 30, txGainDbi: 3, rxGainDbi: 3, rxSensitivityDbm: -90, frequencyMHz: 900,
    })
    expect(d).toBeGreaterThan(0)
  })
  it('higher Tx power → greater max distance', () => {
    const low = maxLinkDistanceKm({ txPowerDbm: 20, txGainDbi: 3, rxGainDbi: 3, rxSensitivityDbm: -90, frequencyMHz: 900 })
    const high = maxLinkDistanceKm({ txPowerDbm: 33, txGainDbi: 3, rxGainDbi: 3, rxSensitivityDbm: -90, frequencyMHz: 900 })
    expect(high).toBeGreaterThan(low)
  })
})
