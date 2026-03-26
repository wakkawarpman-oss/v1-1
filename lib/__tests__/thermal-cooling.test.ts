import { describe, it, expect } from 'vitest'
import { requiredDuctArea, totalHeatLoad } from '../thermal-cooling'

describe('requiredDuctArea', () => {
  it('25 W heat at 20 m/s, ΔT=50°C → duct ≈ 0.34 cm² (scale check)', () => {
    // 500 W ESC, η=0.95 → 25 W loss; cruise 20 m/s; ambient 30°C; max 80°C
    const r = requiredDuctArea({
      inputPowerW: 500,
      efficiency: 0.95,
      velocityMs: 20,
      density: 1.225,
      ambientTempC: 30,
      maxTempC: 80,
      ductEfficiency: 0.6,
    })
    expect(r.heatW).toBeCloseTo(25, 1)
    // Physical derivation: ṁ = 25/(1005×50) ≈ 4.98e-4 kg/s; A = 4.98e-4/(1.225×20×0.6) ≈ 3.38e-5 m² = 0.338 cm²
    expect(r.ductAreaCm2).toBeCloseTo(0.338, 1)
  })

  it('halving cruise speed doubles required area', () => {
    const fast = requiredDuctArea({ inputPowerW: 400, efficiency: 0.92, velocityMs: 20, density: 1.225, ambientTempC: 25, maxTempC: 75 })
    const slow = requiredDuctArea({ inputPowerW: 400, efficiency: 0.92, velocityMs: 10, density: 1.225, ambientTempC: 25, maxTempC: 75 })
    expect(slow.ductAreaCm2 / fast.ductAreaCm2).toBeCloseTo(2, 1)
  })

  it('higher heat load → proportionally larger duct', () => {
    const low  = requiredDuctArea({ inputPowerW: 200, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 20, maxTempC: 80 })
    const high = requiredDuctArea({ inputPowerW: 400, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 20, maxTempC: 80 })
    expect(high.ductAreaCm2 / low.ductAreaCm2).toBeCloseTo(2, 1)
  })

  it('wider temperature margin → smaller duct', () => {
    const tight = requiredDuctArea({ inputPowerW: 300, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 30, maxTempC: 60 })
    const wide  = requiredDuctArea({ inputPowerW: 300, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 20, maxTempC: 80 })
    expect(wide.ductAreaCm2).toBeLessThan(tight.ductAreaCm2)
  })

  it('ductAreaCm2 = ductAreaM2 × 10000', () => {
    const r = requiredDuctArea({ inputPowerW: 300, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 20, maxTempC: 70 })
    expect(r.ductAreaCm2).toBeCloseTo(r.ductAreaM2 * 10000, 3)
  })

  it('heatW = inputPowerW × (1 - efficiency)', () => {
    const r = requiredDuctArea({ inputPowerW: 600, efficiency: 0.94, velocityMs: 18, density: 1.225, ambientTempC: 25, maxTempC: 85 })
    expect(r.heatW).toBeCloseTo(600 * 0.06, 2)
  })

  it('throws when maxTempC ≤ ambientTempC', () => {
    expect(() =>
      requiredDuctArea({ inputPowerW: 300, efficiency: 0.9, velocityMs: 15, density: 1.225, ambientTempC: 80, maxTempC: 80 })
    ).toThrow()
  })

  it('throws when velocity is 0 (no ram-air flow)', () => {
    expect(() =>
      requiredDuctArea({ inputPowerW: 300, efficiency: 0.9, velocityMs: 0, density: 1.225, ambientTempC: 25, maxTempC: 75 })
    ).toThrow()
  })
})

describe('totalHeatLoad', () => {
  it('sums losses from multiple components', () => {
    const heat = totalHeatLoad([
      { inputPowerW: 500, efficiency: 0.95 },  // 25 W
      { inputPowerW: 50,  efficiency: 0.50 },  // 25 W
    ])
    expect(heat).toBeCloseTo(50, 2)
  })

  it('returns 0 for empty array', () => {
    expect(totalHeatLoad([])).toBe(0)
  })

  it('perfect efficiency produces zero heat', () => {
    expect(totalHeatLoad([{ inputPowerW: 500, efficiency: 1.0 }])).toBeCloseTo(0, 5)
  })
})
