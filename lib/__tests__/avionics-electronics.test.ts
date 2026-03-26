import { describe, it, expect } from 'vitest'
import {
  escPowerLoss,
  backupRuntime,
  voltageDrop,
  filterCapacitance,
  electricalFrequency,
  receiverSensitivity,
  dutyCycle,
  tempRise,
  calibrationTime,
} from '../avionics-electronics'

describe('escPowerLoss', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(escPowerLoss(0, 0.003, 3)).toBe(0)
    expect(escPowerLoss(10, 0, 3)).toBe(0)
    expect(escPowerLoss(10, 0.003, 0)).toBe(0)
  })

  it('P = I² × Rds / N', () => {
    // 30A, 3mΩ, 6 MOSFETs → I²×0.003/6 = 900×0.003/6 = 0.45 W
    expect(escPowerLoss(30, 0.003, 6)).toBeCloseTo(0.45, 4)
  })

  it('more MOSFETs → lower loss', () => {
    const single = escPowerLoss(30, 0.003, 1)
    const many = escPowerLoss(30, 0.003, 4)
    expect(many).toBeLessThan(single)
  })
})

describe('backupRuntime', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(backupRuntime(0, 12, 10)).toBe(0)
    expect(backupRuntime(10, 0, 10)).toBe(0)
    expect(backupRuntime(10, 12, 0)).toBe(0)
  })

  it('Ah × V / W = hours', () => {
    // 10 Ah × 12 V / 120 W = 1 hour
    expect(backupRuntime(10, 12, 120)).toBeCloseTo(1, 4)
  })
})

describe('voltageDrop', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(voltageDrop(0, 1, 1)).toBe(0)
  })

  it('increases with length', () => {
    const short = voltageDrop(10, 0.5, 1.5)
    const long = voltageDrop(10, 2, 1.5)
    expect(long).toBeGreaterThan(short)
  })

  it('decreases with larger cross-section', () => {
    const small = voltageDrop(10, 1, 1)
    const large = voltageDrop(10, 1, 4)
    expect(large).toBeLessThan(small)
  })
})

describe('filterCapacitance', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(filterCapacitance(0, 10_000, 0.1)).toBe(0)
    expect(filterCapacitance(10, 0, 0.1)).toBe(0)
    expect(filterCapacitance(10, 10_000, 0)).toBe(0)
  })

  it('C = I / (2 × f × ΔV)', () => {
    // 10A, 10kHz, 0.1V → 10 / (2 × 10000 × 0.1) = 5 mF
    expect(filterCapacitance(10, 10_000, 0.1)).toBeCloseTo(5e-3, 6)
  })
})

describe('electricalFrequency', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(electricalFrequency(0, 7)).toBe(0)
    expect(electricalFrequency(1800, 0)).toBe(0)
  })

  it('f_elec = RPM × poles / 60', () => {
    // 1800 RPM, 7 pole pairs → 1800 × 7 / 60 = 210 Hz
    expect(electricalFrequency(1800, 7)).toBeCloseTo(210, 4)
  })
})

describe('dutyCycle', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(dutyCycle(0, 12)).toBe(0)
    expect(dutyCycle(5, 0)).toBe(0)
  })

  it('V_motor / V_battery', () => {
    expect(dutyCycle(9, 12)).toBeCloseTo(0.75, 6)
  })

  it('100% duty for matching voltages', () => {
    expect(dutyCycle(12, 12)).toBeCloseTo(1, 6)
  })
})

describe('tempRise', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(tempRise(0, 10)).toBe(0)
    expect(tempRise(5, 0)).toBe(0)
  })

  it('ΔT = P_loss × R_th', () => {
    expect(tempRise(5, 8)).toBeCloseTo(40, 4)
  })
})

describe('calibrationTime', () => {
  it('returns 0 for non-positive bandwidth', () => {
    expect(calibrationTime(0)).toBe(0)
  })

  it('3τ where τ = 1/(2πBW)', () => {
    const bw = 1000
    const tau = 1 / (2 * Math.PI * bw)
    expect(calibrationTime(bw)).toBeCloseTo(3 * tau, 8)
  })
})

describe('receiverSensitivity', () => {
  it('returns 0 for non-positive temp or bandwidth', () => {
    expect(receiverSensitivity(0, 1e6, 5)).toBe(0)
    expect(receiverSensitivity(290, 0, 5)).toBe(0)
  })

  it('returns negative dBm for typical receiver', () => {
    const result = receiverSensitivity(290, 1e6, 5)
    // Typical sensitivity should be around -100 dBm
    expect(result).toBeLessThan(-50)
  })
})
