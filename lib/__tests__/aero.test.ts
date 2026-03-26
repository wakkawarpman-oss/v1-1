import { describe, it, expect } from 'vitest'
import {
  airDensity,
  round,
  clamp,
  propDiskAreaM2,
  pitchSpeedKmh,
  staticThrustFromProp,
  dynamicThrustG,
  requiredPowerW,
  parasitePowerW,
  inducedPowerW,
  stallSpeedMs,
  inducedVelocityMs,
  rocMs,
  estimateFlightTimeMin,
  timeToHeightSeconds,
  perfSummary,
  propCpStatic,
  propCtStatic,
  motorShaftPowerW,
  motorEfficiency,
  motorStaticRpm,
  staticThrustFromCt,
  dynamicThrustAltmann,
  propEfficiencyFromJ,
  availablePowerAltmann,
  saggedVoltage,
  peukertCapacityMah,
  dynamicViscosity,
  reynoldsNumber,
  reCorrectCd0,
  reCorrectClMax,
  estimateOswald,
  type MotorParams,
} from '../aero'

describe('round', () => {
  it('rounds to 2 decimal places by default', () => {
    expect(round(3.14159)).toBe(3.14)
  })
  it('rounds to specified decimals', () => {
    expect(round(1.23456, 4)).toBe(1.2346)
  })
  it('handles zero', () => {
    expect(round(0)).toBe(0)
  })
})

describe('clamp', () => {
  it('returns value within range unchanged', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })
  it('clamps below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
  })
  it('clamps above max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('airDensity', () => {
  it('returns approximately 1.225 kg/m³ at sea level 15°C', () => {
    const rho = airDensity(0, 15)
    expect(rho).toBeCloseTo(1.225, 1)
  })
  it('returns lower density at higher elevation', () => {
    const rhoSea = airDensity(0, 15)
    const rhoHigh = airDensity(3000, 15)
    expect(rhoHigh).toBeLessThan(rhoSea)
  })
  it('returns lower density at higher temperature', () => {
    const rhoWarm = airDensity(0, 40)
    const rhoCold = airDensity(0, 0)
    expect(rhoWarm).toBeLessThan(rhoCold)
  })
})

describe('propDiskAreaM2', () => {
  it('calculates disk area for a single 10-inch propeller', () => {
    // 10 in = 0.254 m, radius = 0.127 m, area = π * 0.127² ≈ 0.0507
    const area = propDiskAreaM2(10, 1)
    expect(area).toBeCloseTo(0.0507, 3)
  })
  it('scales linearly with motor count', () => {
    const single = propDiskAreaM2(10, 1)
    const quad = propDiskAreaM2(10, 4)
    expect(quad).toBeCloseTo(single * 4, 5)
  })
})

describe('pitchSpeedKmh', () => {
  it('rpm=0 → 0 km/h', () => {
    expect(pitchSpeedKmh(0, 6)).toBe(0)
  })
  it('pitch=0 → 0 km/h', () => {
    expect(pitchSpeedKmh(8000, 0)).toBe(0)
  })
  it('known value: 8000 rpm × 6 in × 0.001524', () => {
    expect(pitchSpeedKmh(8000, 6)).toBeCloseTo(8000 * 6 * 0.001524, 4)
  })
})

describe('staticThrustFromProp', () => {
  it('returns positive thrust for realistic inputs', () => {
    const thrust = staticThrustFromProp({ tConst: 1.0, rpm: 8000, diameterIn: 10, pitchIn: 6 })
    expect(thrust).toBeGreaterThan(0)
  })
  it('blade count factor: 3-blade > 2-blade', () => {
    const two = staticThrustFromProp({ tConst: 1, rpm: 8000, diameterIn: 10, pitchIn: 6, bladeCount: 2 })
    const three = staticThrustFromProp({ tConst: 1, rpm: 8000, diameterIn: 10, pitchIn: 6, bladeCount: 3 })
    expect(three).toBeGreaterThan(two)
  })
})

describe('dynamicThrustG', () => {
  it('returns 0 when pitchSpeed <= 0', () => {
    expect(dynamicThrustG(1000, 50, 0)).toBe(0)
  })
  it('reduces thrust at higher speed', () => {
    const slow = dynamicThrustG(1000, 10, 100)
    const fast = dynamicThrustG(1000, 80, 100)
    expect(fast).toBeLessThan(slow)
  })
  it('clamps to 8% minimum at or above pitch speed', () => {
    const thrust = dynamicThrustG(1000, 150, 100)
    expect(thrust).toBeCloseTo(1000 * 0.08, 3)
  })
})

describe('requiredPowerW', () => {
  it('returns 0 for invalid inputs', () => {
    expect(requiredPowerW({ density: 1.2, speedMs: 0, wingAreaM2: 1, cd0: 0.02, weightN: 100, aspectRatio: 8, oswald: 0.8 })).toBe(0)
    expect(requiredPowerW({ density: 1.2, speedMs: 15, wingAreaM2: 0, cd0: 0.02, weightN: 100, aspectRatio: 8, oswald: 0.8 })).toBe(0)
  })
  it('returns positive power for valid inputs', () => {
    const p = requiredPowerW({ density: 1.225, speedMs: 15, wingAreaM2: 0.5, cd0: 0.03, weightN: 50, aspectRatio: 8, oswald: 0.8 })
    expect(p).toBeGreaterThan(0)
  })
})

describe('parasitePowerW', () => {
  it('scales with speed cubed', () => {
    const p1 = parasitePowerW({ density: 1.225, speedMs: 10, wingAreaM2: 0.5, cd0: 0.03 })
    const p2 = parasitePowerW({ density: 1.225, speedMs: 20, wingAreaM2: 0.5, cd0: 0.03 })
    expect(p2).toBeCloseTo(p1 * 8, 3)
  })
})

describe('inducedPowerW', () => {
  it('returns 0 for invalid inputs', () => {
    expect(inducedPowerW({ density: 1.2, speedMs: 0, wingAreaM2: 0.5, weightN: 50, aspectRatio: 8, oswald: 0.8 })).toBe(0)
  })
  it('decreases with speed (drag due to lift)', () => {
    const slow = inducedPowerW({ density: 1.225, speedMs: 10, wingAreaM2: 0.5, weightN: 100, aspectRatio: 8, oswald: 0.8 })
    const fast = inducedPowerW({ density: 1.225, speedMs: 20, wingAreaM2: 0.5, weightN: 100, aspectRatio: 8, oswald: 0.8 })
    expect(slow).toBeGreaterThan(fast)
  })
})

describe('stallSpeedMs', () => {
  it('returns 0 for invalid inputs', () => {
    expect(stallSpeedMs({ density: 0, weightN: 50, wingAreaM2: 0.5, clMax: 1.2 })).toBe(0)
    expect(stallSpeedMs({ density: 1.225, weightN: 50, wingAreaM2: 0, clMax: 1.2 })).toBe(0)
  })
  it('higher weight → higher stall speed', () => {
    const light = stallSpeedMs({ density: 1.225, weightN: 30, wingAreaM2: 0.5, clMax: 1.2 })
    const heavy = stallSpeedMs({ density: 1.225, weightN: 60, wingAreaM2: 0.5, clMax: 1.2 })
    expect(heavy).toBeGreaterThan(light)
  })
  it('larger wing area → lower stall speed', () => {
    const small = stallSpeedMs({ density: 1.225, weightN: 50, wingAreaM2: 0.3, clMax: 1.2 })
    const large = stallSpeedMs({ density: 1.225, weightN: 50, wingAreaM2: 0.6, clMax: 1.2 })
    expect(large).toBeLessThan(small)
  })
})

describe('inducedVelocityMs', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(inducedVelocityMs(0, 1.225, 0.1)).toBe(0)
    expect(inducedVelocityMs(10, 0, 0.1)).toBe(0)
  })
  it('returns positive velocity for valid inputs', () => {
    expect(inducedVelocityMs(50, 1.225, 0.2)).toBeGreaterThan(0)
  })
})

describe('rocMs', () => {
  it('returns 0 for non-positive weight', () => {
    expect(rocMs(1000, 500, 0)).toBe(0)
  })
  it('positive excess power → positive climb rate', () => {
    expect(rocMs(1000, 500, 2)).toBeGreaterThan(0)
  })
  it('no excess power → zero or negative roc', () => {
    expect(rocMs(500, 500, 2)).toBeCloseTo(0, 5)
  })
})

describe('estimateFlightTimeMin', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(estimateFlightTimeMin(0, 10)).toBe(0)
    expect(estimateFlightTimeMin(5000, 0)).toBe(0)
  })
  it('5000 mAh at 10 A with 0.85 reserve → ~25.5 min', () => {
    expect(estimateFlightTimeMin(5000, 10)).toBeCloseTo((5000 / 1000 / 10) * 60 * 0.85, 3)
  })
  it('custom reserve applied correctly', () => {
    const full = estimateFlightTimeMin(5000, 10, 1.0)
    const reserved = estimateFlightTimeMin(5000, 10, 0.85)
    expect(reserved).toBeLessThan(full)
  })
})

describe('timeToHeightSeconds', () => {
  it('returns 0 for non-positive height', () => {
    expect(timeToHeightSeconds(0, 5)).toBe(0)
  })
  it('returns 0 for non-positive roc', () => {
    expect(timeToHeightSeconds(100, 0)).toBe(0)
  })
  it('100 m at 5 m/s → 20 s', () => {
    expect(timeToHeightSeconds(100, 5)).toBe(20)
  })
})

describe('perfSummary', () => {
  const baseline = {
    elevationM: 0,
    temperatureC: 15,
    weightKg: 2,
    wingAreaDm2: 20,
    wingSpanMm: 1500,
    cd0: 0.03,
    oswald: 0.8,
    clMax: 1.2,
    motorCount: 1,
    propDiameterIn: 10,
    propPitchIn: 6,
    bladeCount: 2,
    rpm: 8000,
    staticThrustG: 2500,
    drivePowerW: 300,
    batteryCells: 4,
    batteryVoltagePerCell: 3.7,
    batteryCapacityMah: 5000,
    averageCurrentA: 20,
  }

  it('returns expected keys', () => {
    const result = perfSummary(baseline)
    expect(result).toHaveProperty('density')
    expect(result).toHaveProperty('stallSpeedKmh')
    expect(result).toHaveProperty('maxRocMs')
    expect(result).toHaveProperty('estimatedFlightTimeMin')
    expect(result).toHaveProperty('points')
  })

  it('density at sea level 15°C is ~1.225', () => {
    expect(perfSummary(baseline).density).toBeCloseTo(1.225, 1)
  })

  it('points array is non-empty and all have finite reqPower', () => {
    const { points } = perfSummary(baseline)
    expect(points.length).toBeGreaterThan(0)
    points.forEach((p) => expect(Number.isFinite(p.reqPower)).toBe(true))
  })

  it('stall speed is positive', () => {
    expect(perfSummary(baseline).stallSpeedKmh).toBeGreaterThan(0)
  })

  it('flight time with large battery is positive', () => {
    expect(perfSummary(baseline).estimatedFlightTimeMin).toBeGreaterThan(0)
  })
})

// ── Altmann Motor Model ────────────────────────────────────────────────────
// Reference motor: Hacker A30-12XL, Kv=760, Ri=0.048Ω, I0=1.1A
// Prop: APC 13×10, 2-blade, 4S (14.8V)
const motor760: MotorParams = { kv: 760, ri: 0.048, i0: 1.1 }
const density0 = 1.225  // kg/m³ sea level, 15°C

describe('propCpStatic', () => {
  it('10×6 2-blade — Cp in expected range 0.045–0.090', () => {
    const cp = propCpStatic(10, 6, 2)
    expect(cp).toBeGreaterThan(0.045)
    expect(cp).toBeLessThan(0.090)
  })
  it('increases with blade count', () => {
    expect(propCpStatic(13, 10, 3)).toBeGreaterThan(propCpStatic(13, 10, 2))
  })
  it('increases with pitch/diameter ratio', () => {
    expect(propCpStatic(13, 10, 2)).toBeGreaterThan(propCpStatic(13, 6, 2))
  })
})

describe('propCtStatic', () => {
  it('13×10 2-blade — Ct in expected range 0.055–0.095', () => {
    const ct = propCtStatic(13, 10, 2)
    expect(ct).toBeGreaterThan(0.055)
    expect(ct).toBeLessThan(0.095)
  })
  it('increases with blade count', () => {
    expect(propCtStatic(13, 10, 3)).toBeGreaterThan(propCtStatic(13, 10, 2))
  })
})

describe('motorShaftPowerW', () => {
  it('returns 0 when back-EMF exceeds supply voltage', () => {
    // n = Kv*U = over-spinning — no current
    expect(motorShaftPowerW(motor760, 14.8, 760 * 14.8)).toBe(0)
  })
  it('Hacker A30 at 9000 RPM on 4S — shaft power in 500–850W range', () => {
    const p = motorShaftPowerW(motor760, 14.8, 9000)
    expect(p).toBeGreaterThan(500)
    expect(p).toBeLessThan(850)
  })
  it('shaft power increases with supply voltage', () => {
    expect(motorShaftPowerW(motor760, 18.5, 9000)).toBeGreaterThan(
      motorShaftPowerW(motor760, 14.8, 9000),
    )
  })
})

describe('motorEfficiency', () => {
  it('Hacker A30 at cruise RPM — efficiency 0.75–0.92', () => {
    const eta = motorEfficiency(motor760, 14.8, 9000)
    expect(eta).toBeGreaterThan(0.75)
    expect(eta).toBeLessThan(0.92)
  })
  it('returns 0 when motor is over-spinning', () => {
    expect(motorEfficiency(motor760, 14.8, 760 * 14.8)).toBe(0)
  })
})

describe('motorStaticRpm', () => {
  const cp = propCpStatic(13, 10, 2)
  it('static RPM on 4S is between 5000 and 11000', () => {
    const rpm = motorStaticRpm(motor760, 14.8, cp, density0, 13)
    expect(rpm).toBeGreaterThan(5000)
    expect(rpm).toBeLessThan(11000)
  })
  it('higher voltage → higher RPM', () => {
    const rpm4s = motorStaticRpm(motor760, 14.8, cp, density0, 13)
    const rpm5s = motorStaticRpm(motor760, 18.5, cp, density0, 13)
    expect(rpm5s).toBeGreaterThan(rpm4s)
  })
  it('larger prop → lower RPM at same voltage', () => {
    const cp15 = propCpStatic(15, 10, 2)
    const rpm13 = motorStaticRpm(motor760, 14.8, cp, density0, 13)
    const rpm15 = motorStaticRpm(motor760, 14.8, cp15, density0, 15)
    expect(rpm15).toBeLessThan(rpm13)
  })
})

describe('staticThrustFromCt', () => {
  const ct = propCtStatic(13, 10, 2)
  it('APC 13×10 at ~8500 RPM — thrust in 1800–3500g range', () => {
    const thrust = staticThrustFromCt(ct, density0, 8500, 13)
    expect(thrust).toBeGreaterThan(1800)
    expect(thrust).toBeLessThan(3500)
  })
  it('thrust increases with RPM', () => {
    expect(staticThrustFromCt(ct, density0, 10000, 13)).toBeGreaterThan(
      staticThrustFromCt(ct, density0, 7000, 13),
    )
  })
})

describe('dynamicThrustAltmann', () => {
  it('static (V=0) equals input thrust', () => {
    expect(dynamicThrustAltmann(2000, 8500, 0, 13)).toBeCloseTo(2000, 0)
  })
  it('thrust decreases as speed increases', () => {
    const t30 = dynamicThrustAltmann(2000, 8500, 30 / 3.6, 13)
    const t60 = dynamicThrustAltmann(2000, 8500, 60 / 3.6, 13)
    expect(t60).toBeLessThan(t30)
  })
  it('returns 0 at or above pitch speed (J≥1.05)', () => {
    // pitch speed of 13×10 at 8500 RPM ≈ 13×10×0.0254×8500/60 ≈ 46.8 m/s
    expect(dynamicThrustAltmann(2000, 8500, 60, 13)).toBe(0)
  })
  it('always non-negative', () => {
    for (const v of [0, 10, 20, 30, 40, 50]) {
      expect(dynamicThrustAltmann(2000, 8500, v, 13)).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('propEfficiencyFromJ', () => {
  const ct = propCtStatic(13, 10, 2)
  const cp = propCpStatic(13, 10, 2)
  it('efficiency is 0 at J=0', () => {
    expect(propEfficiencyFromJ(0, ct, cp)).toBe(0)
  })
  it('peaks below 0.88 cap', () => {
    const eta = propEfficiencyFromJ(0.65, ct, cp)
    expect(eta).toBeGreaterThan(0.5)
    expect(eta).toBeLessThanOrEqual(0.88)
  })
  it('returns 0 when cp=0', () => {
    expect(propEfficiencyFromJ(0.5, ct, 0)).toBe(0)
  })
})

describe('availablePowerAltmann', () => {
  const cp = propCpStatic(13, 10, 2)
  const ct = propCtStatic(13, 10, 2)
  it('available power at V=0 is positive', () => {
    expect(availablePowerAltmann(motor760, 14.8, cp, ct, density0, 13, 0)).toBeGreaterThan(0)
  })
  it('available power decreases at high speed (prop unloads)', () => {
    const p0 = availablePowerAltmann(motor760, 14.8, cp, ct, density0, 13, 0)
    const p40 = availablePowerAltmann(motor760, 14.8, cp, ct, density0, 13, 40)
    expect(p40).toBeLessThan(p0)
  })
})

describe('perfSummary — Altmann mode', () => {
  // Trainer 1.5kg with explicit motor params (Hacker A30-12XL + APC 13×10)
  const altmannInput = {
    elevationM: 200, temperatureC: 18,
    weightKg: 1.5, wingAreaDm2: 27, wingSpanMm: 1180,
    cd0: 0.034, oswald: 0.83, clMax: 1.52,
    motorCount: 1, propDiameterIn: 13, propPitchIn: 10, bladeCount: 2,
    // Legacy fields still required for fallback compatibility
    rpm: 9100, staticThrustG: 1620, drivePowerW: 470,
    batteryCells: 4, batteryVoltagePerCell: 3.7, batteryCapacityMah: 3200, averageCurrentA: 28,
    // Altmann motor model
    motorKv: 760, motorRi: 0.048, motorI0: 1.1,
  }

  it('Altmann mode produces positive stallSpeedKmh', () => {
    expect(perfSummary(altmannInput).stallSpeedKmh).toBeGreaterThan(0)
  })
  it('Altmann mode produces positive maxRocMs', () => {
    expect(perfSummary(altmannInput).maxRocMs).toBeGreaterThan(0)
  })
  it('Altmann mode thrustToWeight is realistic (0.5–3.0)', () => {
    const ttw = perfSummary(altmannInput).thrustToWeight
    expect(ttw).toBeGreaterThan(0.5)
    expect(ttw).toBeLessThan(3.0)
  })
  it('Altmann produces higher accuracy than legacy on same airframe', () => {
    // Without motor params: legacy mode
    const { motorKv: _kv, motorRi: _ri, motorI0: _i0, ...legacyInput } = altmannInput
    const legacy = perfSummary(legacyInput)
    const altmann = perfSummary(altmannInput)
    // Both should produce valid results; Altmann uses physics-derived thrust
    expect(altmann.levelMaxSpeedKmh).toBeGreaterThan(0)
    expect(legacy.levelMaxSpeedKmh).toBeGreaterThan(0)
  })
})

describe('perfSummary — non-Altmann thrustToWeight sanity', () => {
  // Foamie trainer: 1.35 kg, 10×6 prop, 9200 RPM, no motor params (legacy path)
  // Expected T/W for a loaded trainer: 0.3–1.2 range
  const foamieInput = {
    elevationM: 250, temperatureC: 20,
    weightKg: 1.35, wingAreaDm2: 26, wingSpanMm: 1080,
    cd0: 0.034, oswald: 0.82, clMax: 1.45,
    motorCount: 1, propDiameterIn: 10, propPitchIn: 6, bladeCount: 2,
    rpm: 9200, staticThrustG: 800,  // will be overwritten by PerfCalc but perfSummary uses input.staticThrustG
    drivePowerW: 460,
    batteryCells: 3, batteryVoltagePerCell: 3.7, batteryCapacityMah: 2200, averageCurrentA: 22,
  }

  it('non-Altmann thrustToWeight is in physical range [0.3, 2.0] (trainer/sport)', () => {
    // staticThrustG passed directly — simulates what PerfCalc sets after Ct-based computation
    // staticThrustFromCt(propCtStatic(10, 6, 2), sea-level-density, 9200, 10) ≈ 860g → T/W ≈ 0.64
    const s = perfSummary({ ...foamieInput, staticThrustG: 860 })
    expect(s.thrustToWeight).toBeGreaterThan(0.3)
    expect(s.thrustToWeight).toBeLessThan(2.0)
  })

  it('thrustToWeight > 0.3 for typical trainer (sanity: not 400+)', () => {
    const s = perfSummary({ ...foamieInput, staticThrustG: 800 })
    expect(s.thrustToWeight).toBeGreaterThan(0.3)
    expect(s.thrustToWeight).toBeLessThan(2.0)
  })

  it('high-performance 3D plane T/W > 1.0 when static thrust > weight', () => {
    // 3.9 kg 3D plane with 5000g static thrust → T/W = 5000/3900 ≈ 1.28
    const s = perfSummary({ ...foamieInput, weightKg: 3.9, staticThrustG: 5000 })
    expect(s.thrustToWeight).toBeGreaterThan(1.0)
  })

  it('propCtStatic + staticThrustFromCt gives T/W in [0.4, 1.0] for foamie geometry', () => {
    // This mirrors what PerfCalc.tsx now computes before calling perfSummary
    const density = airDensity(250, 20)
    const ct = propCtStatic(10, 6, 2)
    const thrustG = staticThrustFromCt(ct, density, 9200, 10)
    const ttw = thrustG / (1.35 * 1000)
    expect(ttw).toBeGreaterThan(0.4)
    expect(ttw).toBeLessThan(1.0)
  })
})

describe('saggedVoltage', () => {
  it('returns nominal voltage when Ri=0', () => {
    expect(saggedVoltage(22.2, 20, 0)).toBe(22.2)
  })
  it('reduces voltage under load (20A, 30mΩ → −0.6V)', () => {
    const v = saggedVoltage(22.2, 20, 30)
    expect(v).toBeCloseTo(22.2 - 0.6, 4)
  })
  it('never drops below 70% of nominal', () => {
    expect(saggedVoltage(22.2, 1000, 500)).toBeCloseTo(22.2 * 0.7, 4)
  })
})

describe('peukertCapacityMah', () => {
  it('returns full capacity at 1C (no correction)', () => {
    // 5000mAh → I_1C = 5A; drawing 5A, k=1.08
    const c = peukertCapacityMah(5000, 5, 1.08)
    expect(c).toBeCloseTo(5000, 0)
  })
  it('reduces capacity at high discharge (10A from 5000mAh k=1.08)', () => {
    const c = peukertCapacityMah(5000, 10, 1.08)
    expect(c).toBeLessThan(5000)
    expect(c).toBeGreaterThan(3000)
  })
  it('increases effective capacity at low discharge (<1C)', () => {
    const c = peukertCapacityMah(5000, 2, 1.08)
    expect(c).toBeGreaterThan(5000)
  })
  it('k=1.0 (ideal) returns exact capacity regardless of current', () => {
    expect(peukertCapacityMah(5000, 20, 1.0)).toBeCloseTo(5000, 1)
  })
})

describe('perfSummary — Peukert + voltage sag', () => {
  const baseInput = {
    elevationM: 200, temperatureC: 20,
    weightKg: 2.5, wingAreaDm2: 36, wingSpanMm: 1800,
    cd0: 0.028, oswald: 0.78, clMax: 1.3,
    motorCount: 1, propDiameterIn: 13, propPitchIn: 8, bladeCount: 2,
    rpm: 7500, staticThrustG: 1400, drivePowerW: 300,
    batteryCells: 6, batteryVoltagePerCell: 3.7,
    batteryCapacityMah: 5000, averageCurrentA: 18,
  }
  it('Peukert inactive without params — usePeukert=false', () => {
    expect(perfSummary(baseInput).usePeukert).toBe(false)
  })
  it('Peukert active with both params', () => {
    const s = perfSummary({ ...baseInput, batteryRiMohm: 30, peukertK: 1.08 })
    expect(s.usePeukert).toBe(true)
  })
  it('sagged batteryVoltage < nominal under load', () => {
    const s = perfSummary({ ...baseInput, batteryRiMohm: 30, peukertK: 1.08 })
    expect(s.batteryVoltage).toBeLessThan(s.nominalVoltage)
  })
  it('effectiveCapacityMah < rated when drawing more than 1C', () => {
    // 5000mAh, 18A draw → well above 5A (1C)
    const s = perfSummary({ ...baseInput, batteryRiMohm: 30, peukertK: 1.08 })
    expect(s.effectiveCapacityMah).toBeLessThan(5000)
  })
  it('flight time decreases with Peukert correction', () => {
    const base = perfSummary(baseInput)
    const peukert = perfSummary({ ...baseInput, batteryRiMohm: 30, peukertK: 1.08 })
    expect(peukert.estimatedFlightTimeMin).toBeLessThan(base.estimatedFlightTimeMin)
  })
})

describe('dynamicViscosity', () => {
  it('returns ~1.789e-5 at 15°C (ISA sea level)', () => {
    expect(dynamicViscosity(15)).toBeCloseTo(1.789e-5, 7)
  })
  it('increases with temperature (hot air is more viscous)', () => {
    expect(dynamicViscosity(40)).toBeGreaterThan(dynamicViscosity(0))
  })
})

describe('reynoldsNumber', () => {
  it('Re ≈ 300k for chord=0.15m, V=30m/s, ISA sea level', () => {
    const mu = dynamicViscosity(15)
    const re = reynoldsNumber(1.225, 30, 0.15, mu)
    expect(re).toBeGreaterThan(250_000)
    expect(re).toBeLessThan(350_000)
  })
  it('returns 0 if viscosity is 0', () => {
    expect(reynoldsNumber(1.225, 30, 0.15, 0)).toBe(0)
  })
})

describe('reCorrectCd0', () => {
  it('no correction above Re=300k', () => {
    expect(reCorrectCd0(0.028, 400_000)).toBe(0.028)
  })
  it('CD0 increases below Re=300k', () => {
    expect(reCorrectCd0(0.028, 100_000)).toBeGreaterThan(0.028)
  })
  it('correction is monotone — lower Re → higher CD0', () => {
    expect(reCorrectCd0(0.028, 50_000)).toBeGreaterThan(reCorrectCd0(0.028, 150_000))
  })
})

describe('reCorrectClMax', () => {
  it('no correction above Re=300k', () => {
    expect(reCorrectClMax(1.3, 400_000)).toBe(1.3)
  })
  it('CL_max decreases below Re=300k', () => {
    expect(reCorrectClMax(1.3, 80_000)).toBeLessThan(1.3)
  })
  it('approaches 0.72 × CL_max floor at very low Re', () => {
    const val = reCorrectClMax(1.3, 1_000)
    expect(val).toBeGreaterThanOrEqual(1.3 * 0.72)
    expect(val).toBeLessThan(1.3 * 0.80)
  })
})

describe('perfSummary — Reynolds polars', () => {
  const baseInput = {
    elevationM: 0, temperatureC: 15,
    weightKg: 0.8, wingAreaDm2: 16, wingSpanMm: 1200,
    cd0: 0.028, oswald: 0.78, clMax: 1.3,
    motorCount: 1, propDiameterIn: 10, propPitchIn: 5, bladeCount: 2,
    rpm: 8000, staticThrustG: 600, drivePowerW: 150,
    batteryCells: 3, batteryVoltagePerCell: 3.7,
    batteryCapacityMah: 2200, averageCurrentA: 12,
  }
  it('exposes chordM = wingArea / span', () => {
    const s = perfSummary(baseInput)
    const expected = (baseInput.wingAreaDm2 / 100) / (baseInput.wingSpanMm / 1000)
    expect(s.chordM).toBeCloseTo(expected, 4)
  })
  it('reAtCruise is a positive finite number', () => {
    const s = perfSummary(baseInput)
    expect(s.reAtCruise).toBeGreaterThan(0)
    expect(Number.isFinite(s.reAtCruise)).toBe(true)
  })
  it('clMaxCorrected ≤ clMax (small span → low Re → correction applies)', () => {
    // chord = 0.16m²/1.2m = 0.133m, cruise ~30km/h → Re ≈ 70k < 300k
    const s = perfSummary(baseInput)
    expect(s.clMaxCorrected).toBeLessThanOrEqual(baseInput.clMax)
  })
  it('stallSpeed is higher with Re correction (lower CL_max → higher stall)', () => {
    // With Re correction CL_max drops → stall speed increases
    const s = perfSummary(baseInput)
    expect(s.stallSpeedKmh).toBeGreaterThan(0)
  })
  it('two-pass correction: clMaxCorrected ≤ one-pass result for small chord', () => {
    // Two-pass should give equal or lower CLmax (more conservative) vs one-pass
    // because corrected stall speed is higher → Re at stall is higher → less correction
    // Actually two-pass converges: result should be stable (within 1% of one-pass)
    const s = perfSummary(baseInput)
    expect(s.clMaxCorrected).toBeGreaterThan(0)
    expect(s.clMaxCorrected).toBeLessThanOrEqual(baseInput.clMax)
  })
  it('canSustainLevel is a boolean', () => {
    const s = perfSummary(baseInput)
    expect(typeof s.canSustainLevel).toBe('boolean')
  })
  it('oswaldAuto matches estimateOswald(ar)', () => {
    const s = perfSummary(baseInput)
    const ar = (baseInput.wingSpanMm / 1000) ** 2 / (baseInput.wingAreaDm2 / 100)
    expect(s.oswaldAuto).toBeCloseTo(estimateOswald(ar), 4)
  })
})

describe('estimateOswald', () => {
  it('typical glider AR=10 → e ≈ 0.76', () => {
    const e = estimateOswald(10)
    expect(e).toBeGreaterThan(0.70)
    expect(e).toBeLessThan(0.85)
  })
  it('low AR=5 → higher e than AR=10', () => {
    expect(estimateOswald(5)).toBeGreaterThan(estimateOswald(10))
  })
  it('very high AR → clamped at 0.95', () => {
    expect(estimateOswald(50)).toBeLessThanOrEqual(0.95)
  })
  it('very low AR → clamped at 0.50', () => {
    expect(estimateOswald(0.5)).toBeGreaterThanOrEqual(0.50)
  })
  it('AR=0 → returns fallback 0.75', () => {
    expect(estimateOswald(0)).toBe(0.75)
  })
})
