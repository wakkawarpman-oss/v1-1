import { describe, it, expect } from 'vitest'
import { batteryRemainingEst, missionEndurance, routeBatteryBudget } from '../mission-planning'

describe('missionEndurance', () => {
  it('returns zeros for invalid inputs', () => {
    const result = missionEndurance({ batteryMah: 0, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 20 })
    expect(result.flightTimeMin).toBe(0)
    expect(result.maxRangeKm).toBe(0)
    expect(result.tacticalRadiusKm).toBe(0)
  })

  it('calculates flight time correctly', () => {
    // conservative model applies power-chain + safety losses
    const result = missionEndurance({ batteryMah: 5000, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 0 })
    expect(result.flightTimeMin).toBeCloseTo(21, 1)
  })

  it('calculates tactical radius as half of transit range', () => {
    const result = missionEndurance({ batteryMah: 10000, avgCurrentA: 20, speedKmh: 100, usablePct: 100, reservePct: 0 })
    expect(result.tacticalRadiusKm).toBeCloseTo(result.maxRangeKm / 2, 1)
  })

  it('reserve reduces tactical radius', () => {
    const noReserve = missionEndurance({ batteryMah: 5000, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 0 })
    const withReserve = missionEndurance({ batteryMah: 5000, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 20 })
    expect(withReserve.tacticalRadiusKm).toBeLessThan(noReserve.tacticalRadiusKm)
  })
})

describe('batteryRemainingEst', () => {
  it('returns zeros for empty battery source', () => {
    const result = batteryRemainingEst({ totalMah: 0, avgCurrentA: 20, elapsedMinutes: 5 })
    expect(result.remainingMah).toBe(0)
    expect(result.remainingPct).toBe(0)
    expect(result.timeRemainingMin).toBe(0)
  })

  it('hits zero at full discharge boundary', () => {
    const result = batteryRemainingEst({ totalMah: 5000, avgCurrentA: 20, elapsedMinutes: 15 })
    expect(result.remainingMah).toBe(0)
    expect(result.remainingPct).toBe(0)
    expect(result.timeRemainingMin).toBe(0)
  })

  it('penalizes critical currents conservatively', () => {
    const nominal = batteryRemainingEst({ totalMah: 5000, avgCurrentA: 30, elapsedMinutes: 5 })
    const critical = batteryRemainingEst({ totalMah: 5000, avgCurrentA: 60, elapsedMinutes: 5 })
    expect(critical.remainingMah).toBeLessThan(nominal.remainingMah)
  })
})

describe('routeBatteryBudget', () => {
  it('returns infeasible for invalid inputs', () => {
    const result = routeBatteryBudget({ distanceKm: 0, speedKmh: 80, avgCurrentA: 10, batteryMah: 5000, reservePct: 20 })
    expect(result.isFeasible).toBe(false)
  })

  it('correctly calculates mAh used for a route', () => {
    // 10 km at 100 km/h = 0.1 h, at 20A = 2000 mAh
    const result = routeBatteryBudget({ distanceKm: 10, speedKmh: 100, avgCurrentA: 20, batteryMah: 5000, reservePct: 0 })
    expect(result.timeMin).toBeCloseTo(6, 1)
    expect(result.usedPct).toBeCloseTo(40, 1)
  })

  it('flags route as feasible when within budget', () => {
    const result = routeBatteryBudget({ distanceKm: 5, speedKmh: 100, avgCurrentA: 10, batteryMah: 5000, reservePct: 20 })
    expect(result.isFeasible).toBe(true)
  })

  it('flags route as infeasible when over budget', () => {
    const result = routeBatteryBudget({ distanceKm: 100, speedKmh: 100, avgCurrentA: 20, batteryMah: 3000, reservePct: 20 })
    expect(result.isFeasible).toBe(false)
  })
})
