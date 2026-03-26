import { describe, it, expect } from 'vitest'
import {
  estimateFlightTimeMinutes,
  estimateRangeKm,
  estimatePayloadKg,
  densityAndThrustFactor,
  isaAtAltitude,
  machFromTemperatureAndSpeed,
  estimateStaticThrustKg,
  estimateChargeTimeMinutes,
  convertUnit,
  batteryEnergyWh,
  frameDiagonalMm,
  propTipSpeed,
  maxKvForMach,
} from '../drone-tools'

describe('estimateFlightTimeMinutes', () => {
  it('returns 0 for non-positive current', () => {
    expect(estimateFlightTimeMinutes({ capacityMah: 5000, voltage: 22, currentA: 0, efficiency: 0.8 })).toBe(0)
  })

  it('returns positive minutes for valid input', () => {
    const t = estimateFlightTimeMinutes({ capacityMah: 5000, voltage: 22, currentA: 20, efficiency: 0.8 })
    expect(t).toBeGreaterThan(0)
  })

  it('doubles with double capacity', () => {
    const t1 = estimateFlightTimeMinutes({ capacityMah: 5000, voltage: 22, currentA: 20, efficiency: 0.8 })
    const t2 = estimateFlightTimeMinutes({ capacityMah: 10000, voltage: 22, currentA: 20, efficiency: 0.8 })
    expect(t2).toBeCloseTo(t1 * 2, 4)
  })
})

describe('estimateRangeKm', () => {
  it('returns 0 for negative speed', () => {
    expect(estimateRangeKm(-10, 30)).toBe(0)
  })

  it('calculates range = speed × time / 60', () => {
    expect(estimateRangeKm(60, 60)).toBeCloseTo(60, 4)
  })
})

describe('estimatePayloadKg', () => {
  it('returns 0 when thrust does not exceed weight', () => {
    expect(estimatePayloadKg({ totalThrustKg: 2, dryWeightKg: 3, reservePercent: 0 })).toBe(0)
  })

  it('calculates available payload correctly', () => {
    const payload = estimatePayloadKg({ totalThrustKg: 10, dryWeightKg: 3, reservePercent: 20 })
    // available = 10 × 0.8 = 8; payload = 8 - 3 = 5
    expect(payload).toBeCloseTo(5, 4)
  })
})

describe('densityAndThrustFactor', () => {
  it('thrust factor ~100% at sea level ISA', () => {
    const result = densityAndThrustFactor({ altitudeM: 0, temperatureC: 15 })
    expect(result.thrustFactorPercent).toBeCloseTo(100, 0)
  })

  it('thrust factor lower at high altitude', () => {
    const sea = densityAndThrustFactor({ altitudeM: 0, temperatureC: 15 })
    const high = densityAndThrustFactor({ altitudeM: 3000, temperatureC: 0 })
    expect(high.thrustFactorPercent).toBeLessThan(sea.thrustFactorPercent)
  })
})

describe('isaAtAltitude', () => {
  it('temperature at sea level is ~15°C', () => {
    const result = isaAtAltitude(0)
    expect(result.temperatureC).toBeCloseTo(15, 1)
  })

  it('pressure at sea level is ~1013.25 hPa', () => {
    const result = isaAtAltitude(0)
    expect(result.pressureHpa).toBeCloseTo(1013.25, 0)
  })

  it('temperature decreases with altitude', () => {
    const sea = isaAtAltitude(0)
    const high = isaAtAltitude(5000)
    expect(high.temperatureC).toBeLessThan(sea.temperatureC)
  })
})

describe('machFromTemperatureAndSpeed', () => {
  it('returns zero mach for zero speed', () => {
    const result = machFromTemperatureAndSpeed({ temperatureC: 15, speedKmh: 0 })
    expect(result.mach).toBeCloseTo(0, 6)
  })

  it('mach increases with speed at constant temperature', () => {
    const slow = machFromTemperatureAndSpeed({ temperatureC: 15, speedKmh: 100 })
    const fast = machFromTemperatureAndSpeed({ temperatureC: 15, speedKmh: 200 })
    expect(fast.mach).toBeGreaterThan(slow.mach)
  })

  it('returns 0 for below absolute zero temperature', () => {
    const result = machFromTemperatureAndSpeed({ temperatureC: -300, speedKmh: 100 })
    expect(result.mach).toBe(0)
  })
})

describe('estimateStaticThrustKg', () => {
  it('returns 0 for zero power', () => {
    expect(estimateStaticThrustKg({ powerW: 0, efficiency: 0.8 })).toBe(0)
  })

  it('scales with power', () => {
    const t1 = estimateStaticThrustKg({ powerW: 100, efficiency: 0.8 })
    const t2 = estimateStaticThrustKg({ powerW: 200, efficiency: 0.8 })
    expect(t2).toBeCloseTo(t1 * 2, 4)
  })
})

describe('estimateChargeTimeMinutes', () => {
  it('returns 0 for zero current', () => {
    expect(estimateChargeTimeMinutes(5000, 0)).toBe(0)
  })

  it('1C charge (5A for 5000mAh) → 60 minutes', () => {
    expect(estimateChargeTimeMinutes(5000, 5)).toBeCloseTo(60, 3)
  })
})

describe('convertUnit', () => {
  it('same unit returns same value', () => {
    expect(convertUnit(10, 'kg', 'kg')).toBe(10)
  })

  it('kg to lb: 1 kg ≈ 2.20462 lb', () => {
    expect(convertUnit(1, 'kg', 'lb')).toBeCloseTo(2.20462, 4)
  })

  it('lb to kg is inverse of kg to lb', () => {
    expect(convertUnit(2.20462, 'lb', 'kg')).toBeCloseTo(1, 3)
  })

  it('kmh to ms: 3.6 km/h = 1 m/s', () => {
    expect(convertUnit(3.6, 'kmh', 'ms')).toBeCloseTo(1, 6)
  })

  it('m to ft: 1m ≈ 3.28084 ft', () => {
    expect(convertUnit(1, 'm', 'ft')).toBeCloseTo(3.28084, 4)
  })
})

describe('batteryEnergyWh', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(batteryEnergyWh(0, 22)).toBe(0)
    expect(batteryEnergyWh(5000, 0)).toBe(0)
  })

  it('5000 mAh at 22 V = 110 Wh', () => {
    expect(batteryEnergyWh(5000, 22)).toBeCloseTo(110, 4)
  })
})

describe('frameDiagonalMm', () => {
  it('3-4-5 right triangle produces diagonal of 5', () => {
    expect(frameDiagonalMm(300, 400)).toBeCloseTo(500, 3)
  })

  it('square frame → diagonal = side × √2', () => {
    expect(frameDiagonalMm(200, 200)).toBeCloseTo(200 * Math.sqrt(2), 3)
  })
})

describe('propTipSpeed', () => {
  it('returns zero tip speed for non-positive inputs', () => {
    const result = propTipSpeed({ diameterIn: 0, rpm: 5000 })
    expect(result.tipSpeedMs).toBe(0)
    expect(result.warning).toBe('ok')
  })

  it('calculates tip speed correctly for 10in prop at 5000 rpm', () => {
    const { diameterIn, rpm } = { diameterIn: 10, rpm: 5000 }
    const expected = (rpm / 60) * Math.PI * (diameterIn * 0.0254)
    const result = propTipSpeed({ diameterIn, rpm })
    expect(result.tipSpeedMs).toBeCloseTo(expected, 3)
  })

  it('warns danger when mach ≥ 0.9', () => {
    // Large prop at very high RPM
    const result = propTipSpeed({ diameterIn: 20, rpm: 20_000 })
    expect(result.warning).toBe('danger')
  })
})

describe('maxKvForMach', () => {
  it('returns 0 for non-positive diameter or cells', () => {
    expect(maxKvForMach({ diameterIn: 0, sCells: 6 })).toBe(0)
    expect(maxKvForMach({ diameterIn: 10, sCells: 0 })).toBe(0)
  })

  it('larger diameter gives lower max KV', () => {
    const small = maxKvForMach({ diameterIn: 5, sCells: 6 })
    const large = maxKvForMach({ diameterIn: 10, sCells: 6 })
    expect(large).toBeLessThan(small)
  })
})
