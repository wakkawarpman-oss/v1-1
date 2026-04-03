type Brand<T, B extends string> = T & { readonly __brand: B }

export type CapacityMAh = Brand<number, 'CapacityMAh'>
export type VoltageV = Brand<number, 'VoltageV'>
export type CurrentA = Brand<number, 'CurrentA'>
export type WeightG = Brand<number, 'WeightG'>
export type EnergyWh = Brand<number, 'EnergyWh'>
export type SeriesCount = Brand<number, 'SeriesCount'>
export type ParallelCount = Brand<number, 'ParallelCount'>
export type CRate = Brand<number, 'CRate'>

export type BatteryChemistry = 'LiPo' | 'Li-Ion'

export type BatteryDraft = {
  chemistry: BatteryChemistry
  sCount: number
  pCount: number
  voltagePerCellV: number
  capacityMah: number
  dischargeCRating: number
  loadCurrentA: number
  weightG: number
  cutoffPerCellV: number
}

export type PowerInput = {
  chemistry: BatteryChemistry
  sCount: SeriesCount
  pCount: ParallelCount
  voltagePerCellV: VoltageV
  packVoltageV: VoltageV
  capacityMah: CapacityMAh
  loadCurrentA: CurrentA
  dischargeCRating: CRate
  maxContinuousCurrentA: CurrentA
  weightG: WeightG
  cutoffPerCellV: VoltageV
  energyWh: EnergyWh
}

export const POWER_LIMITS = {
  sMin: 1,
  sMax: 14,
  pMin: 1,
  pMax: 12,
  voltagePerCellMin: 3.0,
  voltagePerCellMax: 4.4,
  capacityMahMin: 1,
  dischargeCMin: 0.1,
  dischargeCMax: 200,
  loadCurrentMin: 0,
  weightGMin: 1,
  cutoffVMin: 2.5,
  cutoffVMax: 4.0,
} as const

const CHEMISTRY_DEFAULTS: Record<BatteryChemistry, Pick<BatteryDraft, 'voltagePerCellV' | 'cutoffPerCellV' | 'dischargeCRating'>> = {
  LiPo: {
    voltagePerCellV: 3.7,
    cutoffPerCellV: 3.2,
    dischargeCRating: 45,
  },
  'Li-Ion': {
    voltagePerCellV: 3.6,
    cutoffPerCellV: 3.0,
    dischargeCRating: 15,
  },
}

function asFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return fallback
  return value
}

function finiteClamped(value: unknown, fallback: number, min: number, max = Number.POSITIVE_INFINITY): number {
  const base = asFiniteNumber(value, fallback)
  return Math.min(max, Math.max(min, base))
}

export function mapBatteryDraftToInput(draft: BatteryDraft, defaults: BatteryDraft): PowerInput {
  const sCount = finiteClamped(draft.sCount, defaults.sCount, POWER_LIMITS.sMin, POWER_LIMITS.sMax) as SeriesCount
  const pCount = finiteClamped(draft.pCount, defaults.pCount, POWER_LIMITS.pMin, POWER_LIMITS.pMax) as ParallelCount
  const voltagePerCellV = finiteClamped(
    draft.voltagePerCellV,
    defaults.voltagePerCellV,
    POWER_LIMITS.voltagePerCellMin,
    POWER_LIMITS.voltagePerCellMax,
  ) as VoltageV
  const capacityMah = finiteClamped(draft.capacityMah, defaults.capacityMah, POWER_LIMITS.capacityMahMin) as CapacityMAh
  const dischargeCRating = finiteClamped(
    draft.dischargeCRating,
    defaults.dischargeCRating,
    POWER_LIMITS.dischargeCMin,
    POWER_LIMITS.dischargeCMax,
  ) as CRate
  const loadCurrentA = finiteClamped(draft.loadCurrentA, defaults.loadCurrentA, POWER_LIMITS.loadCurrentMin) as CurrentA
  const weightG = finiteClamped(draft.weightG, defaults.weightG, POWER_LIMITS.weightGMin) as WeightG
  const cutoffPerCellV = finiteClamped(
    draft.cutoffPerCellV,
    defaults.cutoffPerCellV,
    POWER_LIMITS.cutoffVMin,
    POWER_LIMITS.cutoffVMax,
  ) as VoltageV

  const packVoltageV = (sCount * voltagePerCellV) as VoltageV
  const capacityAh = capacityMah / 1000
  const maxContinuousCurrentA = (capacityAh * dischargeCRating) as CurrentA
  const energyWh = (packVoltageV * capacityAh) as EnergyWh

  return {
    chemistry: draft.chemistry,
    sCount,
    pCount,
    voltagePerCellV,
    packVoltageV,
    capacityMah,
    loadCurrentA,
    dischargeCRating,
    maxContinuousCurrentA,
    weightG,
    cutoffPerCellV,
    energyWh,
  }
}

export function switchBatteryChemistry(prev: BatteryDraft, chemistry: BatteryChemistry): BatteryDraft {
  const chemistryDefaults = CHEMISTRY_DEFAULTS[chemistry]
  return {
    ...prev,
    chemistry,
    voltagePerCellV: chemistryDefaults.voltagePerCellV,
    cutoffPerCellV: chemistryDefaults.cutoffPerCellV,
    dischargeCRating: chemistryDefaults.dischargeCRating,
  }
}

export function mergeDraftNumber<T extends object, K extends keyof T>(
  prev: T,
  key: K,
  next: unknown,
): T {
  if (typeof next !== 'number' || Number.isNaN(next) || !Number.isFinite(next)) return prev
  return { ...prev, [key]: next }
}
