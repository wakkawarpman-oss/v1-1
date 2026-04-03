// ── Battery Pack Builder & Voltage Sag ───────────────────────────────────────
// Models a Li-ion/LiPo pack as ideal voltage source + series internal resistance.
// Each parallel branch shares current equally; series cells sum voltage drops.

import { CELL_DB, type CellSpec } from '@/lib/battery-db'

export type { CellSpec }

// Re-export unified cell database for backward compatibility
export const CELL_DATABASE = CELL_DB

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

function positiveOrFallback(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fallback
}

export type BatteryPackResult = {
  capacityAh: number
  nominalVoltageV: number
  chargedVoltageV: number        // 4.2 V × S
  cutoffVoltageV: number         // 3.0 V × S
  energyWh: number
  weightG: number                // cells + ~5% wiring overhead
  // Voltage sag at given load
  currentPerCellA: number
  voltageSagV: number
  voltageUnderLoadV: number
  loadIsOverSpec: boolean        // true if currentPerCell > cell maxContinuousA
  // Heat dissipation
  powerLossW: number
}

export function batteryPack(params: {
  s: number              // series cells
  p: number              // parallel cells
  cellId: string
  customCell?: Partial<CellSpec>
  loadCurrentA: number   // total pack current draw
}): BatteryPackResult | null {
  const { s, p, cellId, customCell, loadCurrentA } = params
  if (!isPositive(s) || !isPositive(p) || !Number.isFinite(loadCurrentA)) return null

  const base = CELL_DATABASE.find((c) => c.id === cellId) ?? CELL_DATABASE[0]
  const cell: CellSpec = cellId === 'custom'
    ? {
        ...base,
        capacityMah: positiveOrFallback(customCell?.capacityMah, base.capacityMah),
        nominalVoltageV: positiveOrFallback(customCell?.nominalVoltageV, base.nominalVoltageV),
        maxContinuousA: positiveOrFallback(customCell?.maxContinuousA, base.maxContinuousA),
        riMOhms: positiveOrFallback(customCell?.riMOhms, base.riMOhms),
        weightG: positiveOrFallback(customCell?.weightG, base.weightG),
      }
    : base

  const capacityAh = (p * cell.capacityMah) / 1000
  const nominalVoltageV = s * cell.nominalVoltageV
  const chargedVoltageV = s * 4.2
  const cutoffVoltageV = s * 3
  const energyWh = capacityAh * nominalVoltageV
  const weightG = s * p * cell.weightG * 1.05  // +5% wires & nickel strip

  const currentPerCellA = loadCurrentA / p
  const riOhms = cell.riMOhms / 1000
  // Voltage sag = S × (I_cell × Ri) — Ohm's law for series stack
  const voltageSagV = s * currentPerCellA * riOhms
  const voltageUnderLoadV = Math.max(0, nominalVoltageV - voltageSagV)
  const loadIsOverSpec = currentPerCellA > cell.maxContinuousA
  // Joule heating: P_loss = I_total² × (Ri / P) × S  → simplifies to same
  const powerLossW = Math.pow(loadCurrentA, 2) * (riOhms / p) * s

  return {
    capacityAh,
    nominalVoltageV,
    chargedVoltageV,
    cutoffVoltageV,
    energyWh,
    weightG,
    currentPerCellA,
    voltageSagV,
    voltageUnderLoadV,
    loadIsOverSpec,
    powerLossW,
  }
}

// Hover time from pack params (multirotor model: P_hover = AUW / eff_gW)
export function hoverTimeFromPack(params: {
  auwKg: number
  efficiencyGW: number   // g/W at hover thrust
  packCapacityAh: number
  voltageV: number
  dischargeLimit?: number  // fraction usable, default 0.8
}): number {
  const { auwKg, efficiencyGW, packCapacityAh, voltageV, dischargeLimit = 0.8 } = params
  if (!isPositive(auwKg) || !isPositive(efficiencyGW) || !isPositive(packCapacityAh) || !isPositive(voltageV)) return 0
  const auwG = auwKg * 1000
  const powerW = auwG / efficiencyGW
  const currentA = powerW / voltageV
  const usableAh = packCapacityAh * dischargeLimit
  return (usableAh / currentA) * 60   // minutes
}

// Maximum safe continuous current for full pack (accounting for cell limit)
export function packMaxCurrent(_s: number, p: number, cellId: string): number {
  // Series cell count does not affect max continuous current; only parallel branches matter.
  const cell = CELL_DATABASE.find((c) => c.id === cellId)
  if (!cell) return 0
  return cell.maxContinuousA * p
}

// C-rate: how many times capacity is drained per hour
export function cRate(currentA: number, capacityAh: number): number {
  if (!isPositive(capacityAh)) return 0
  return currentA / capacityAh
}

// Ohmic energy density of a pack (Wh/kg)
export function packEnergyDensity(energyWh: number, weightG: number): number {
  if (!isPositive(weightG) || !isPositive(energyWh)) return 0
  return (energyWh / weightG) * 1000   // Wh/kg
}

// ── LiPo Storage Voltage ──────────────────────────────────────────────────────
// Target: 3.85 V/cell. Returns mAh to add/remove and direction.
export function lipoStorageCharge(params: {
  currentVoltageV: number
  sCells: number
  capacityMah: number
}): { targetV: number; diffV: number; action: 'charge' | 'discharge' | 'ok'; mAhChange: number } {
  const { currentVoltageV, sCells, capacityMah } = params
  const STORAGE_PER_CELL = 3.85
  const FULL_PER_CELL = 4.2
  const EMPTY_PER_CELL = 3.0
  const targetV = STORAGE_PER_CELL * sCells
  const diffV = targetV - currentVoltageV
  const voltageRange = (FULL_PER_CELL - EMPTY_PER_CELL) * sCells
  const mAhChange = Math.abs((diffV / voltageRange) * capacityMah)
  return {
    targetV,
    diffV,
    action: Math.abs(diffV) < 0.05 * sCells ? 'ok' : diffV > 0 ? 'charge' : 'discharge',
    mAhChange,
  }
}

// ── AWG Wire Selector ─────────────────────────────────────────────────────────
// Returns recommended AWG, resistance per meter, and voltage drop.
const AWG_TABLE: { awg: number; maxA: number; mohmPerM: number }[] = [
  { awg: 8,  maxA: 73,  mohmPerM: 2.06 },
  { awg: 10, maxA: 55,  mohmPerM: 3.28 },
  { awg: 12, maxA: 41,  mohmPerM: 5.21 },
  { awg: 14, maxA: 32,  mohmPerM: 8.29 },
  { awg: 16, maxA: 22,  mohmPerM: 13.2 },
  { awg: 18, maxA: 16,  mohmPerM: 20.9 },
  { awg: 20, maxA: 11,  mohmPerM: 33.3 },
  { awg: 22, maxA: 7,   mohmPerM: 53.5 },
  { awg: 24, maxA: 3.5, mohmPerM: 84.2 },
]

export function awgSelector(params: {
  currentA: number
  lengthM: number
  voltageV: number
}): { awg: number; dropV: number; dropPct: number; resistance: number } | null {
  const { currentA, lengthM, voltageV } = params
  // Find the thinnest wire (highest AWG number) that can still carry the current —
  // i.e., the last entry in the table (sorted thick→thin) where maxA >= currentA.
  const adequate = AWG_TABLE.filter((r) => r.maxA >= currentA)
  const candidate = adequate[adequate.length - 1]
  if (!candidate) return null
  const resistance = (candidate.mohmPerM * lengthM * 2) / 1000  // Ohms, round-trip
  const dropV = currentA * resistance
  return { awg: candidate.awg, dropV, dropPct: (dropV / voltageV) * 100, resistance }
}

// ── Parallel Charge Safety ────────────────────────────────────────────────────
// Checks voltage difference between two packs before parallel connection.
export function parallelChargeSafety(params: {
  v1: number
  v2: number
  sCells: number
}): { diffV: number; diffPerCell: number; safe: boolean; risk: 'ok' | 'caution' | 'danger' } {
  const { v1, v2, sCells } = params
  const diffV = Math.abs(v1 - v2)
  const diffPerCell = diffV / sCells
  let risk: 'ok' | 'caution' | 'danger'
  if (diffPerCell < 0.1) risk = 'ok'
  else if (diffPerCell < 0.3) risk = 'caution'
  else risk = 'danger'
  return { diffV, diffPerCell, safe: risk !== 'danger', risk }
}
