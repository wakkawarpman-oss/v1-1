const GRAVITY = 9.80665
const RHO_SEA = 1.225

export type DropResult = {
  horizontalM: number
  timeS: number
  impactSpeedMs: number
  releasePointM: number
}

export function dropPointVacuum(params: {
  altitudeM: number
  speedKmh: number
  headwindKmh: number
}): DropResult {
  const { altitudeM, speedKmh, headwindKmh } = params
  if (altitudeM <= 0) return { horizontalM: 0, timeS: 0, impactSpeedMs: 0, releasePointM: 0 }
  if (speedKmh <= headwindKmh) return { horizontalM: 0, timeS: Math.sqrt((2 * altitudeM) / GRAVITY), impactSpeedMs: GRAVITY * Math.sqrt((2 * altitudeM) / GRAVITY), releasePointM: 0 }

  const vxMs = (speedKmh - headwindKmh) / 3.6
  const timeS = Math.sqrt((2 * altitudeM) / GRAVITY)
  const horizontalM = vxMs * timeS
  const impactSpeedMs = Math.hypot(vxMs, GRAVITY * timeS)

  return { horizontalM, timeS, impactSpeedMs, releasePointM: horizontalM }
}

export function dropPointDrag(params: {
  altitudeM: number
  speedKmh: number
  headwindKmh: number
  massKg: number
  diameterM: number
  cdValue?: number
  airDensityKgm3?: number
}): DropResult {
  const { altitudeM, speedKmh, headwindKmh, massKg, diameterM, cdValue = 0.47, airDensityKgm3 = RHO_SEA } = params
  if (altitudeM <= 0 || massKg <= 0 || diameterM <= 0) {
    return { horizontalM: 0, timeS: 0, impactSpeedMs: 0, releasePointM: 0 }
  }

  const area = Math.PI * (diameterM / 2) ** 2
  const dragCoeff = 0.5 * cdValue * airDensityKgm3 * area

  let vx = (speedKmh - headwindKmh) / 3.6
  let vz = 0
  let x = 0
  let z = altitudeM
  let t = 0
  const dt = 0.01

  while (z > 0 && t < 300) {
    const speed = Math.hypot(vx, vz)
    const ax = -(dragCoeff / massKg) * vx * speed
    const az = GRAVITY - (dragCoeff / massKg) * vz * speed

    vx += ax * dt
    vz += az * dt
    x += vx * dt
    z -= vz * dt
    t += dt
  }

  const impactSpeedMs = Math.hypot(vx, vz)

  return {
    horizontalM: x,
    timeS: t,
    impactSpeedMs,
    releasePointM: x,
  }
}

// ── Target Lead (Moving Target) ───────────────────────────────────────────────
// Lead distance = target ground speed × fall time (vacuum model).
// The munition must be released that many metres before the target position.
export type TargetLeadResult = {
  fallTimeS: number
  leadDistanceM: number
}

export function targetLead(params: {
  altitudeM: number
  targetSpeedKmh: number  // ground speed of the target
}): TargetLeadResult {
  if (params.altitudeM <= 0) return { fallTimeS: 0, leadDistanceM: 0 }
  const fallTimeS = Math.sqrt((2 * params.altitudeM) / GRAVITY)
  const leadDistanceM = (params.targetSpeedKmh / 3.6) * fallTimeS
  return { fallTimeS, leadDistanceM }
}

// ── Crosswind Lateral Drift ───────────────────────────────────────────────────
// Euler-integrated lateral displacement due to crosswind acting on a falling body.
export function crosswindDrift(params: {
  altitudeM: number
  crosswindKmh: number
  massKg: number
  diameterM: number
  cdValue?: number
}): number {
  const { altitudeM, crosswindKmh, massKg, diameterM, cdValue = 0.47 } = params
  if (altitudeM <= 0 || massKg <= 0 || diameterM <= 0) return 0
  const area = Math.PI * (diameterM / 2) ** 2
  const k = 0.5 * cdValue * RHO_SEA * area
  const vWind = crosswindKmh / 3.6
  let vy = 0, vz = 0, y = 0, z = altitudeM, t = 0
  const dt = 0.02
  while (z > 0 && t < 300) {
    const az = GRAVITY - (k / massKg) * vz * Math.abs(vz)
    const ay = (k / massKg) * (vWind - vy) * Math.abs(vWind - vy)
    vz += az * dt; vy += ay * dt
    z -= vz * dt; y += vy * dt; t += dt
  }
  return y
}

// ── Terminal Velocity ─────────────────────────────────────────────────────────
// Vt = sqrt(2mg / (ρ × Cd × A))
export function terminalVelocity(params: {
  massKg: number
  diameterM: number
  cdValue?: number
  densityKgM3?: number
}): number {
  const { massKg, diameterM, cdValue = 0.47, densityKgM3 = RHO_SEA } = params
  if (massKg <= 0 || diameterM <= 0) return 0
  const area = Math.PI * (diameterM / 2) ** 2
  return Math.sqrt((2 * massKg * GRAVITY) / (densityKgM3 * cdValue * area))
}

// ── Impact Kinetic Energy ─────────────────────────────────────────────────────
export type KineticEnergyResult = {
  joules: number
  kilojoules: number
  tntGramEquivalent: number  // 1 g TNT ≈ 4184 J
}

export function impactKineticEnergy(massKg: number, impactSpeedMs: number): KineticEnergyResult {
  if (massKg <= 0 || impactSpeedMs <= 0) return { joules: 0, kilojoules: 0, tntGramEquivalent: 0 }
  const joules = 0.5 * massKg * impactSpeedMs ** 2
  return { joules, kilojoules: joules / 1000, tntGramEquivalent: joules / 4184 }
}

// ── Safe Standoff Distance (Fuze Arming) ─────────────────────────────────────
// Horizontal distance the munition travels during the fuze arming delay.
export type StandoffResult = {
  standoffM: number
  fuzeArmsBeforeImpact: boolean
  fallTimeS: number
}

export function safeStandoffDistance(params: {
  altitudeM: number
  platformSpeedKmh: number
  headwindKmh: number
  fuzeDelayS: number
}): StandoffResult {
  const { altitudeM, platformSpeedKmh, headwindKmh, fuzeDelayS } = params
  if (altitudeM <= 0 || fuzeDelayS < 0) return { standoffM: 0, fuzeArmsBeforeImpact: false, fallTimeS: 0 }
  const fallTimeS = Math.sqrt((2 * altitudeM) / GRAVITY)
  const netSpeedMs = Math.max(0, (platformSpeedKmh - headwindKmh) / 3.6)
  return {
    standoffM: netSpeedMs * fuzeDelayS,
    fuzeArmsBeforeImpact: fuzeDelayS < fallTimeS,
    fallTimeS,
  }
}

// ── Drop Sequence Spread ──────────────────────────────────────────────────────
// Ground coverage of n payloads dropped at equal time intervals.
export type SequenceSpreadResult = {
  spanM: number
  impactOffsetsM: number[]  // distance behind release point for each drop
}

export function dropSequenceSpread(params: {
  count: number
  intervalS: number
  altitudeM: number
  platformSpeedKmh: number
  headwindKmh: number
}): SequenceSpreadResult {
  const { count, intervalS, altitudeM, platformSpeedKmh, headwindKmh } = params
  const safeCount = Math.min(Math.max(0, count), 20)
  if (altitudeM <= 0 || safeCount === 0) return { spanM: 0, impactOffsetsM: [] }
  const fallTimeS = Math.sqrt((2 * altitudeM) / GRAVITY)
  const netSpeedMs = Math.max(0, (platformSpeedKmh - headwindKmh) / 3.6)
  const offsets: number[] = []
  for (let i = 0; i < safeCount; i++) {
    offsets.push(netSpeedMs * fallTimeS + i * intervalS * netSpeedMs)
  }
  const spanM = offsets.length > 1 ? offsets[offsets.length - 1] - offsets[0] : 0
  return { spanM, impactOffsetsM: offsets }
}

// ── Parachute Sizing ──────────────────────────────────────────────────────────
// Finds canopy diameter so terminal velocity equals target landing speed.
// Vt = sqrt(2mg / (rho * Cd * A))  =>  A = 2mg / (rho * Cd * Vt²)
export function parachuteSizing(params: {
  massKg: number
  targetLandingMs: number   // desired sink rate, m/s
  cdCanopy?: number         // default 0.75 (round hemispherical)
  airDensity?: number       // kg/m³, default 1.225
}): { areaMsq: number; diameterM: number; actualVtMs: number } {
  const { massKg, targetLandingMs, cdCanopy = 0.75, airDensity = 1.225 } = params
  const areaMsq = (2 * massKg * GRAVITY) / (airDensity * cdCanopy * targetLandingMs ** 2)
  const diameterM = 2 * Math.sqrt(areaMsq / Math.PI)
  const actualVtMs = Math.sqrt((2 * massKg * GRAVITY) / (airDensity * cdCanopy * areaMsq))
  return { areaMsq, diameterM, actualVtMs }
}

// ── Bomb Drop — Forward Throw with Drag ──────────────────────────────────────
// Numerical integration (Euler, 50 ms step) of a dropped object with drag.
// Returns impact point forward offset from release point and time of flight.
export function bombDrop(params: {
  altitudeM: number
  platformSpeedMs: number   // horizontal at release
  windMs: number            // headwind positive, tailwind negative
  massKg: number
  dragCoeff: number         // Cd
  crossSectionM2: number    // frontal area m²
  airDensity?: number
}): { timeS: number; forwardM: number; impactSpeedMs: number; totalSpeedMs: number; vxImpactMs: number } {
  const { altitudeM, platformSpeedMs, windMs, massKg, dragCoeff, crossSectionM2, airDensity = 1.225 } = params
  const g = GRAVITY
  const dt = 0.02  // standardised with dropPointDrag (was 0.05)
  let y = altitudeM, vy = 0
  let x = 0, vx = platformSpeedMs - windMs
  let t = 0
  while (y > 0 && t < 300) {
    const v = Math.hypot(vx, vy)
    const drag = 0.5 * airDensity * dragCoeff * crossSectionM2 * v * v / massKg
    const dragAngle = Math.atan2(vy, vx)
    vx -= drag * Math.cos(dragAngle) * dt
    vy += g * dt - drag * Math.sin(dragAngle) * dt
    x += vx * dt
    y -= vy * dt
    t += dt
  }
  return { timeS: t, forwardM: x, impactSpeedMs: vy, totalSpeedMs: Math.hypot(vx, vy), vxImpactMs: vx }
}

// ── Unified 3D Drop — dive/toss + wind profile + tumbling Cd + bouncing ──────
//
// Coordinate system (all in metres):
//   X — carrier's forward direction (positive = forward)
//   Y — lateral (positive = right of carrier heading)
//   Z — altitude AGL (positive = up)
//
// Wind convention:
//   windHeadMs  > 0 → headwind (blows against X, i.e. wind velocity = −windHead in X)
//   windCrossMs > 0 → crosswind from left to right (wind velocity = +windCross in Y)
//
// Pitch convention:
//   pitchDeg > 0 → toss (nose up at release, object launched upward first)
//   pitchDeg < 0 → dive (nose down, object has initial downward velocity)
//   pitchDeg = 0 → level drop
//
// Tumbling model (Aerodynamic Stabilization):
//   For the first `stabilizationAltM` metres of fall below the release point,
//   Cd = cdTumble (flat/tumbling). After that, Cd = cdStable (nose-forward).
//   While the object is going UP (toss phase), it is still tumbling.
//
// Bounce model (Coefficient of Restitution):
//   After first ground contact: vz_new = cor × |vz_impact|  (upward)
//   Tangential velocity (vx, vy) reduced by frictionCoeff × 0.5 per bounce.
//   Bouncing continues until vz_peak < 0.25 m/s or fuze fires.
//
// Wind profile: logarithmic (ISO 4354) — wind speed scales with ln(z/z₀)/ln(z_ref/z₀).
// At z ≤ z₀ (ground level) wind = 0.

export interface Drop3DInput {
  /** Release altitude AGL, m */
  altitudeM: number
  /** Carrier ground speed at release, m/s */
  carrierSpeedMs: number
  /** Carrier pitch at release, degrees. Negative = dive, positive = toss */
  pitchDeg: number
  /** Extra velocity impulse from release mechanism, m/s (default 0) */
  releaseImpulseMs?: number
  /** Munition mass, kg */
  massKg: number
  /** Munition reference diameter, m */
  diameterM: number
  /** Cd when stabilised nose-first (e.g. VOG ≈ 0.3, grenade ≈ 0.47) */
  cdStable: number
  /** Cd while tumbling (default cdStable × 1.8, typical cylinder broadside ≈ 0.82) */
  cdTumble?: number
  /** Distance fallen below release at which Cd transitions to stable, m (default 15) */
  stabilizationAltM?: number
  /** Headwind component, m/s (positive = into carrier direction) */
  windHeadMs: number
  /** Crosswind component, m/s (positive = from left to right of carrier heading) */
  windCrossMs: number
  /** Reference height for log wind profile, m (default 10) */
  windRefHeightM?: number
  /** Terrain roughness length z₀, m (default 0.03 = open grass) */
  terrainZ0?: number
  /** Coefficient of restitution on first impact (0 = no bounce, 0.4 = hard asphalt) */
  cor?: number
  /** Ground friction coefficient μ (0.25 = hard floor, 0.35 = average, 0.55 = soil) */
  frictionCoeff?: number
  /** Fuze delay after first impact, s (0 = instant) */
  fuzeDelayS?: number
  /** Air density kg/m³ (default 1.225 = ISA sea level). Pass altitude-adjusted value for precision. */
  airDensityKgm3?: number
}

export interface Drop3DResult {
  /** Forward displacement at first impact, m (along carrier heading) */
  xForwardM: number
  /** Lateral displacement at first impact, m (right = positive) */
  yLateralM: number
  /** Time from release to first ground contact, s */
  timeToFirstImpactS: number
  /** Total speed at first impact, m/s */
  impactSpeedMs: number
  /** Impact angle below horizontal, degrees */
  impactAngleDeg: number
  /** Number of bounces before fuze fires or object stops */
  bounceCount: number
  /** Final X position (after bounces/slide up to fuze fire), m */
  finalXM: number
  /** Final Y position (after bounces/slide up to fuze fire), m */
  finalYM: number
  /** Total time from release to detonation/stop, s */
  totalTimeS: number
}

export function drop3D(inp: Drop3DInput): Drop3DResult {
  const {
    altitudeM, carrierSpeedMs, pitchDeg,
    releaseImpulseMs = 0,
    massKg, diameterM,
    cdStable,
    cdTumble: cdTumbleIn,
    stabilizationAltM = 15,
    windHeadMs, windCrossMs,
    windRefHeightM = 10,
    terrainZ0 = 0.03,
    cor = 0,
    frictionCoeff = 0.35,
    fuzeDelayS = 0,
    airDensityKgm3 = RHO_SEA,
  } = inp

  const cdTumble = cdTumbleIn ?? cdStable * 1.8

  const ZERO: Drop3DResult = {
    xForwardM: 0, yLateralM: 0, timeToFirstImpactS: 0,
    impactSpeedMs: 0, impactAngleDeg: 90,
    bounceCount: 0, finalXM: 0, finalYM: 0, totalTimeS: 0,
  }
  if (altitudeM <= 0 || massKg <= 0 || diameterM <= 0) return ZERO

  const area = Math.PI * (diameterM / 2) ** 2
  const pitchRad = pitchDeg * (Math.PI / 180)

  // Initial velocities in ground frame (X forward, Y right, Z up)
  let vx = carrierSpeedMs * Math.cos(pitchRad) + releaseImpulseMs
  let vy = 0
  let vz = carrierSpeedMs * Math.sin(pitchRad)   // positive = going up (toss)

  let x = 0, y = 0, z = altitudeM, t = 0
  const dt = 0.01

  // Log wind profile: wind speed at altitude z
  const lnRef = windRefHeightM > terrainZ0
    ? Math.log(windRefHeightM / terrainZ0)
    : 1
  function windAt(height: number): number {
    if (height <= terrainZ0) return 0
    return Math.max(0, Math.log(height / terrainZ0) / lnRef)
  }

  // ── Phase 1: fall to first ground contact ──────────────────────────────────
  while (z > 0 && t < 300) {
    // Distance fallen below release (negative while toss is going up)
    const fallenBelow = altitudeM - z
    const cd = fallenBelow < stabilizationAltM ? cdTumble : cdStable

    // Wind velocity in world frame: headwind opposes X, crosswind adds Y
    const wScale = windAt(Math.max(terrainZ0 + 0.01, z))
    const wx = -windHeadMs * wScale   // wind in X (headwind blows backward)
    const wy =  windCrossMs * wScale  // wind in Y (crosswind pushes right)

    // Relative velocity of munition vs air
    const vRelX = vx - wx
    const vRelY = vy - wy
    const vRelZ = vz               // no vertical wind component

    const vRel = Math.sqrt(vRelX ** 2 + vRelY ** 2 + vRelZ ** 2)
    if (vRel > 0) {
      const kDrag = (0.5 * airDensityKgm3 * cd * area * vRel) / massKg
      vx -= kDrag * vRelX * dt
      vy -= kDrag * vRelY * dt
      vz -= kDrag * vRelZ * dt
    }
    vz -= GRAVITY * dt   // gravity

    x += vx * dt
    y += vy * dt
    z += vz * dt
    t += dt
  }

  const xFirstImpact = x
  const yFirstImpact = y
  const tFirstImpact = t
  const vHoriz = Math.sqrt(vx ** 2 + vy ** 2)
  const impactSpeedMs = Math.sqrt(vHoriz ** 2 + vz ** 2)
  const impactAngleDeg = Math.atan2(Math.abs(vz), vHoriz) * (180 / Math.PI)

  // No bounce or instant fuze → done
  if (cor <= 0 || fuzeDelayS <= 0) {
    return {
      xForwardM: xFirstImpact, yLateralM: yFirstImpact,
      timeToFirstImpactS: tFirstImpact, impactSpeedMs, impactAngleDeg,
      bounceCount: 0, finalXM: xFirstImpact, finalYM: yFirstImpact,
      totalTimeS: tFirstImpact,
    }
  }

  // ── Phase 2: bouncing + sliding until fuze fires ───────────────────────────
  z = 0
  vz = cor * Math.abs(vz)        // bounce back up
  const kTan = 1 - frictionCoeff * 0.5
  vx *= kTan
  vy *= kTan

  let bounceCount = 0
  let tPost = 0
  const dtB = 0.005
  const MAX_BOUNCES = 30

  while (tPost < fuzeDelayS && bounceCount < MAX_BOUNCES) {
    // Check if bouncing is essentially finished
    if (vz < 0.25 && z <= 0.001) {
      // Slide on ground until fuze fires
      const vSlide = Math.sqrt(vx ** 2 + vy ** 2)
      const aFric = frictionCoeff * GRAVITY
      const tStop = vSlide > 0 ? vSlide / aFric : 0
      const tSlide = Math.min(fuzeDelayS - tPost, tStop)
      if (vSlide > 0) {
        x += vx * tSlide - 0.5 * aFric * (vx / vSlide) * tSlide ** 2
        y += vy * tSlide - 0.5 * aFric * (vy / vSlide) * tSlide ** 2
      }
      tPost = fuzeDelayS
      break
    }

    // Integrate one bounce arc
    while (z >= 0 && tPost < fuzeDelayS) {
      const vB = Math.sqrt(vx ** 2 + vy ** 2 + vz ** 2)
      if (vB > 0) {
        const kDrag = (0.5 * airDensityKgm3 * cdStable * area * vB) / massKg
        vx -= kDrag * vx * dtB
        vy -= kDrag * vy * dtB
        vz -= kDrag * vz * dtB
      }
      vz -= GRAVITY * dtB
      x += vx * dtB
      y += vy * dtB
      z += vz * dtB
      tPost += dtB
    }

    if (z < 0) {
      z = 0
      bounceCount++
      vz = cor * Math.abs(vz)
      vx *= kTan
      vy *= kTan
    }
  }

  return {
    xForwardM: xFirstImpact,
    yLateralM: yFirstImpact,
    timeToFirstImpactS: tFirstImpact,
    impactSpeedMs,
    impactAngleDeg,
    bounceCount,
    finalXM: x,
    finalYM: y,
    totalTimeS: tFirstImpact + tPost,
  }
}

// ── Fuze Delay Slide ──────────────────────────────────────────────────────────
// After ground impact the munition keeps sliding/rolling until friction stops it
// or the fuze fires.
//
// Fuze types (common for drone-dropped munitions):
//   'instant'  — накольний (МД-5М, НД-42М): fires on contact, delay = 0 s
//   'uzrgm'    — УЗРГМ / УЗРГ grenade fuze: 3.2–4.2 s (used with РГД-5, Ф-1 etc.)
//   'vog'      — ВОГ-17/25 with МРВ підривник: instant (point-det.)
//   'delay3'   — 3 s programmable / mortar delay cap
//   'delay4'   — 4 s programmable / mortar delay cap
//   'custom'   — user-supplied seconds
//
// Ground model: constant Coulomb friction, a = μ·g, only horizontal motion.
// Bounce/tumble not modelled — gives conservative lower-bound slide distance.
export type FuzeType = 'instant' | 'uzrgm' | 'vog' | 'delay3' | 'delay4' | 'custom'

export const FUZE_PRESETS: Record<FuzeType, { label: string; delayS: number; description: string }> = {
  instant: { label: 'Накольний (0 с)',          delayS: 0,   description: 'МД-5М, НД-42М, МРВ-У — спрацювання при ударі' },
  vog:     { label: 'ВОГ/МРВ — миттєво',        delayS: 0,   description: 'ВОГ-17, ВОГ-25 з миттєвим підривником' },
  uzrgm:   { label: 'УЗРГМ / УЗРГ (3.5 с)',      delayS: 3.5, description: 'Стандартний капсуль Ф-1, РГД-5, РГН/РГО' },
  delay3:  { label: 'Затримка 3 с',              delayS: 3.0, description: 'Програмований / мінометний капсуль-затримка' },
  delay4:  { label: 'Затримка 4 с',              delayS: 4.0, description: 'Програмований / мінометний капсуль-затримка' },
  custom:  { label: 'Власна затримка',            delayS: 0,   description: 'Введіть час вручну' },
}

export function fuzeDelaySlide(params: {
  vxImpactMs: number     // horizontal velocity at ground impact (from bombDrop)
  fuzeDelayS: number     // time after impact before detonation (0 = instant)
  frictionCoeff?: number // μ: hard surface ≈ 0.25, grass ≈ 0.40, soil ≈ 0.55
}): {
  slideM: number               // distance grenade slides before detonation
  detonationVelocityMs: number // velocity at moment of detonation
  stillMovingAtDetonation: boolean
  stopTimeS: number            // time until grenade stops (if no fuze fires)
} {
  const { vxImpactMs, fuzeDelayS, frictionCoeff = 0.35 } = params
  const vx = Math.abs(vxImpactMs)
  const a = frictionCoeff * GRAVITY                     // deceleration m/s²
  const stopTimeS = a > 0 ? vx / a : Infinity

  if (fuzeDelayS <= 0 || vx <= 0) {
    return { slideM: 0, detonationVelocityMs: vx, stillMovingAtDetonation: vx > 0.1, stopTimeS }
  }

  if (fuzeDelayS >= stopTimeS) {
    // grenade stops before fuze fires
    const slideM = (vx * vx) / (2 * a)
    return { slideM, detonationVelocityMs: 0, stillMovingAtDetonation: false, stopTimeS }
  } else {
    // still sliding when fuze fires
    const slideM = vx * fuzeDelayS - 0.5 * a * fuzeDelayS * fuzeDelayS
    const detonationVelocityMs = vx - a * fuzeDelayS
    return { slideM, detonationVelocityMs, stillMovingAtDetonation: true, stopTimeS }
  }
}
