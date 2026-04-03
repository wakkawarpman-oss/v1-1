import { describe, expect, it } from 'vitest'
import {
  mapBatteryDraftToInput,
  mergeDraftNumber,
  switchBatteryChemistry,
  type BatteryDraft,
} from '../power-contracts'

const defaults: BatteryDraft = {
  chemistry: 'Li-Ion',
  sCount: 6,
  pCount: 1,
  voltagePerCellV: 3.6,
  capacityMah: 4000,
  dischargeCRating: 15,
  loadCurrentA: 25,
  weightG: 650,
  cutoffPerCellV: 3.0,
}

describe('power contracts', () => {
  it('maps invalid numbers to finite defaults and clamps hard limits', () => {
    const mapped = mapBatteryDraftToInput(
      {
        chemistry: 'Li-Ion',
        sCount: Number.NaN,
        pCount: Number.POSITIVE_INFINITY,
        voltagePerCellV: 9,
        capacityMah: -100,
        dischargeCRating: Number.NaN,
        loadCurrentA: -3,
        weightG: 0,
        cutoffPerCellV: 99,
      },
      defaults,
    )

    expect(mapped.sCount).toBe(6)
    expect(mapped.pCount).toBe(1)
    expect(mapped.voltagePerCellV).toBe(4.4)
    expect(mapped.capacityMah).toBe(1)
    expect(mapped.dischargeCRating).toBe(15)
    expect(mapped.loadCurrentA).toBe(0)
    expect(mapped.weightG).toBe(1)
    expect(mapped.cutoffPerCellV).toBe(4)
  })

  it('builds coherent derived electrical values', () => {
    const mapped = mapBatteryDraftToInput(
      {
        ...defaults,
        chemistry: 'LiPo',
        sCount: 4,
        pCount: 2,
        voltagePerCellV: 3.7,
        capacityMah: 5000,
        dischargeCRating: 40,
      },
      defaults,
    )

    expect(mapped.packVoltageV).toBe(14.8)
    expect(mapped.maxContinuousCurrentA).toBe(200)
    expect(mapped.energyWh).toBe(74)
  })

  it('switchBatteryChemistry atomically resets incompatible chemistry fields', () => {
    const liion = switchBatteryChemistry({
      ...defaults,
      chemistry: 'LiPo',
      voltagePerCellV: 3.7,
      cutoffPerCellV: 3.2,
      dischargeCRating: 45,
    }, 'Li-Ion')

    expect(liion.chemistry).toBe('Li-Ion')
    expect(liion.voltagePerCellV).toBe(3.6)
    expect(liion.cutoffPerCellV).toBe(3.0)
    expect(liion.dischargeCRating).toBe(15)
  })

  it('mergeDraftNumber keeps previous state for NaN and updates for finite numbers', () => {
    const prev = { ...defaults }

    const unchanged = mergeDraftNumber(prev, 'capacityMah', Number.NaN)
    expect(unchanged).toEqual(prev)

    const changed = mergeDraftNumber(prev, 'capacityMah', 5200)
    expect(changed.capacityMah).toBe(5200)
  })
})
