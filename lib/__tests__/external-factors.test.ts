import { describe, it, expect } from 'vitest'
import {
  gustWindSpeed,
  eddyDissipationRate,
  magneticDeclination,
  airDensityMoist,
  potentialTemperature,
  cloudBaseHeight,
  visibilityKm,
  radioRefractivity,
  rainAttenuation,
  gpsSolarDelay,
  kpDescription,
  densityAltitude,
  vonKarmanSpectrum,
  soundSpeedHumidity,
  richardsonNumber,
  pblHeight,
  icingRate,
  solarIrradiance,
  pressureAltitudeIsa,
  radioHorizon,
} from '../external-factors'

describe('gustWindSpeed', () => {
  it('returns 0 for non-positive mean wind', () => {
    expect(gustWindSpeed(0, 2)).toBe(0)
  })
  it('returns 0 for non-positive sigma', () => {
    expect(gustWindSpeed(10, 0)).toBe(0)
  })
  it('mean + 1.5σ', () => {
    expect(gustWindSpeed(10, 2)).toBeCloseTo(13, 6)
  })
})

describe('eddyDissipationRate', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(eddyDissipationRate(0, 0, 0)).toBe(0)
  })
  it('returns positive EDR for valid inputs', () => {
    const edr = eddyDissipationRate(1, 1, 1, 533)
    expect(edr).toBeGreaterThan(0)
  })
})

describe('magneticDeclination', () => {
  it('returns 0 for non-finite inputs', () => {
    expect(magneticDeclination(NaN, 0, 2020)).toBe(0)
  })
  it('returns value in [-180, 180] range', () => {
    const dec = magneticDeclination(50, 30, 2024)
    expect(dec).toBeGreaterThanOrEqual(-180)
    expect(dec).toBeLessThanOrEqual(180)
  })
})

describe('airDensityMoist', () => {
  it('returns 0 for non-positive rhoDry', () => {
    expect(airDensityMoist(0, 0.01)).toBe(0)
  })
  it('returns 0 for non-finite humidity', () => {
    expect(airDensityMoist(1.2, NaN)).toBe(0)
  })
  it('density < dry density for positive humidity', () => {
    const dry = 1.225
    const moist = airDensityMoist(dry, 0.01)
    expect(moist).toBeLessThan(dry)
  })
})

describe('potentialTemperature', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(potentialTemperature(0, 1013)).toBe(0)
    expect(potentialTemperature(288, 0)).toBe(0)
  })
  it('returns same temperature at 1000 hPa', () => {
    expect(potentialTemperature(288.15, 1000)).toBeCloseTo(288.15, 3)
  })
})

describe('cloudBaseHeight', () => {
  it('returns 0 for non-finite inputs', () => {
    expect(cloudBaseHeight(NaN, 10)).toBe(0)
  })
  it('(T − Td) × 125', () => {
    expect(cloudBaseHeight(25, 15)).toBeCloseTo(1250, 6)
  })
  it('zero spread → 0 m cloud base', () => {
    expect(cloudBaseHeight(15, 15)).toBe(0)
  })
  it('dew > temp clamps to 0 (fog)', () => {
    expect(cloudBaseHeight(10, 12)).toBe(0)
  })
})

describe('visibilityKm', () => {
  it('returns 0 for non-positive extinction coefficient', () => {
    expect(visibilityKm(0)).toBe(0)
  })
  it('3 / σ formula', () => {
    expect(visibilityKm(0.5)).toBeCloseTo(6, 6)
  })
})

describe('radioRefractivity', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(radioRefractivity(0, 288, 10)).toBe(0)
  })
  it('returns positive value for valid inputs', () => {
    const n = radioRefractivity(1013, 288, 10)
    expect(n).toBeGreaterThan(0)
  })
})

describe('rainAttenuation', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(rainAttenuation(0, 1, 5)).toBe(0)
  })
  it('L-band (< 10 GHz): k=0.01, alpha=1', () => {
    // α=1, k=0.01: attenuation = 0.01 × 25 × 1 = 0.25
    expect(rainAttenuation(25, 1, 5)).toBeCloseTo(0.25, 6)
  })
  it('Ku-band (10–30 GHz): higher attenuation', () => {
    const low = rainAttenuation(25, 1, 5)
    const high = rainAttenuation(25, 1, 15)
    expect(high).toBeGreaterThan(low)
  })
  it('Ka-band (≥30 GHz): highest attenuation', () => {
    const ku = rainAttenuation(25, 1, 15)
    const ka = rainAttenuation(25, 1, 35)
    expect(ka).toBeGreaterThan(ku)
  })
})

describe('gpsSolarDelay', () => {
  it('returns 0 for non-positive kp', () => {
    expect(gpsSolarDelay(0)).toBe(0)
  })
  it('kp × 0.1', () => {
    expect(gpsSolarDelay(5)).toBeCloseTo(0.5, 6)
  })
})

describe('kpDescription', () => {
  it('returns unknown for NaN', () => {
    expect(kpDescription(NaN)).toBe('Невідомо')
  })
  it('calm for kp < 4', () => {
    expect(kpDescription(3)).toBe('Спокійна геомагнітна обстановка')
  })
  it('moderate storm for kp 4–5', () => {
    expect(kpDescription(5)).toBe('Помірна буря')
  })
  it('severe storm for kp 6–7', () => {
    expect(kpDescription(7)).toBe('Сильна буря')
  })
  it('extreme storm for kp >= 8', () => {
    expect(kpDescription(9)).toBe('Екстремальна буря')
  })
})

describe('densityAltitude', () => {
  it('returns 0 for non-finite inputs', () => {
    expect(densityAltitude(NaN, 15)).toBe(0)
  })
  it('ISA temp → pressure altitude unchanged', () => {
    expect(densityAltitude(1000, 15, 15)).toBeCloseTo(1000, 6)
  })
  it('hot day increases density altitude', () => {
    const hot = densityAltitude(1000, 35)
    expect(hot).toBeGreaterThan(1000)
  })
})

describe('vonKarmanSpectrum', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(vonKarmanSpectrum(0, 100, 0.01)).toBe(0)
  })
  it('returns positive value for valid inputs', () => {
    expect(vonKarmanSpectrum(2, 100, 0.01)).toBeGreaterThan(0)
  })
})

describe('soundSpeedHumidity', () => {
  it('returns 0 for non-finite inputs', () => {
    expect(soundSpeedHumidity(NaN, 0.01)).toBe(0)
  })
  it('~343 m/s at 20°C dry air', () => {
    const cs = soundSpeedHumidity(20, 0)
    expect(cs).toBeGreaterThan(340)
    expect(cs).toBeLessThan(350)
  })
})

describe('richardsonNumber', () => {
  it('returns 0 for non-positive gravity', () => {
    expect(richardsonNumber(0, 300, 1, 100, 5)).toBe(0)
  })
  it('returns 0 for non-positive deltaZ', () => {
    expect(richardsonNumber(9.81, 300, 1, 0, 5)).toBe(0)
  })
  it('returns Infinity for zero shear', () => {
    expect(richardsonNumber(9.81, 300, 1, 100, 0)).toBe(Infinity)
  })
  it('returns finite value for positive shear and buoyancy', () => {
    const ri = richardsonNumber(9.81, 300, 2, 100, 5)
    expect(Number.isFinite(ri)).toBe(true)
  })
})

describe('pblHeight', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(pblHeight(0, 1e-4)).toBe(0)
  })
  it('0.3 × ustar / f', () => {
    expect(pblHeight(0.5, 1e-4)).toBeCloseTo((0.3 * 0.5) / 1e-4, 0)
  })
})

describe('icingRate', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(icingRate(0, 10, 0.5)).toBe(0)
  })
  it('0.1 × LWC × speed × beta', () => {
    expect(icingRate(0.3, 50, 0.7)).toBeCloseTo(0.1 * 0.3 * 50 * 0.7, 6)
  })
})

describe('solarIrradiance', () => {
  it('returns 0 for non-positive i0', () => {
    expect(solarIrradiance(0, 0.7, 1.5, 30)).toBe(0)
  })
  it('returns 0 for non-positive tau', () => {
    expect(solarIrradiance(1361, 0, 1.5, 30)).toBe(0)
  })
  it('returns 0 for 90° zenith (horizon)', () => {
    expect(solarIrradiance(1361, 0.7, 1.5, 90)).toBeCloseTo(0, 3)
  })
  it('returns positive value for zenith = 0°', () => {
    expect(solarIrradiance(1361, 0.8, 1, 0)).toBeGreaterThan(0)
  })
})

describe('pressureAltitudeIsa', () => {
  it('returns 0 for non-positive pressure', () => {
    expect(pressureAltitudeIsa(0)).toBe(0)
  })
  it('sea level pressure returns ~0 m', () => {
    expect(pressureAltitudeIsa(1013.25)).toBeCloseTo(0, 0)
  })
  it('returns higher altitude for lower pressure', () => {
    const h5000 = pressureAltitudeIsa(540)
    expect(h5000).toBeGreaterThan(5000)
  })
})

describe('radioHorizon (external-factors)', () => {
  it('returns 0 for non-positive antenna height', () => {
    expect(radioHorizon(0, 313)).toBe(0)
  })
  it('returns positive range for valid inputs', () => {
    expect(radioHorizon(10, 313)).toBeGreaterThan(0)
  })
  it('higher antenna → longer horizon', () => {
    const low = radioHorizon(10, 313)
    const high = radioHorizon(100, 313)
    expect(high).toBeGreaterThan(low)
  })
})
