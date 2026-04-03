import { describe, expect, it } from 'vitest'
import {
  computeElectricalPower,
  computeThrustResult,
  estimateMotorCurrent,
  evaluateMotorPropMatch,
  suggestPropForMotor,
} from '../propulsion-physics'
import { mapMotorDraftToInput, mapPropDraftToInput } from '../propulsion-contracts'
import { PROPS } from '../prop-db'

const motor = mapMotorDraftToInput(
  {
    kv: 920,
    riOhms: 0.05,
    i0A: 0.8,
    escMaxAmps: 60,
    statorDiameterMm: 28,
  },
  {
    kv: 920,
    riOhms: 0.05,
    i0A: 0.8,
    escMaxAmps: 60,
    statorDiameterMm: 28,
  },
)

const prop = mapPropDraftToInput(
  {
    diameterIn: 12,
    pitchIn: 6,
    bladeCount: 2,
  },
  {
    diameterIn: 12,
    pitchIn: 6,
    bladeCount: 2,
  },
)

describe('propulsion physics', () => {
  it('computes electrical power with guardrails', () => {
    expect(computeElectricalPower(0, 10)).toBe(0)
    expect(computeElectricalPower(14.8, 20)).toBeCloseTo(296, 3)
  })

  it('returns finite current and thrust result without NaN', () => {
    const current = estimateMotorCurrent({ voltageV: 14.8, motor, prop })
    expect(Number.isFinite(current)).toBe(true)
    expect(current).toBeGreaterThan(0)

    const result = computeThrustResult({ voltageV: 14.8, motor, prop })
    expect(Number.isFinite(result.thrustG)).toBe(true)
    expect(Number.isFinite(result.efficiencyGW)).toBe(true)
    expect(result.thrustG).toBeGreaterThan(0)
  })

  it('flags overload risk for incompatible motor/prop combinations', () => {
    const aggressiveProp = mapPropDraftToInput(
      { diameterIn: 20, pitchIn: 12, bladeCount: 4 },
      { diameterIn: 12, pitchIn: 6, bladeCount: 2 },
    )

    const match = evaluateMotorPropMatch({
      voltageV: 22.2,
      motor,
      prop: aggressiveProp,
      expectedCurrentA: 95,
    })

    expect(match.overheatRisk).not.toBe('none')
    expect(match.warnings.some((w) => w.includes('Overload Risk') || w.includes('Overheat Risk'))).toBe(true)
  })

  it('suggests prop id for auto-suggest flow', () => {
    const suggestion = suggestPropForMotor({
      kv: 900,
      voltageV: 14.8,
      availableProps: PROPS,
    })

    expect(typeof suggestion === 'string' || suggestion === null).toBe(true)
  })
})
