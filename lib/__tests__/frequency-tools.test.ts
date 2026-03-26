import { describe, it, expect } from 'vitest'
import {
  wavelengthFromFreq,
  freqFromWavelength,
  frequencyConvert,
  wifiChannelFreq24GHz,
  propellerSoundFreq,
  pwmFrequency,
  pwmPeriod,
  dopplerShift,
  lcResonance,
  rcCutoff,
  shannonCapacity,
  intermodulation,
  bandDesignation,
  antennaLengths,
} from '../frequency-tools'

const C = 299792458

describe('wavelengthFromFreq', () => {
  it('returns 0 for non-positive frequency', () => {
    expect(wavelengthFromFreq(0)).toBe(0)
    expect(wavelengthFromFreq(-1)).toBe(0)
  })

  it('2.4 GHz → ~0.125 m', () => {
    expect(wavelengthFromFreq(2.4e9)).toBeCloseTo(C / 2.4e9, 6)
  })
})

describe('freqFromWavelength', () => {
  it('returns 0 for non-positive wavelength', () => {
    expect(freqFromWavelength(0)).toBe(0)
  })

  it('is inverse of wavelengthFromFreq', () => {
    const freq = 915e6
    const lambda = wavelengthFromFreq(freq)
    expect(freqFromWavelength(lambda)).toBeCloseTo(freq, 0)
  })
})

describe('frequencyConvert', () => {
  it('1 GHz = 1000 MHz', () => {
    expect(frequencyConvert(1, 'GHz', 'MHz')).toBeCloseTo(1000, 6)
  })

  it('1 MHz = 1e3 kHz', () => {
    expect(frequencyConvert(1, 'MHz', 'kHz')).toBeCloseTo(1000, 6)
  })

  it('returns 0 for NaN input', () => {
    expect(frequencyConvert(NaN, 'Hz', 'kHz')).toBe(0)
  })
})

describe('wifiChannelFreq24GHz', () => {
  it('channel 1 → 2412 MHz', () => {
    expect(wifiChannelFreq24GHz(1)).toBe(2412)
  })

  it('channel 6 → 2437 MHz', () => {
    expect(wifiChannelFreq24GHz(6)).toBe(2437)
  })

  it('channel 14 → 2484 MHz', () => {
    expect(wifiChannelFreq24GHz(14)).toBe(2484)
  })

  it('invalid channel → 0', () => {
    expect(wifiChannelFreq24GHz(0)).toBe(0)
    expect(wifiChannelFreq24GHz(15)).toBe(0)
  })
})

describe('propellerSoundFreq', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(propellerSoundFreq(0, 3)).toBe(0)
    expect(propellerSoundFreq(6000, 0)).toBe(0)
  })

  it('6000 rpm × 3 blades = 300 Hz', () => {
    expect(propellerSoundFreq(6000, 3)).toBeCloseTo(300, 6)
  })
})

describe('pwmFrequency and pwmPeriod', () => {
  it('pwmFrequency = 1/period', () => {
    expect(pwmFrequency(0.02)).toBeCloseTo(50, 4)
  })

  it('pwmPeriod = 1/frequency', () => {
    expect(pwmPeriod(50)).toBeCloseTo(0.02, 6)
  })

  it('round-trip: period → freq → period', () => {
    const period = 0.02
    expect(pwmPeriod(pwmFrequency(period))).toBeCloseTo(period, 6)
  })

  it('returns 0 for non-positive input', () => {
    expect(pwmFrequency(0)).toBe(0)
    expect(pwmPeriod(0)).toBe(0)
  })
})

describe('dopplerShift', () => {
  it('returns 0 for non-positive base frequency', () => {
    expect(dopplerShift(0, 100)).toBe(0)
  })

  it('proportional to speed', () => {
    const f1 = dopplerShift(2.4e9, 100)
    const f2 = dopplerShift(2.4e9, 200)
    expect(f2).toBeCloseTo(f1 * 2, 6)
  })
})

describe('lcResonance', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(lcResonance(0, 1e-6)).toBe(0)
    expect(lcResonance(1e-3, 0)).toBe(0)
  })

  it('1 mH + 1 µF → 1/(2π√LC) ≈ 5033 Hz', () => {
    const result = lcResonance(1e-3, 1e-6)
    expect(result).toBeCloseTo(1 / (2 * Math.PI * Math.sqrt(1e-3 * 1e-6)), 0)
  })
})

describe('rcCutoff', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(rcCutoff(0, 1e-6)).toBe(0)
    expect(rcCutoff(1000, 0)).toBe(0)
  })

  it('1 kΩ + 1 µF → 159 Hz cutoff', () => {
    const result = rcCutoff(1000, 1e-6)
    expect(result).toBeCloseTo(1 / (2 * Math.PI * 1000 * 1e-6), 0)
  })
})

describe('shannonCapacity', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(shannonCapacity(0, 10)).toBe(0)
    expect(shannonCapacity(1e6, 0)).toBe(0)
  })

  it('doubles when SNR increases so that log2(1+SNR) doubles', () => {
    const c1 = shannonCapacity(1e6, 1)    // log2(2) = 1
    const c2 = shannonCapacity(1e6, 3)    // log2(4) = 2
    expect(c2).toBeCloseTo(c1 * 2, 4)
  })
})

describe('intermodulation', () => {
  it('returns 0 for non-positive frequencies', () => {
    expect(intermodulation(0, 2.4e9, { m: 2, n: -1 })).toBe(0)
  })

  it('|2×f1 - f2| with f1=100, f2=110 → 90', () => {
    expect(intermodulation(100e6, 110e6, { m: 2, n: -1 })).toBeCloseTo(90e6, 0)
  })
})

describe('bandDesignation', () => {
  it('returns Unknown for non-positive frequency', () => {
    expect(bandDesignation(0)).toBe('Unknown')
  })

  it('2.4 GHz → S-band', () => {
    expect(bandDesignation(2.4e9)).toContain('S-band')
  })

  it('900 MHz → UHF', () => {
    expect(bandDesignation(900e6)).toContain('UHF')
  })
})

describe('antennaLengths', () => {
  it('returns zeros for non-positive frequency', () => {
    const result = antennaLengths(0)
    expect(result.fullWaveMm).toBe(0)
  })

  it('half wave ≈ wavelength / 2 × velocity factor', () => {
    const freqMHz = 433
    const vf = 0.95
    const lambdaMm = 299792.458 / freqMHz
    const result = antennaLengths(freqMHz, vf)
    expect(result.halfWaveMm).toBeCloseTo((lambdaMm * vf) / 2, 2)
  })

  it('quarter wave = half wave / 2', () => {
    const result = antennaLengths(2400)
    expect(result.quarterWaveMm).toBeCloseTo(result.halfWaveMm / 2, 6)
  })
})
