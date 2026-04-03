'use client'

import { useMemo, useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { round } from '@/lib/aero'
import { MOTORS, searchMotors, type MotorSpec } from '@/lib/motor-db'
import { getPropsByBrand, PROP_BRANDS, PROPS } from '@/lib/prop-db'
import {
  mapBatteryDraftToInput,
  type BatteryDraft,
} from '@/lib/power-contracts'
import {
  mapMotorDraftToInput,
  mapPropDraftToInput,
  mergeDraftNumber,
  type MotorDraft,
  type PropDraft,
} from '@/lib/propulsion-contracts'
import {
  computeThrustResult,
  suggestPropForMotor,
} from '@/lib/propulsion-physics'
import { MotorCard } from '@/components/calculators/propulsion/MotorCard'
import { PropellerCard } from '@/components/calculators/propulsion/PropellerCard'
import { ThrustResultCard } from '@/components/calculators/propulsion/ThrustResultCard'

type PropulsionState = {
  motor: MotorDraft
  prop: PropDraft
  batteryCells: number
  batteryVoltagePerCell: number
  autoSuggest: boolean
  motorQuery: string
  propBrand: string
}

const DEFAULT_STATE: PropulsionState = {
  motor: {
    kv: 920,
    riOhms: 0.05,
    i0A: 0.8,
    escMaxAmps: 60,
    statorDiameterMm: 28,
  },
  prop: {
    diameterIn: 12,
    pitchIn: 6,
    bladeCount: 2,
  },
  batteryCells: 4,
  batteryVoltagePerCell: 3.7,
  autoSuggest: true,
  motorQuery: '',
  propBrand: '',
}

const DEFAULT_BATTERY_DRAFT: BatteryDraft = {
  chemistry: 'LiPo',
  sCount: 4,
  pCount: 1,
  voltagePerCellV: 3.7,
  capacityMah: 4000,
  dischargeCRating: 30,
  loadCurrentA: 30,
  weightG: 500,
  cutoffPerCellV: 3.2,
}

export function PropulsionCalcContainer() {
  const [state, setState] = usePersistedState<PropulsionState>('propcalc.contract.v1', DEFAULT_STATE)
  const [motorResults, setMotorResults] = useState<MotorSpec[]>([])

  const voltageV = useMemo(() => {
    const draft: BatteryDraft = {
      ...DEFAULT_BATTERY_DRAFT,
      sCount: state.batteryCells,
      voltagePerCellV: state.batteryVoltagePerCell,
      loadCurrentA: state.motor.escMaxAmps,
    }
    return mapBatteryDraftToInput(draft, DEFAULT_BATTERY_DRAFT).packVoltageV
  }, [state.batteryCells, state.batteryVoltagePerCell, state.motor.escMaxAmps])

  const motorInput = useMemo(
    () => mapMotorDraftToInput(state.motor, DEFAULT_STATE.motor),
    [state.motor],
  )

  const propInput = useMemo(
    () => mapPropDraftToInput(state.prop, DEFAULT_STATE.prop),
    [state.prop],
  )

  const result = useMemo(
    () => computeThrustResult({ voltageV, motor: motorInput, prop: propInput }),
    [voltageV, motorInput, propInput],
  )

  function updateMotor<K extends keyof MotorDraft>(key: K, value: number) {
    setState((prev) => {
      const nextMotor = mergeDraftNumber(prev.motor, key, value)
      let nextProp = prev.prop

      if (key === 'kv' && prev.autoSuggest) {
        const suggestion = suggestPropForMotor({
          kv: typeof value === 'number' ? value : nextMotor.kv,
          voltageV,
          availableProps: PROPS,
        })
        const suggestedProp = suggestion ? PROPS.find((prop) => prop.id === suggestion) : null
        if (suggestedProp) {
          nextProp = {
            diameterIn: suggestedProp.diameterIn,
            pitchIn: suggestedProp.pitchIn,
            bladeCount: suggestedProp.blades,
          }
        }
      }

      return {
        ...prev,
        motor: nextMotor,
        prop: nextProp,
      }
    })
  }

  function updateProp<K extends keyof PropDraft>(key: K, value: number) {
    setState((prev) => ({ ...prev, prop: mergeDraftNumber(prev.prop, key, value) }))
  }

  function handleMotorQuery(query: string) {
    setState((prev) => ({ ...prev, motorQuery: query }))
    setMotorResults(searchMotors(query))
  }

  function inferStatorDiameter(motor: MotorSpec): number {
    const packed = `${motor.brand} ${motor.name}`.replace(/[^0-9]/g, '')
    if (packed.length < 4) return DEFAULT_STATE.motor.statorDiameterMm
    const statorMm = Number(packed.slice(0, 2))
    if (Number.isFinite(statorMm) && statorMm >= 8 && statorMm <= 80) return statorMm
    return DEFAULT_STATE.motor.statorDiameterMm
  }

  function applyMotor(motor: MotorSpec) {
    setState((prev) => {
      const next = {
        ...prev,
        motorQuery: `${motor.brand} ${motor.name}`,
        motor: {
          ...prev.motor,
          kv: motor.kv,
          riOhms: motor.ri,
          i0A: motor.i0,
          escMaxAmps: motor.maxW ? Math.max(10, round(motor.maxW / Math.max(voltageV, 1), 0)) : prev.motor.escMaxAmps,
          statorDiameterMm: inferStatorDiameter(motor),
        },
      }

      if (!next.autoSuggest) return next

      const suggestion = suggestPropForMotor({
        kv: motor.kv,
        voltageV,
        availableProps: PROPS,
      })
      const suggestedProp = suggestion ? PROPS.find((prop) => prop.id === suggestion) : null
      if (!suggestedProp) return next

      return {
        ...next,
        prop: {
          diameterIn: suggestedProp.diameterIn,
          pitchIn: suggestedProp.pitchIn,
          bladeCount: suggestedProp.blades,
        },
        propBrand: suggestedProp.brand,
      }
    })
    setMotorResults([])
  }

  function applyProp(id: string) {
    const prop = PROPS.find((item) => item.id === id)
    if (!prop) return
    setState((prev) => ({
      ...prev,
      prop: {
        diameterIn: prop.diameterIn,
        pitchIn: prop.pitchIn,
        bladeCount: prop.blades,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3 text-xs text-ecalc-muted">
        Battery voltage через PowerContracts: <span className="font-semibold text-ecalc-navy">{round(voltageV, 2)} В</span>
      </div>

      <MotorCard
        draft={state.motor}
        motorQuery={state.motorQuery}
        motorResults={motorResults}
        autoSuggest={state.autoSuggest}
        onMotorQueryChange={handleMotorQuery}
        onApplyMotor={applyMotor}
        onDraftChange={updateMotor}
        onAutoSuggestChange={(enabled) => setState((prev) => ({ ...prev, autoSuggest: enabled }))}
      />

      <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-4 space-y-3">
        <h4 className="text-sm font-semibold text-ecalc-navy">ESC Selector</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="propulsion-battery-cells" className="text-xs text-ecalc-muted">LiPo S</label>
            <input
              id="propulsion-battery-cells"
              type="number"
              min={1}
              max={14}
              className="h-10 w-full rounded-md border border-ecalc-border bg-white px-3 text-sm"
              value={state.batteryCells}
              onChange={(e) => setState((prev) => ({ ...prev, batteryCells: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="propulsion-vpc" className="text-xs text-ecalc-muted">V/cell</label>
            <input
              id="propulsion-vpc"
              type="number"
              step="0.01"
              min={3}
              max={4.4}
              className="h-10 w-full rounded-md border border-ecalc-border bg-white px-3 text-sm"
              value={state.batteryVoltagePerCell}
              onChange={(e) => setState((prev) => ({ ...prev, batteryVoltagePerCell: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="propulsion-esc" className="text-xs text-ecalc-muted">ESC max, A</label>
            <input
              id="propulsion-esc"
              type="number"
              min={1}
              max={400}
              className="h-10 w-full rounded-md border border-ecalc-border bg-white px-3 text-sm"
              value={state.motor.escMaxAmps}
              onChange={(e) => updateMotor('escMaxAmps', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <PropellerCard
        draft={state.prop}
        propBrand={state.propBrand}
        propList={getPropsByBrand(state.propBrand)}
        brands={PROP_BRANDS}
        onDraftChange={updateProp}
        onBrandChange={(value) => setState((prev) => ({ ...prev, propBrand: value }))}
        onApplyProp={applyProp}
      />

      <ThrustResultCard result={result} />

      <div className="text-[11px] text-ecalc-muted">
        Active motor DB entries: {MOTORS.length}. Якщо Overload Risk активний, зменьшіть KV, діаметр або напругу.
      </div>
    </div>
  )
}
