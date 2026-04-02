import { describe, it, expect } from 'vitest'
import {
  CELL_DB,
  LIPO_DB,
  peukertCapacityMah,
  peukertFlightTimeMin,
  estimatePeukertK,
} from '../battery-db'

// ── CELL_DB ───────────────────────────────────────────────────────────────────

describe('CELL_DB', () => {
  it('contains both 18650 and 21700 form factors', () => {
    const ff = new Set(CELL_DB.map((c) => c.formFactor))
    expect(ff.has('18650')).toBe(true)
    expect(ff.has('21700')).toBe(true)
  })

  it('every cell has positive capacity and maxContinuousA', () => {
    for (const c of CELL_DB) {
      expect(c.capacityMah).toBeGreaterThan(0)
      expect(c.maxContinuousA).toBeGreaterThan(0)
    }
  })

  it('peukertK is between 1.0 and 1.2 for all cells', () => {
    for (const c of CELL_DB) {
      expect(c.peukertK).toBeGreaterThanOrEqual(1.0)
      expect(c.peukertK).toBeLessThanOrEqual(1.2)
    }
  })

  it('molicel-p45b has lower Ri than molicel-p42a', () => {
    const p42a = CELL_DB.find((c) => c.id === 'molicel-p42a')!
    const p45b = CELL_DB.find((c) => c.id === 'molicel-p45b')!
    expect(p45b.riMOhms).toBeLessThan(p42a.riMOhms)
  })

  it('custom cell is present and has id=custom', () => {
    expect(CELL_DB.some((c) => c.id === 'custom')).toBe(true)
  })
})

// ── LIPO_DB ───────────────────────────────────────────────────────────────────

describe('LIPO_DB', () => {
  it('contains 10 packs', () => {
    expect(LIPO_DB.length).toBe(10)
  })

  it('every pack has sCells >= 3', () => {
    for (const p of LIPO_DB) {
      expect(p.sCells).toBeGreaterThanOrEqual(3)
    }
  })

  it('cRating >= continuousC for every pack', () => {
    for (const p of LIPO_DB) {
      expect(p.cRating).toBeGreaterThanOrEqual(p.continuousC)
    }
  })
})

// ── peukertCapacityMah ────────────────────────────────────────────────────────

describe('peukertCapacityMah', () => {
  it('returns ratedMah when K = 1 (ideal battery)', () => {
    expect(peukertCapacityMah(4200, 10, 1.0)).toBeCloseTo(4200, 1)
  })

  it('returns ratedMah unchanged for zero/invalid inputs', () => {
    expect(peukertCapacityMah(0, 10, 1.05)).toBe(0)
    expect(peukertCapacityMah(4200, 0, 1.05)).toBe(4200)
    expect(peukertCapacityMah(4200, 10, 0)).toBe(4200)
  })

  it('capacity decreases at high C-rate (I > I_1C)', () => {
    const rated = 4200
    const i1c = rated / 1000  // 4.2 A
    const highCurrent = i1c * 10  // 42 A = 10C
    const eff = peukertCapacityMah(rated, highCurrent, 1.05)
    expect(eff).toBeLessThan(rated)
  })

  it('capacity increases at low C-rate (I < I_1C)', () => {
    const rated = 4200
    const i1c = rated / 1000  // 4.2 A
    const lowCurrent = i1c * 0.2  // 0.84 A
    const eff = peukertCapacityMah(rated, lowCurrent, 1.05)
    expect(eff).toBeGreaterThan(rated)
  })

  it('P42A at 10C: capacity is ~85% of rated (realistic degradation)', () => {
    const rated = 4200
    const i1c = rated / 1000  // 4.2 A
    const highCurrent = i1c * 10  // 42 A
    const eff = peukertCapacityMah(rated, highCurrent, 1.03)
    expect(eff / rated).toBeGreaterThan(0.80)
    expect(eff / rated).toBeLessThan(0.99)
  })
})

// ── peukertFlightTimeMin ──────────────────────────────────────────────────────

describe('peukertFlightTimeMin', () => {
  it('returns 0 for invalid inputs', () => {
    expect(peukertFlightTimeMin(0, 10, 1.05)).toBe(0)
    expect(peukertFlightTimeMin(4200, 0, 1.05)).toBe(0)
  })

  it('result is less than nominal (C/I × 60) due to 20% reserve', () => {
    const rated = 4200
    const current = 10
    const nominal = (rated / 1000 / current) * 60  // ~25.2 min
    const peukert = peukertFlightTimeMin(rated, current, 1.0)
    expect(peukert).toBeCloseTo(nominal * 0.8, 1)
  })

  it('higher current → shorter flight time', () => {
    const t_low  = peukertFlightTimeMin(4200, 5,  1.05)
    const t_high = peukertFlightTimeMin(4200, 20, 1.05)
    expect(t_high).toBeLessThan(t_low)
  })
})

// ── estimatePeukertK ──────────────────────────────────────────────────────────

describe('estimatePeukertK', () => {
  it('returns default 1.05 for identical currents', () => {
    expect(estimatePeukertK(10, 20, 10, 15)).toBe(1.05)
  })

  it('returns default 1.05 for zero inputs', () => {
    expect(estimatePeukertK(0, 20, 10, 15)).toBe(1.05)
  })

  it('ideal battery (linear time scaling) returns K ≈ 1', () => {
    // Ideal: t ∝ 1/I → t1/t2 = I2/I1
    // log(I2/I1) / log(I2/I1) = 1
    const K = estimatePeukertK(5, 40, 10, 20)
    expect(K).toBeCloseTo(1.0, 2)
  })

  it('typical Li-Ion returns K between 1.01 and 1.15', () => {
    // Simulate: at 5A → 38 min, at 20A → 8 min (Li-Ion degradation)
    const K = estimatePeukertK(5, 38, 20, 8)
    expect(K).toBeGreaterThan(1.01)
    expect(K).toBeLessThan(1.15)
  })
})
