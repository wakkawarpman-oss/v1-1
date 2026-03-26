const SPEED_OF_LIGHT = 299792458

function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

export function wavelengthFromFreq(freqHz: number) {
  if (!isPositive(freqHz)) return 0
  return SPEED_OF_LIGHT / freqHz
}

export function freqFromWavelength(wavelengthM: number) {
  if (!isPositive(wavelengthM)) return 0
  return SPEED_OF_LIGHT / wavelengthM
}

export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'THz'

export function frequencyConvert(value: number, fromUnit: FrequencyUnit, toUnit: FrequencyUnit) {
  const units: Record<FrequencyUnit, number> = {
    Hz: 1,
    kHz: 1e3,
    MHz: 1e6,
    GHz: 1e9,
    THz: 1e12,
  }

  if (!Number.isFinite(value)) return 0
  return (value * units[fromUnit]) / units[toUnit]
}

export function wifiChannelFreq24GHz(channel: number) {
  if (channel === 14) return 2484
  if (channel >= 1 && channel <= 13) return 2412 + (channel - 1) * 5
  return 0
}

export function propellerSoundFreq(rpm: number, bladeCount: number) {
  if (!isPositive(rpm) || !isPositive(bladeCount)) return 0
  return (rpm / 60) * bladeCount
}

export function pwmFrequency(periodSec: number) {
  if (!isPositive(periodSec)) return 0
  return 1 / periodSec
}

export function pwmPeriod(freqHz: number) {
  if (!isPositive(freqHz)) return 0
  return 1 / freqHz
}

export function dopplerShift(baseFreqHz: number, relativeSpeedMs: number) {
  if (!isPositive(baseFreqHz) || !Number.isFinite(relativeSpeedMs)) return 0
  return baseFreqHz * (relativeSpeedMs / SPEED_OF_LIGHT)
}

export function lcResonance(inductanceH: number, capacitanceF: number) {
  if (!isPositive(inductanceH) || !isPositive(capacitanceF)) return 0
  return 1 / (2 * Math.PI * Math.sqrt(inductanceH * capacitanceF))
}

export function rcCutoff(resistanceOhm: number, capacitanceF: number) {
  if (!isPositive(resistanceOhm) || !isPositive(capacitanceF)) return 0
  return 1 / (2 * Math.PI * resistanceOhm * capacitanceF)
}

export function shannonCapacity(bandwidthHz: number, snrLinear: number) {
  if (!isPositive(bandwidthHz) || !isPositive(snrLinear)) return 0
  return bandwidthHz * Math.log2(1 + snrLinear)
}

export function intermodulation(freq1Hz: number, freq2Hz: number, order: { m: number; n: number }) {
  if (!isPositive(freq1Hz) || !isPositive(freq2Hz) || !Number.isFinite(order.m) || !Number.isFinite(order.n)) return 0
  return Math.abs(order.m * freq1Hz + order.n * freq2Hz)
}

// ITU Radio Regulations + IEEE radar band designations
const BAND_TABLE: [number, string][] = [
  [3e3,   'VLF (< 3 kHz)'],
  [30e3,  'LF (3–30 kHz)'],
  [300e3, 'MF (30–300 kHz)'],
  [3e6,   'HF (0.3–3 MHz)'],
  [30e6,  'HF (3–30 MHz)'],
  [300e6, 'VHF (30–300 MHz)'],
  [1e9,   'UHF (300–1000 MHz)'],
  [2e9,   'UHF / L-band (1–2 GHz)'],
  [4e9,   'S-band (2–4 GHz)'],
  [8e9,   'C-band (4–8 GHz)'],
  [12e9,  'X-band (8–12 GHz)'],
  [18e9,  'Ku-band (12–18 GHz)'],
  [27e9,  'K-band (18–27 GHz)'],
  [40e9,  'Ka-band (27–40 GHz)'],
  [75e9,  'V-band (40–75 GHz)'],
  [110e9, 'W-band (75–110 GHz)'],
  [300e9, 'EHF / mmWave'],
]

export function bandDesignation(freqHz: number) {
  if (!isPositive(freqHz)) return 'Unknown'
  return BAND_TABLE.find(([max]) => freqHz < max)?.[1] ?? 'THz / sub-mm'
}

// ── Antenna Length Calculator ────────────────────────────────────────────────────
// Physical length of dipole antenna elements with velocity factor
// λ_eff = (λ_free / vf)  — for copper wire vf ≈ 0.95
// Full-wave: L = λ_eff;  Half-wave: L = λ_eff / 2;  Quarter-wave: L = λ_eff / 4
export type AntennaLengths = {
  fullWaveMm: number
  halfWaveMm: number
  quarterWaveMm: number
  wavelengthFreeMm: number
}

export function antennaLengths(freqMHz: number, velocityFactor = 0.95): AntennaLengths {
  if (!isPositive(freqMHz)) return { fullWaveMm: 0, halfWaveMm: 0, quarterWaveMm: 0, wavelengthFreeMm: 0 }
  const wavelengthFreeMm = (299792.458 / freqMHz)  // λ in mm
  const wavelengthEffMm  = wavelengthFreeMm * velocityFactor
  return {
    wavelengthFreeMm,
    fullWaveMm:    wavelengthEffMm,
    halfWaveMm:    wavelengthEffMm / 2,
    quarterWaveMm: wavelengthEffMm / 4,
  }
}