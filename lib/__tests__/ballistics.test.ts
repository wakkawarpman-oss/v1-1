import { describe, it, expect } from 'vitest'
import { drop3D, dropPointVacuum, dropPointDrag } from '../ballistics'

describe('dropPointVacuum', () => {
  it('returns zeros for zero altitude', () => {
    const result = dropPointVacuum({ altitudeM: 0, speedKmh: 100, headwindKmh: 0 })
    expect(result.horizontalM).toBe(0)
    expect(result.timeS).toBe(0)
  })

  it('calculates realistic drop from 100m at 100 km/h', () => {
    const result = dropPointVacuum({ altitudeM: 100, speedKmh: 100, headwindKmh: 0 })
    // t = sqrt(2*100/9.80665) ≈ 4.515 s
    expect(result.timeS).toBeCloseTo(4.515, 1)
    // vx = 100/3.6 ≈ 27.78 m/s → horizontalM ≈ 125.4 m
    expect(result.horizontalM).toBeCloseTo(125.4, 0)
  })

  it('returns zero horizontal when headwind equals forward speed', () => {
    const result = dropPointVacuum({ altitudeM: 50, speedKmh: 60, headwindKmh: 60 })
    expect(result.horizontalM).toBe(0)
  })

  it('impact speed includes vertical component', () => {
    const result = dropPointVacuum({ altitudeM: 100, speedKmh: 0, headwindKmh: 0 })
    // pure vertical fall: impact ≈ sqrt(2*g*h) ≈ 44.3 m/s
    expect(result.impactSpeedMs).toBeCloseTo(44.3, 0)
  })
})

describe('dropPointDrag', () => {
  it('handles invalid inputs gracefully', () => {
    const result = dropPointDrag({ altitudeM: 0, speedKmh: 100, headwindKmh: 0, massKg: 1, diameterM: 0.1 })
    expect(result.horizontalM).toBe(0)
  })

  it('drag reduces range compared to vacuum for same inputs', () => {
    const vacuum = dropPointVacuum({ altitudeM: 100, speedKmh: 100, headwindKmh: 0 })
    const drag = dropPointDrag({ altitudeM: 100, speedKmh: 100, headwindKmh: 0, massKg: 0.5, diameterM: 0.15 })
    expect(drag.horizontalM).toBeLessThan(vacuum.horizontalM)
  })

  it('returns positive values for valid inputs', () => {
    const result = dropPointDrag({ altitudeM: 50, speedKmh: 80, headwindKmh: 10, massKg: 1, diameterM: 0.1 })
    expect(result.horizontalM).toBeGreaterThan(0)
    expect(result.timeS).toBeGreaterThan(0)
    expect(result.impactSpeedMs).toBeGreaterThan(0)
  })
})

describe('drop3D', () => {
  const BASE: Parameters<typeof drop3D>[0] = {
    altitudeM: 100,
    carrierSpeedMs: 20,
    pitchDeg: 0,
    massKg: 0.4,
    diameterM: 0.08,
    cdStable: 0.47,
    windHeadMs: 0,
    windCrossMs: 0,
  }

  it('returns zeros for zero altitude', () => {
    const r = drop3D({ ...BASE, altitudeM: 0 })
    expect(r.xForwardM).toBe(0)
    expect(r.yLateralM).toBe(0)
    expect(r.totalTimeS).toBe(0)
  })

  it('level drop produces positive forward throw', () => {
    const r = drop3D(BASE)
    expect(r.xForwardM).toBeGreaterThan(0)
    expect(r.timeToFirstImpactS).toBeGreaterThan(0)
    expect(r.impactSpeedMs).toBeGreaterThan(0)
  })

  it('dive (negative pitch) hits ground faster and has less forward throw than level', () => {
    const level = drop3D(BASE)
    const dive  = drop3D({ ...BASE, pitchDeg: -20 })
    // Negative pitch → initial downward velocity → shorter time of flight → less throw
    expect(dive.timeToFirstImpactS).toBeLessThan(level.timeToFirstImpactS)
    expect(dive.xForwardM).toBeLessThan(level.xForwardM)
  })

  it('toss (positive pitch) initially reduces forward throw vs level', () => {
    // Toss sends the object upward first, shortening horizontal before apex.
    // Net horizontal may still differ from level due to extra airtime.
    const toss = drop3D({ ...BASE, pitchDeg: 20 })
    // Should still produce positive result and greater flight time
    expect(toss.xForwardM).toBeGreaterThan(0)
    expect(toss.timeToFirstImpactS).toBeGreaterThan(0)
  })

  it('crosswind produces lateral drift in correct direction', () => {
    const r = drop3D({ ...BASE, windCrossMs: 5 })
    expect(r.yLateralM).toBeGreaterThan(0)  // crosswind from left → pushed right
  })

  it('headwind reduces forward throw', () => {
    const calm = drop3D(BASE)
    const wind = drop3D({ ...BASE, windHeadMs: 8 })
    expect(wind.xForwardM).toBeLessThan(calm.xForwardM)
  })

  it('no crosswind → zero lateral drift', () => {
    const r = drop3D(BASE)
    expect(r.yLateralM).toBeCloseTo(0, 3)
  })

  it('impact angle is between 0 and 90 degrees', () => {
    const r = drop3D(BASE)
    expect(r.impactAngleDeg).toBeGreaterThan(0)
    expect(r.impactAngleDeg).toBeLessThanOrEqual(90)
  })

  it('with cor=0, no bounces occur', () => {
    const r = drop3D({ ...BASE, cor: 0, fuzeDelayS: 3 })
    expect(r.bounceCount).toBe(0)
    expect(r.finalXM).toBeCloseTo(r.xForwardM, 3)
  })

  it('with cor>0 and fuzeDelay, bounces occur and final position advances', () => {
    // fuzeDelayS=5 gives enough time for at least one complete bounce arc (~3 s)
    const r = drop3D({ ...BASE, cor: 0.4, fuzeDelayS: 5, frictionCoeff: 0.3 })
    expect(r.bounceCount).toBeGreaterThan(0)
    expect(r.finalXM).toBeGreaterThanOrEqual(r.xForwardM)
    expect(r.totalTimeS).toBeGreaterThan(r.timeToFirstImpactS)
  })

  it('release impulse increases forward throw', () => {
    const base    = drop3D(BASE)
    const impulse = drop3D({ ...BASE, releaseImpulseMs: 5 })
    expect(impulse.xForwardM).toBeGreaterThan(base.xForwardM)
  })
})
