import { round } from '@/lib/aero'
import type { MotorSpec } from '@/lib/motor-db'
import type { MotorDraft, PropDraft } from '@/lib/propulsion-contracts'
import { mergeDraftNumber } from '@/lib/propulsion-contracts'
import { suggestPropForMotor } from '@/lib/propulsion-physics'

type CatalogProp = {
  id: string
  brand: string
  diameterIn: number
  pitchIn: number
  blades: number
}

type PropulsionStateShape = {
  motor: MotorDraft
  prop: PropDraft
  batteryCells: number
  batteryVoltagePerCell: number
  autoSuggest: boolean
  motorQuery: string
  propBrand: string
}

export function syncBatteryFromIntegration<T extends Pick<PropulsionStateShape, 'batteryCells' | 'batteryVoltagePerCell'>>(
  prev: T,
  batteryCells: number,
  batteryVoltageV: number,
): T {
  const fromIntegrationCells = batteryCells
  const fromIntegrationVpc = batteryVoltageV / Math.max(1, fromIntegrationCells)

  if (
    prev.batteryCells === fromIntegrationCells &&
    Math.abs(prev.batteryVoltagePerCell - fromIntegrationVpc) < 0.01
  ) {
    return prev
  }

  return {
    ...prev,
    batteryCells: fromIntegrationCells,
    batteryVoltagePerCell: round(fromIntegrationVpc, 2),
  }
}

export function inferStatorDiameter(motor: MotorSpec, fallbackMm: number): number {
  const packed = `${motor.brand} ${motor.name}`.replace(/[^0-9]/g, '')
  if (packed.length < 4) return fallbackMm
  const statorMm = Number(packed.slice(0, 2))
  if (Number.isFinite(statorMm) && statorMm >= 8 && statorMm <= 80) return statorMm
  return fallbackMm
}

export function toPropDraft(prop: CatalogProp): PropDraft {
  return {
    diameterIn: prop.diameterIn,
    pitchIn: prop.pitchIn,
    bladeCount: prop.blades,
  }
}

function findSuggestedProp(
  kv: number,
  voltageV: number,
  availableProps: readonly CatalogProp[],
): CatalogProp | null {
  const suggestion = suggestPropForMotor({
    kv,
    voltageV,
    availableProps,
  })

  if (!suggestion) return null
  return availableProps.find((prop) => prop.id === suggestion) ?? null
}

export function applyMotorDraftChange(
  prev: PropulsionStateShape,
  key: keyof MotorDraft,
  value: number,
  voltageV: number,
  availableProps: readonly CatalogProp[],
): PropulsionStateShape {
  const nextMotor = mergeDraftNumber(prev.motor, key, value)
  let nextProp = prev.prop

  if (key === 'kv' && prev.autoSuggest) {
    const suggestedProp = findSuggestedProp(nextMotor.kv, voltageV, availableProps)
    if (suggestedProp) {
      nextProp = toPropDraft(suggestedProp)
    }
  }

  return {
    ...prev,
    motor: nextMotor,
    prop: nextProp,
  }
}

export function applyCatalogMotor(
  prev: PropulsionStateShape,
  motor: MotorSpec,
  voltageV: number,
  availableProps: readonly CatalogProp[],
  defaultStatorDiameterMm: number,
): PropulsionStateShape {
  const next: PropulsionStateShape = {
    ...prev,
    motorQuery: `${motor.brand} ${motor.name}`,
    motor: {
      ...prev.motor,
      kv: motor.kv,
      riOhms: motor.ri,
      i0A: motor.i0,
      escMaxAmps: motor.maxW
        ? Math.max(10, round(motor.maxW / Math.max(voltageV, 1), 0))
        : prev.motor.escMaxAmps,
      statorDiameterMm: inferStatorDiameter(motor, defaultStatorDiameterMm),
    },
  }

  if (!next.autoSuggest) return next

  const suggestedProp = findSuggestedProp(motor.kv, voltageV, availableProps)
  if (!suggestedProp) return next

  return {
    ...next,
    prop: toPropDraft(suggestedProp),
    propBrand: suggestedProp.brand,
  }
}
