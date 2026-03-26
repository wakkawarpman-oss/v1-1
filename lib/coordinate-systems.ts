const WGS84_A = 6378137
const WGS84_F = 1 / 298.257223563
const WGS84_E2 = 2 * WGS84_F - WGS84_F * WGS84_F
const EARTH_RADIUS_M = 6371000

function deg2rad(deg: number) {
  return (deg * Math.PI) / 180
}

function rad2deg(rad: number) {
  return (rad * 180) / Math.PI
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value)
}

export function geodeticToEcef(latDeg: number, lonDeg: number, altM: number) {
  if (!isFiniteNumber(latDeg) || !isFiniteNumber(lonDeg) || !isFiniteNumber(altM)) {
    return { x: 0, y: 0, z: 0 }
  }

  const phi = deg2rad(latDeg)
  const lambda = deg2rad(lonDeg)
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const cosLambda = Math.cos(lambda)
  const sinLambda = Math.sin(lambda)
  const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi)

  return {
    x: (n + altM) * cosPhi * cosLambda,
    y: (n + altM) * cosPhi * sinLambda,
    z: (n * (1 - WGS84_E2) + altM) * sinPhi,
  }
}

export function ecefToGeodetic(x: number, y: number, z: number) {
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
    return { latDeg: 0, lonDeg: 0, altM: 0 }
  }

  const lonRad = Math.atan2(y, x)
  const p = Math.hypot(x, y)
  let latRad = Math.atan2(z, p * (1 - WGS84_E2))
  let altitude = 0

  for (let index = 0; index < 10; index += 1) {
    const sinLat = Math.sin(latRad)
    const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinLat * sinLat)
    altitude = p / Math.cos(latRad) - n
    latRad = Math.atan2(z, p * (1 - (WGS84_E2 * n) / (n + altitude)))
  }

  return {
    latDeg: rad2deg(latRad),
    lonDeg: rad2deg(lonRad),
    altM: altitude,
  }
}

export function geodeticToUtm(latDeg: number, lonDeg: number) {
  if (!isFiniteNumber(latDeg) || !isFiniteNumber(lonDeg)) {
    return { zone: 0, easting: 0, northing: 0 }
  }

  const zone = Math.max(1, Math.min(60, Math.floor((lonDeg + 180) / 6) + 1))
  const lon0 = (zone - 1) * 6 - 180 + 3
  const phi = deg2rad(latDeg)
  const lambda = deg2rad(lonDeg)
  const lambda0 = deg2rad(lon0)
  const k0 = 0.9996
  const sinPhi = Math.sin(phi)
  const cosPhi = Math.cos(phi)
  const tanPhi = Math.tan(phi)
  const n = WGS84_A / Math.sqrt(1 - WGS84_E2 * sinPhi * sinPhi)
  const t = tanPhi * tanPhi
  const c = (WGS84_E2 * cosPhi * cosPhi) / (1 - WGS84_E2)
  const a = (lambda - lambda0) * cosPhi
  const m = WGS84_A * ((1 - WGS84_E2 / 4 - (3 * WGS84_E2 * WGS84_E2) / 64 - (5 * WGS84_E2 ** 3) / 256) * phi
    - ((3 * WGS84_E2) / 8 + (3 * WGS84_E2 * WGS84_E2) / 32 + (45 * WGS84_E2 ** 3) / 1024) * Math.sin(2 * phi)
    + ((15 * WGS84_E2 * WGS84_E2) / 256 + (45 * WGS84_E2 ** 3) / 1024) * Math.sin(4 * phi)
    - ((35 * WGS84_E2 ** 3) / 3072) * Math.sin(6 * phi))

  const easting = k0 * n * (a + ((1 - t + c) * a ** 3) / 6 + ((5 - 18 * t + t * t + 72 * c - 58 * WGS84_E2) * a ** 5) / 120) + 500000
  const northingBase = k0 * (m + n * tanPhi * ((a * a) / 2 + ((5 - t + 9 * c + 4 * c * c) * a ** 4) / 24 + ((61 - 58 * t + t * t + 600 * c - 330 * WGS84_E2) * a ** 6) / 720))

  return {
    zone,
    easting,
    northing: latDeg < 0 ? northingBase + 10000000 : northingBase,
  }
}

export function ecefToEnu(x: number, y: number, z: number, refLatDeg: number, refLonDeg: number, refAltM: number) {
  const reference = geodeticToEcef(refLatDeg, refLonDeg, refAltM)
  const dx = x - reference.x
  const dy = y - reference.y
  const dz = z - reference.z
  const phi = deg2rad(refLatDeg)
  const lambda = deg2rad(refLonDeg)

  return {
    east: -Math.sin(lambda) * dx + Math.cos(lambda) * dy,
    north: -Math.sin(phi) * Math.cos(lambda) * dx - Math.sin(phi) * Math.sin(lambda) * dy + Math.cos(phi) * dz,
    up: Math.cos(phi) * Math.cos(lambda) * dx + Math.cos(phi) * Math.sin(lambda) * dy + Math.sin(phi) * dz,
  }
}

export function enuToEcef(east: number, north: number, up: number, refLatDeg: number, refLonDeg: number, refAltM: number) {
  const reference = geodeticToEcef(refLatDeg, refLonDeg, refAltM)
  const phi = deg2rad(refLatDeg)
  const lambda = deg2rad(refLonDeg)

  return {
    x: -Math.sin(lambda) * east - Math.sin(phi) * Math.cos(lambda) * north + Math.cos(phi) * Math.cos(lambda) * up + reference.x,
    y: Math.cos(lambda) * east - Math.sin(phi) * Math.sin(lambda) * north + Math.cos(phi) * Math.sin(lambda) * up + reference.y,
    z: Math.cos(phi) * north + Math.sin(phi) * up + reference.z,
  }
}

export function nedToEnu(north: number, east: number, down: number) {
  return { east, north, up: -down }
}

export function enuToNed(east: number, north: number, up: number) {
  return { north, east, down: -up }
}

export function sphericalToLocal(latDeg: number, lonDeg: number, refLatDeg: number, refLonDeg: number) {
  const phi1 = deg2rad(refLatDeg)
  const phi2 = deg2rad(latDeg)
  const deltaLambda = deg2rad(lonDeg - refLonDeg)
  return {
    x: EARTH_RADIUS_M * deltaLambda * Math.cos((phi1 + phi2) / 2),
    y: EARTH_RADIUS_M * (phi2 - phi1),
  }
}

export function haversineDistance(lat1Deg: number, lon1Deg: number, lat2Deg: number, lon2Deg: number) {
  const phi1 = deg2rad(lat1Deg)
  const phi2 = deg2rad(lat2Deg)
  const deltaPhi = deg2rad(lat2Deg - lat1Deg)
  const deltaLambda = deg2rad(lon2Deg - lon1Deg)
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

export function initialBearing(lat1Deg: number, lon1Deg: number, lat2Deg: number, lon2Deg: number) {
  const phi1 = deg2rad(lat1Deg)
  const phi2 = deg2rad(lat2Deg)
  const deltaLambda = deg2rad(lon2Deg - lon1Deg)
  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)
  return (rad2deg(Math.atan2(y, x)) + 360) % 360
}

export function destinationPoint(lat1Deg: number, lon1Deg: number, distanceM: number, bearingDeg: number) {
  const phi1 = deg2rad(lat1Deg)
  const lambda1 = deg2rad(lon1Deg)
  const delta = distanceM / EARTH_RADIUS_M
  const theta = deg2rad(bearingDeg)
  const phi2 = Math.asin(Math.sin(phi1) * Math.cos(delta) + Math.cos(phi1) * Math.sin(delta) * Math.cos(theta))
  const lambda2 = lambda1 + Math.atan2(Math.sin(theta) * Math.sin(delta) * Math.cos(phi1), Math.cos(delta) - Math.sin(phi1) * Math.sin(phi2))

  return {
    latDeg: rad2deg(phi2),
    lonDeg: rad2deg(lambda2),
  }
}