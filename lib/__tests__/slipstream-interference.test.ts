import { describe, it, expect } from 'vitest'
import { slipstreamInterferenceDrag } from '../slipstream-interference'

const base = {
  freestreamVelocityMs: 15,
  thrustN: 8,
  propDiameterM: 0.254,   // 10 inch
  density: 1.225,
  wettedAreaM2: 0.05,
  skinFrictionCoeff: 0.005,
}

describe('slipstreamInterferenceDrag', () => {
  it('zero added drag when gliding (thrust = 0)', () => {
    const r = slipstreamInterferenceDrag({ ...base, thrustN: 0 })
    expect(r.addedDragN).toBe(0)
    expect(r.addedPowerW).toBe(0)
    expect(r.dynamicPressureRatio).toBe(1)
    expect(r.slipstreamVelocityMs).toBe(base.freestreamVelocityMs)
  })

  it('slipstream velocity > freestream when thrust > 0', () => {
    const r = slipstreamInterferenceDrag(base)
    expect(r.slipstreamVelocityMs).toBeGreaterThan(base.freestreamVelocityMs)
  })

  it('dynamic pressure ratio > 1 when thrusting', () => {
    const r = slipstreamInterferenceDrag(base)
    expect(r.dynamicPressureRatio).toBeGreaterThan(1)
  })

  it('added drag is positive when thrusting', () => {
    const r = slipstreamInterferenceDrag(base)
    expect(r.addedDragN).toBeGreaterThan(0)
  })

  it('higher thrust → higher slipstream velocity (monotone)', () => {
    const low  = slipstreamInterferenceDrag({ ...base, thrustN: 4  })
    const high = slipstreamInterferenceDrag({ ...base, thrustN: 20 })
    expect(high.slipstreamVelocityMs).toBeGreaterThan(low.slipstreamVelocityMs)
    expect(high.addedDragN).toBeGreaterThan(low.addedDragN)
  })

  it('larger prop disk → lower slipstream velocity at same thrust', () => {
    const small = slipstreamInterferenceDrag({ ...base, propDiameterM: 0.20 })
    const large = slipstreamInterferenceDrag({ ...base, propDiameterM: 0.40 })
    expect(large.slipstreamVelocityMs).toBeLessThan(small.slipstreamVelocityMs)
  })

  it('addedPowerW = addedDragN × freestreamVelocityMs', () => {
    const r = slipstreamInterferenceDrag(base)
    expect(r.addedPowerW).toBeCloseTo(r.addedDragN * base.freestreamVelocityMs, 2)
  })

  it('motorCount=2 doubles disk area → lower slipstream speed vs single motor', () => {
    const single = slipstreamInterferenceDrag({ ...base, motorCount: 1 })
    const twin   = slipstreamInterferenceDrag({ ...base, motorCount: 2 })
    expect(twin.slipstreamVelocityMs).toBeLessThan(single.slipstreamVelocityMs)
  })

  it('static hover (V=0): slipstream velocity derived purely from thrust', () => {
    const r = slipstreamInterferenceDrag({ ...base, freestreamVelocityMs: 0 })
    // V_slip = sqrt(2T / (ρ A)): positive and finite
    expect(r.slipstreamVelocityMs).toBeGreaterThan(0)
    expect(Number.isFinite(r.slipstreamVelocityMs)).toBe(true)
    // addedPowerW = ΔD × 0 = 0
    expect(r.addedPowerW).toBe(0)
  })
})
