import { describe, it, expect } from 'vitest'
import { windAtAltitude, TerrainRoughness } from '../wind-profile'

describe('windAtAltitude', () => {
  it('open-grass 500m: 5 m/s @ 10m → ~8.37 m/s (WMO reference case)', () => {
    const r = windAtAltitude({
      referenceWindSpeedMs: 5,
      referenceHeightM: 10,
      targetAltitudeM: 500,
      z0: TerrainRoughness.OpenGrass,
    })
    expect(r.windSpeedMs).toBeGreaterThan(8.0)
    expect(r.windSpeedMs).toBeCloseTo(8.37, 1)
  })

  it('wind increases monotonically with altitude', () => {
    const z100 = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 100,  z0: TerrainRoughness.OpenGrass })
    const z300 = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 300,  z0: TerrainRoughness.OpenGrass })
    const z500 = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 500,  z0: TerrainRoughness.OpenGrass })
    expect(z300.windSpeedMs).toBeGreaterThan(z100.windSpeedMs)
    expect(z500.windSpeedMs).toBeGreaterThan(z300.windSpeedMs)
  })

  it('at reference height the speed is unchanged', () => {
    const r = windAtAltitude({ referenceWindSpeedMs: 7, referenceHeightM: 10, targetAltitudeM: 10, z0: TerrainRoughness.Water })
    expect(r.windSpeedMs).toBeCloseTo(7, 2)
    expect(r.amplificationFactor).toBeCloseTo(1, 3)
    expect(r.deltaMs).toBeCloseTo(0, 2)
  })

  it('rougher terrain → higher extrapolated wind at altitude (larger log amplification factor)', () => {
    // Physics: for the same 10m reference speed, rough terrain suppresses near-surface wind
    // more — so the log profile must amplify MORE to reach altitude. z0=Forest(0.5) > z0=Water(0.0002)
    // amplification = ln(z/z0)/ln(zref/z0): larger z0 → smaller denominator → larger ratio
    const overWater  = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 100, z0: TerrainRoughness.Water })
    const overForest = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 100, z0: TerrainRoughness.Forest })
    expect(overForest.windSpeedMs).toBeGreaterThan(overWater.windSpeedMs)
  })

  it('urban terrain amplifies more than open sea at 300m (same 10m reference)', () => {
    // Same reason: z0=City(2.0) has a much steeper profile gradient than z0=Water(0.0002)
    const sea  = windAtAltitude({ referenceWindSpeedMs: 10, targetAltitudeM: 300, z0: TerrainRoughness.Water })
    const city = windAtAltitude({ referenceWindSpeedMs: 10, targetAltitudeM: 300, z0: TerrainRoughness.City })
    expect(city.windSpeedMs).toBeGreaterThan(sea.windSpeedMs)
  })

  it('amplificationFactor > 1 above reference height', () => {
    const r = windAtAltitude({ referenceWindSpeedMs: 5, targetAltitudeM: 200, z0: TerrainRoughness.Crops })
    expect(r.amplificationFactor).toBeGreaterThan(1)
  })

  it('deltaMs matches windSpeedMs - referenceWindSpeedMs', () => {
    const ref = 6
    const r = windAtAltitude({ referenceWindSpeedMs: ref, targetAltitudeM: 400, z0: TerrainRoughness.Suburbs })
    expect(r.deltaMs).toBeCloseTo(r.windSpeedMs - ref, 1)
  })

  it('scales linearly with reference wind speed', () => {
    const r5  = windAtAltitude({ referenceWindSpeedMs: 5,  targetAltitudeM: 300, z0: TerrainRoughness.OpenGrass })
    const r10 = windAtAltitude({ referenceWindSpeedMs: 10, targetAltitudeM: 300, z0: TerrainRoughness.OpenGrass })
    // Precision 1 (±0.05) due to toFixed(2) rounding in both values
    expect(r10.windSpeedMs).toBeCloseTo(r5.windSpeedMs * 2, 1)
  })
})
