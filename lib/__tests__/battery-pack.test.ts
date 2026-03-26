import { describe, it, expect } from 'vitest'
import {
  batteryPack,
  hoverTimeFromPack,
  packMaxCurrent,
  cRate,
  packEnergyDensity,
  CELL_DATABASE,
} from '../battery-pack'

describe('batteryPack', () => {
  it('returns null for non-positive s or p', () => {
    expect(batteryPack({ s: 0, p: 2, cellId: 'molicel-p42a', loadCurrentA: 10 })).toBeNull()
    expect(batteryPack({ s: 2, p: 0, cellId: 'molicel-p42a', loadCurrentA: 10 })).toBeNull()
  })

  it('returns null for non-finite loadCurrentA', () => {
    expect(batteryPack({ s: 2, p: 2, cellId: 'molicel-p42a', loadCurrentA: NaN })).toBeNull()
  })

  it('calculates nominal voltage as S × cell nominal V', () => {
    const result = batteryPack({ s: 6, p: 1, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result).not.toBeNull()
    expect(result!.nominalVoltageV).toBeCloseTo(6 * 3.6, 4)
  })

  it('calculates charged voltage as S × 4.2', () => {
    const result = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result!.chargedVoltageV).toBeCloseTo(4 * 4.2, 4)
  })

  it('calculates cutoff voltage as S × 3.0', () => {
    const result = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result!.cutoffVoltageV).toBeCloseTo(4 * 3.0, 4)
  })

  it('calculates capacity as (P × mAh) / 1000', () => {
    const result = batteryPack({ s: 4, p: 2, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result!.capacityAh).toBeCloseTo((2 * 4200) / 1000, 4)
  })

  it('calculates energy = capacity × nominalV', () => {
    const result = batteryPack({ s: 4, p: 2, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result!.energyWh).toBeCloseTo(result!.capacityAh * result!.nominalVoltageV, 3)
  })

  it('sets loadIsOverSpec true when current per cell exceeds cell max', () => {
    // molicel-p42a maxContinuousA = 45; 1P at 50A → overSpec
    const result = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 50 })
    expect(result!.loadIsOverSpec).toBe(true)
  })

  it('sets loadIsOverSpec false when within cell spec', () => {
    const result = batteryPack({ s: 4, p: 2, cellId: 'molicel-p42a', loadCurrentA: 10 })
    expect(result!.loadIsOverSpec).toBe(false)
  })

  it('voltage under load is lower than nominal', () => {
    const result = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 30 })
    expect(result!.voltageUnderLoadV).toBeLessThan(result!.nominalVoltageV)
  })

  it('power loss increases with higher current', () => {
    const low = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 10 })
    const high = batteryPack({ s: 4, p: 1, cellId: 'molicel-p42a', loadCurrentA: 30 })
    expect(high!.powerLossW).toBeGreaterThan(low!.powerLossW)
  })

  it('uses custom cell when cellId is custom', () => {
    const result = batteryPack({
      s: 3, p: 1, cellId: 'custom',
      customCell: { capacityMah: 5000, nominalVoltageV: 3.8, weightG: 75, riMOhms: 10 },
      loadCurrentA: 5,
    })
    expect(result).not.toBeNull()
    expect(result!.capacityAh).toBeCloseTo(5.0, 3)
  })

  it('falls back to first cell for unknown cellId', () => {
    const result = batteryPack({ s: 4, p: 1, cellId: 'unknown-cell', loadCurrentA: 10 })
    expect(result).not.toBeNull()
    // Should use CELL_DATABASE[0]
    expect(result!.nominalVoltageV).toBeCloseTo(4 * CELL_DATABASE[0].nominalVoltageV, 4)
  })
})

describe('hoverTimeFromPack', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(hoverTimeFromPack({ auwKg: 0, efficiencyGW: 7, packCapacityAh: 10, voltageV: 22 })).toBe(0)
    expect(hoverTimeFromPack({ auwKg: 2, efficiencyGW: 0, packCapacityAh: 10, voltageV: 22 })).toBe(0)
  })

  it('returns positive minutes for valid input', () => {
    const t = hoverTimeFromPack({ auwKg: 2, efficiencyGW: 7, packCapacityAh: 10, voltageV: 22 })
    expect(t).toBeGreaterThan(0)
  })

  it('longer flight time with larger pack', () => {
    const small = hoverTimeFromPack({ auwKg: 2, efficiencyGW: 7, packCapacityAh: 5, voltageV: 22 })
    const large = hoverTimeFromPack({ auwKg: 2, efficiencyGW: 7, packCapacityAh: 10, voltageV: 22 })
    expect(large).toBeGreaterThan(small)
  })
})

describe('packMaxCurrent', () => {
  it('returns 0 for unknown cellId', () => {
    expect(packMaxCurrent(4, 2, 'nonexistent')).toBe(0)
  })

  it('returns cell maxContinuousA × P', () => {
    const result = packMaxCurrent(4, 3, 'molicel-p42a')
    expect(result).toBe(45 * 3)
  })
})

describe('cRate', () => {
  it('returns 0 for zero capacity', () => {
    expect(cRate(10, 0)).toBe(0)
  })

  it('calculates C-rate correctly', () => {
    expect(cRate(8.4, 4.2)).toBeCloseTo(2, 4)
  })
})

describe('packEnergyDensity', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(packEnergyDensity(0, 100)).toBe(0)
    expect(packEnergyDensity(100, 0)).toBe(0)
  })

  it('returns Wh/kg (energyWh / weightG × 1000)', () => {
    expect(packEnergyDensity(100, 400)).toBeCloseTo(250, 3)
  })
})
