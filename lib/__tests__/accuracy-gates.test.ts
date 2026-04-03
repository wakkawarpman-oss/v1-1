import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { airDensity, estimateOswald, parasitePowerW } from '@/lib/aero'
import { missionEndurance } from '@/lib/mission-planning'
import { effectiveEarthRadius, radioHorizonFull } from '@/lib/radio-horizon'
import { escPowerLoss, tempRise } from '@/lib/avionics-electronics'

type ToleranceType = 'percent' | 'absolute'
type GateType = 'hard-fail' | 'soft-report' | 'advisory'

type FixtureCase = {
  id: string
  metric: string
  module: string
  function: string
  input: Record<string, number>
  expected: {
    value: number
    unit: string
  }
  tolerance: {
    type: ToleranceType
    value: number
  }
}

type GroupFixture = {
  group: 'A' | 'B' | 'C' | 'D'
  description: string
  policy: {
    gate: GateType
    maxDriftPct?: number
    warnAbovePct?: number
    failAbovePct?: number
  }
  cases: FixtureCase[]
}

type EvaluatedCase = {
  group: 'A' | 'B' | 'C' | 'D'
  gate: GateType
  id: string
  metric: string
  expected: number
  actual: number
  delta: number
  driftPct: number
  toleranceType: ToleranceType
  toleranceValue: number
  withinTolerance: boolean
  policyPass: boolean
  softLevel: 'ok' | 'warn' | 'fail'
}

const FIXTURE_DIR = path.resolve(process.cwd(), 'lib/__tests__/fixtures/accuracy')
const FIXTURE_FILES = ['group-a.json', 'group-b.json', 'group-c.json', 'group-d.json']

function toFiniteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : NaN
}

function computeDriftPct(expected: number, actual: number): number {
  const denom = Math.abs(expected) > 1e-9 ? Math.abs(expected) : 1
  return (Math.abs(actual - expected) / denom) * 100
}

function compareWithinTolerance(expected: number, actual: number, type: ToleranceType, tolerance: number): boolean {
  if (type === 'absolute') {
    return Math.abs(actual - expected) <= tolerance
  }

  return computeDriftPct(expected, actual) <= tolerance
}

function loadFixtures(): GroupFixture[] {
  return FIXTURE_FILES.map((fileName) => {
    const fullPath = path.join(FIXTURE_DIR, fileName)
    const raw = fs.readFileSync(fullPath, 'utf-8')
    return JSON.parse(raw) as GroupFixture
  })
}

function evaluateCase(testCase: FixtureCase): number {
  const key = `${testCase.module}.${testCase.function}`

  switch (key) {
    case 'aero.airDensity': {
      const altitudeM = testCase.input.altitudeM ?? testCase.input.elevationM ?? 0
      const tempC = testCase.input.tempC ?? testCase.input.temperatureC ?? 15
      return airDensity(altitudeM, tempC)
    }

    case 'radio-horizon.radioHorizonDistanceKm': {
      const heightM = testCase.input.heightM ?? 0
      const kFactor = testCase.input.kFactor ?? 4 / 3
      const effectiveRadius = effectiveEarthRadius(kFactor)
      return radioHorizonFull(heightM, effectiveRadius) / 1000
    }

    case 'mission-planning.missionEndurance': {
      const result = missionEndurance({
        batteryMah: testCase.input.batteryMah ?? 0,
        avgCurrentA: testCase.input.avgCurrentA ?? 0,
        speedKmh: testCase.input.speedKmh ?? 0,
        usablePct: testCase.input.usablePct ?? 0,
        reservePct: testCase.input.reservePct ?? 0,
      })
      return result.flightTimeMin
    }

    case 'aero.estimateOswald': {
      const ar = testCase.input.ar ?? 0
      return estimateOswald(ar)
    }

    case 'aero.parasitePowerW':
    case 'aero.parasiteDrag': {
      return parasitePowerW({
        density: testCase.input.density ?? 0,
        speedMs: testCase.input.speedMs ?? 0,
        wingAreaM2: testCase.input.wingAreaM2 ?? 0,
        cd0: testCase.input.cd0 ?? 0,
      })
    }

    case 'avionics-electronics.tempRise': {
      const powerLossW = testCase.input.powerLossW ?? 0
      const thermalResistanceCPerW = testCase.input.thermalResistanceCPerW ?? 0
      return tempRise(powerLossW, thermalResistanceCPerW)
    }

    case 'avionics-electronics.escPowerLoss': {
      return escPowerLoss(
        testCase.input.currentA ?? 0,
        testCase.input.rdsOnOhm ?? 0,
        testCase.input.mosfetCount ?? 0,
      )
    }

    default:
      throw new Error(`Unsupported fixture function mapping: ${key}`)
  }
}

function reportResults(results: EvaluatedCase[]) {
  const rows = results.map((row) => ({
    group: row.group,
    gate: row.gate,
    id: row.id,
    metric: row.metric,
    expected: Number(row.expected.toFixed(6)),
    actual: Number(row.actual.toFixed(6)),
    delta: Number(row.delta.toFixed(6)),
    driftPct: Number(row.driftPct.toFixed(4)),
    tolerance: `${row.toleranceType}:${row.toleranceValue}`,
    policyPass: row.policyPass ? 'PASS' : 'FAIL',
    softLevel: row.softLevel,
    status: row.withinTolerance ? 'PASS' : 'DRIFT',
  }))

  // Console table gives CI-visible, sortable drift diagnostics.
  console.table(rows)
}

describe('accuracy gates fixtures runner', () => {
  test('loads all group fixtures', () => {
    const fixtures = loadFixtures()
    expect(fixtures).toHaveLength(4)
    const groups = new Set(fixtures.map((fixture) => fixture.group))
    expect(groups.has('A')).toBe(true)
    expect(groups.has('B')).toBe(true)
    expect(groups.has('C')).toBe(true)
    expect(groups.has('D')).toBe(true)
  })

  test('evaluates fixtures and hard-fails Group A on tolerance breach', () => {
    const fixtures = loadFixtures()
    const evaluated: EvaluatedCase[] = []

    for (const fixture of fixtures) {
      for (const testCase of fixture.cases) {
        const actual = toFiniteNumber(evaluateCase(testCase))
        expect(Number.isFinite(actual)).toBe(true)

        const expected = testCase.expected.value
        const delta = actual - expected
        const driftPct = computeDriftPct(expected, actual)
        const withinTolerance = compareWithinTolerance(
          expected,
          actual,
          testCase.tolerance.type,
          testCase.tolerance.value,
        )
        const policyPass =
          fixture.group !== 'A' ||
          fixture.policy.maxDriftPct === undefined ||
          driftPct <= fixture.policy.maxDriftPct

        let softLevel: 'ok' | 'warn' | 'fail' = 'ok'
        if (fixture.group !== 'A') {
          const failAbove = fixture.policy.failAbovePct
          const warnAbove = fixture.policy.warnAbovePct

          if (typeof failAbove === 'number' && driftPct > failAbove) {
            softLevel = 'fail'
          } else if (typeof warnAbove === 'number' && driftPct > warnAbove) {
            softLevel = 'warn'
          }
        }

        evaluated.push({
          group: fixture.group,
          gate: fixture.policy.gate,
          id: testCase.id,
          metric: testCase.metric,
          expected,
          actual,
          delta,
          driftPct,
          toleranceType: testCase.tolerance.type,
          toleranceValue: testCase.tolerance.value,
          withinTolerance,
          policyPass,
          softLevel,
        })
      }
    }

    reportResults(evaluated)

    const hardFailures = evaluated.filter(
      (row) => row.group === 'A' && (!row.withinTolerance || !row.policyPass),
    )
    const softWarnings = evaluated.filter((row) => row.group !== 'A' && row.softLevel === 'warn')
    const softFails = evaluated.filter((row) => row.group !== 'A' && row.softLevel === 'fail')

    if (softWarnings.length > 0 || softFails.length > 0) {
      console.warn(
        `[accuracy-gates] Soft gate signals: warn=${softWarnings.length}, fail=${softFails.length}. CI remains green by policy.`,
      )
    }

    expect(hardFailures).toHaveLength(0)
  })
})
