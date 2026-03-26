import { describe, it, expect } from 'vitest'
import { estimatePropellerNoise, sumPropellerNoise } from '../acoustic-signature'

// DJI Phantom-class reference: D=0.239 m, 6000 RPM, 4 blades, ~200 W, 10 m
// Published measurements: 70–75 dB(A) in multiple studies.
const phantom: Parameters<typeof estimatePropellerNoise>[0] = {
  diameterM: 0.239,
  rpm: 6000,
  blades: 4,
  shaftPowerW: 200,
  distanceM: 10,
  temperatureC: 15,
}

describe('estimatePropellerNoise', () => {
  it('Phantom-class at 10 m falls in published 70–75 dB(A) range', () => {
    const r = estimatePropellerNoise(phantom)
    expect(r.oasplDba).toBeGreaterThanOrEqual(70)
    expect(r.oasplDba).toBeLessThanOrEqual(75)
  })

  it('obeys inverse-square law: +6 dB when halving distance', () => {
    const r10 = estimatePropellerNoise(phantom)
    const r5  = estimatePropellerNoise({ ...phantom, distanceM: 5 })
    expect(r5.oasplDba - r10.oasplDba).toBeCloseTo(6, 0)
  })

  it('doubling distance reduces SPL by ~6 dB', () => {
    const r10 = estimatePropellerNoise(phantom)
    const r20 = estimatePropellerNoise({ ...phantom, distanceM: 20 })
    expect(r10.oasplDba - r20.oasplDba).toBeCloseTo(6, 0)
  })

  it('higher shaft power → higher SPL', () => {
    const low  = estimatePropellerNoise({ ...phantom, shaftPowerW: 100 })
    const high = estimatePropellerNoise({ ...phantom, shaftPowerW: 400 })
    expect(high.oasplDba).toBeGreaterThan(low.oasplDba)
    // Doubling power → +3 dB (10·log10 relation)
    const delta = estimatePropellerNoise({ ...phantom, shaftPowerW: 400 }).oasplDba
                - estimatePropellerNoise({ ...phantom, shaftPowerW: 200 }).oasplDba
    expect(delta).toBeCloseTo(3, 0)
  })

  it('higher RPM (higher tip speed / Mach) → higher SPL', () => {
    const slow = estimatePropellerNoise({ ...phantom, rpm: 4000 })
    const fast = estimatePropellerNoise({ ...phantom, rpm: 8000 })
    expect(fast.oasplDba).toBeGreaterThan(slow.oasplDba)
  })

  it('reports blade passage frequency correctly', () => {
    const r = estimatePropellerNoise(phantom) // 6000 RPM, 4 blades
    expect(r.bpfHz).toBeCloseTo(6000 / 60 * 4, 0) // 400 Hz
  })

  it('tip Mach is plausible for given prop', () => {
    const r = estimatePropellerNoise(phantom)
    expect(r.machTip).toBeGreaterThan(0.1)
    expect(r.machTip).toBeLessThan(0.5)
  })

  it('highMachWarning false for typical UAV speeds', () => {
    const r = estimatePropellerNoise(phantom)
    expect(r.highMachWarning).toBe(false)
  })

  it('highMachWarning true when tip speed approaches speed of sound', () => {
    // D=0.5 m, RPM=8000 → tipSpeed = π×0.5×(8000/60) ≈ 209 m/s, Mach ≈ 0.62
    const r = estimatePropellerNoise({ ...phantom, diameterM: 0.5, rpm: 8000 })
    // Mach at these params: π × 0.5 × 133 ≈ 209/340 ≈ 0.615 — below 0.65
    // Use even more extreme values:
    const r2 = estimatePropellerNoise({ ...phantom, diameterM: 0.6, rpm: 8000 })
    // tipSpeed = π×0.6×133 ≈ 251 m/s, Mach ≈ 0.74 → warning
    expect(r2.highMachWarning).toBe(true)
  })

  it('more blades → slightly lower SPL at same power', () => {
    const two  = estimatePropellerNoise({ ...phantom, blades: 2 })
    const four = estimatePropellerNoise({ ...phantom, blades: 4 })
    expect(four.oasplDba).toBeLessThan(two.oasplDba)
  })

  it('output is never negative', () => {
    const r = estimatePropellerNoise({ ...phantom, shaftPowerW: 1, distanceM: 1000 })
    expect(r.oasplDba).toBeGreaterThanOrEqual(0)
  })
})

describe('sumPropellerNoise', () => {
  it('empty array returns 0', () => {
    expect(sumPropellerNoise([])).toBe(0)
  })

  it('single level passes through', () => {
    expect(sumPropellerNoise([70])).toBeCloseTo(70, 1)
  })

  it('two equal sources add ~3 dB', () => {
    expect(sumPropellerNoise([70, 70])).toBeCloseTo(73, 0)
  })

  it('four equal sources add ~6 dB', () => {
    expect(sumPropellerNoise([70, 70, 70, 70])).toBeCloseTo(76, 0)
  })
})
