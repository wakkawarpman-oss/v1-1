import { describe, it, expect } from 'vitest'
import {
  geodeticToEcef,
  ecefToGeodetic,
  geodeticToUtm,
  ecefToEnu,
  enuToEcef,
  nedToEnu,
  enuToNed,
  haversineDistance,
  initialBearing,
  destinationPoint,
  sphericalToLocal,
} from '../coordinate-systems'

const ORIGIN_LAT = 48.2082  // Vienna
const ORIGIN_LON = 16.3738

describe('geodeticToEcef', () => {
  it('returns zeros for non-finite inputs', () => {
    const result = geodeticToEcef(NaN, 0, 0)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.z).toBe(0)
  })

  it('x > 0, y ≈ 0 at (0°, 0°, 0m)', () => {
    const result = geodeticToEcef(0, 0, 0)
    expect(result.x).toBeGreaterThan(6_370_000)
    expect(result.y).toBeCloseTo(0, 0)
  })

  it('z > 0 at north pole', () => {
    const result = geodeticToEcef(90, 0, 0)
    expect(result.z).toBeGreaterThan(6_350_000)
    expect(result.x).toBeCloseTo(0, 0)
  })
})

describe('ecefToGeodetic round-trip', () => {
  it('recovers lat/lon/alt within precision', () => {
    const lat = 47.5, lon = 19.0, alt = 100
    const ecef = geodeticToEcef(lat, lon, alt)
    const back = ecefToGeodetic(ecef.x, ecef.y, ecef.z)
    expect(back.latDeg).toBeCloseTo(lat, 4)
    expect(back.lonDeg).toBeCloseTo(lon, 4)
    expect(back.altM).toBeCloseTo(alt, 0)
  })
})

describe('geodeticToUtm', () => {
  it('returns zeros for NaN input', () => {
    const result = geodeticToUtm(NaN, NaN)
    expect(result.easting).toBe(0)
  })

  it('returns zone 33 for Vienna (lon 16.3738°)', () => {
    const result = geodeticToUtm(ORIGIN_LAT, ORIGIN_LON)
    expect(result.zone).toBe(33)
  })

  it('easting is near 500000 for the central meridian of the zone', () => {
    // Central meridian of zone 33 is 15° → Vienna is close → easting ≈ 600 000
    const result = geodeticToUtm(ORIGIN_LAT, ORIGIN_LON)
    expect(result.easting).toBeGreaterThan(400_000)
    expect(result.easting).toBeLessThan(800_000)
  })

  it('adds 10 000 000 to northing for southern hemisphere', () => {
    const north = geodeticToUtm(10, 20)
    const south = geodeticToUtm(-10, 20)
    expect(south.northing).toBeGreaterThan(north.northing)
  })
})

describe('ecefToEnu', () => {
  it('returns ~zero ENU for same point as reference', () => {
    const ref = geodeticToEcef(ORIGIN_LAT, ORIGIN_LON, 0)
    const enu = ecefToEnu(ref.x, ref.y, ref.z, ORIGIN_LAT, ORIGIN_LON, 0)
    expect(enu.east).toBeCloseTo(0, 2)
    expect(enu.north).toBeCloseTo(0, 2)
    expect(enu.up).toBeCloseTo(0, 2)
  })
})

describe('enuToEcef round-trip', () => {
  it('recovers original ECEF within precision', () => {
    const ref = geodeticToEcef(ORIGIN_LAT, ORIGIN_LON, 100)
    const enu = ecefToEnu(ref.x, ref.y, ref.z, ORIGIN_LAT, ORIGIN_LON, 100)
    const back = enuToEcef(enu.east, enu.north, enu.up, ORIGIN_LAT, ORIGIN_LON, 100)
    expect(back.x).toBeCloseTo(ref.x, 0)
    expect(back.y).toBeCloseTo(ref.y, 0)
    expect(back.z).toBeCloseTo(ref.z, 0)
  })
})

describe('nedToEnu / enuToNed', () => {
  it('enuToNed inverts nedToEnu', () => {
    const n = 100, e = 200, d = -50
    const enu = nedToEnu(n, e, d)
    const ned = enuToNed(enu.east, enu.north, enu.up)
    expect(ned.north).toBeCloseTo(n, 6)
    expect(ned.east).toBeCloseTo(e, 6)
    expect(ned.down).toBeCloseTo(d, 6)
  })

  it('down = -up', () => {
    const enu = nedToEnu(0, 0, -300)
    expect(enu.up).toBeCloseTo(300, 6)
  })
})

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(50, 30, 50, 30)).toBeCloseTo(0, 4)
  })

  it('returns ~111 km per degree latitude', () => {
    expect(haversineDistance(0, 0, 1, 0)).toBeCloseTo(111_195, 0)
  })

  it('is symmetric', () => {
    const a = haversineDistance(47, 19, 48, 20)
    const b = haversineDistance(48, 20, 47, 19)
    expect(a).toBeCloseTo(b, 4)
  })
})

describe('initialBearing', () => {
  it('bearing from south to north is ~0°', () => {
    const bearing = initialBearing(0, 0, 1, 0)
    expect(bearing).toBeCloseTo(0, 0)
  })

  it('bearing from west to east is ~90°', () => {
    const bearing = initialBearing(0, 0, 0, 1)
    expect(bearing).toBeCloseTo(90, 0)
  })

  it('is in range [0, 360)', () => {
    const b = initialBearing(ORIGIN_LAT, ORIGIN_LON, 40, 10)
    expect(b).toBeGreaterThanOrEqual(0)
    expect(b).toBeLessThan(360)
  })
})

describe('destinationPoint', () => {
  it('returns approximately same coordinates for 0-distance travel', () => {
    const result = destinationPoint(ORIGIN_LAT, ORIGIN_LON, 0, 90)
    expect(result.latDeg).toBeCloseTo(ORIGIN_LAT, 4)
    expect(result.lonDeg).toBeCloseTo(ORIGIN_LON, 4)
  })

  it('moving 1° worth of distance northward increases latitude by ~1°', () => {
    const result = destinationPoint(0, 0, 111_195, 0)
    expect(result.latDeg).toBeCloseTo(1, 1)
  })
})

describe('sphericalToLocal', () => {
  it('returns ~zero for same-point', () => {
    const result = sphericalToLocal(ORIGIN_LAT, ORIGIN_LON, ORIGIN_LAT, ORIGIN_LON)
    expect(result.x).toBeCloseTo(0, 2)
    expect(result.y).toBeCloseTo(0, 2)
  })
})
