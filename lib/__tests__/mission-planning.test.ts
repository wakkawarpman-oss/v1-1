import { describe, it, expect } from 'vitest'
import { missionEndurance, routeBatteryBudget } from '../mission-planning'

describe('missionEndurance', () => {
  it('returns zeros for invalid inputs', () => {
    const result = missionEndurance({ batteryMah: 0, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 20 })
    expect(result.flightTimeMin).toBe(0)
    expect(result.maxRangeKm).toBe(0)
    expect(result.tacticalRadiusKm).toBe(0)
  })

  it('calculates flight time correctly', () => {
    // 5000 mAh / 10A usable = 0.5 h at 80% = 0.4 h = 24 min
    const result = missionEndurance({ batteryMah: 5000, avgCurrentA: 10, speedKmh: 80, usablePct: 80, reservePct: 0 })
    expect(result.flightTimeMin).toBeCloseTo(24, 1)
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
