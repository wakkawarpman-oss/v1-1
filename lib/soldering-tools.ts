function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

export function solderingHeatInput(voltageV: number, currentA: number, timeSec: number, speedMmPerMin: number) {
  if (!isPositive(voltageV) || !isPositive(currentA) || !isPositive(timeSec) || !isPositive(speedMmPerMin)) return 0
  const energyJ = voltageV * currentA * timeSec
  const distanceMm = (speedMmPerMin / 60) * timeSec
  return energyJ / distanceMm
}

export function requiredPower(massKg: number, deltaTempK: number, heatupTimeSec: number, specificHeatJPerKgK = 385) {
  if (!isPositive(massKg) || !isPositive(deltaTempK) || !isPositive(heatupTimeSec) || !isPositive(specificHeatJPerKgK)) return 0
  return (massKg * specificHeatJPerKgK * deltaTempK) / heatupTimeSec
}

export function heaterResistance(voltageV: number, powerW: number) {
  if (!isPositive(voltageV) || !isPositive(powerW)) return 0
  return (voltageV * voltageV) / powerW
}

export function heaterResistanceFromCurrent(voltageV: number, currentA: number) {
  if (!isPositive(voltageV) || !isPositive(currentA)) return 0
  return voltageV / currentA
}

export function pidCoefficients(ku: number, tu: number) {
  if (!isPositive(ku) || !isPositive(tu)) return { Kp: 0, Ki: 0, Kd: 0 }
  return {
    Kp: 0.6 * ku,
    Ki: (1.2 * ku) / tu,
    Kd: 0.075 * ku * tu,
  }
}

export type SolderingTipModel = 'TS100_BC2' | 'TS100_TSK' | 'T12_BC2' | 'T12_ILS' | 'C210'

export function tipModelParams(tipModel: SolderingTipModel) {
  const tips: Record<SolderingTipModel, { gain: number; thermalMass: number; family: string }> = {
    TS100_BC2: { gain: 1.0, thermalMass: 1.0, family: 'TS100' },
    TS100_TSK: { gain: 1.05, thermalMass: 1.1, family: 'TS100' },
    T12_BC2: { gain: 1.1, thermalMass: 1.3, family: 'T12' },
    T12_ILS: { gain: 1.08, thermalMass: 1.2, family: 'T12' },
    C210: { gain: 0.95, thermalMass: 0.8, family: 'JBC C210' },
  }

  return tips[tipModel]
}

export type SolderPasteType = 'SAC305' | 'SnPb63' | 'lead_free'

export function reflowProfile(solderPasteType: SolderPasteType) {
  const profiles: Record<SolderPasteType, { preheat: number; soak: number; peak: number; cool: number }> = {
    SAC305: { preheat: 150, soak: 180, peak: 245, cool: 220 },
    SnPb63: { preheat: 100, soak: 150, peak: 220, cool: 180 },
    lead_free: { preheat: 150, soak: 185, peak: 250, cool: 225 },
  }

  return profiles[solderPasteType]
}

export function apertureSize(padWidthMm: number, padLengthMm: number, pitchMm: number) {
  if (!isPositive(padWidthMm) || !isPositive(padLengthMm) || !isPositive(pitchMm)) {
    return { width: 0, length: 0, reduction: 0 }
  }

  let reduction = 0.9
  if (pitchMm <= 0.5) reduction = 0.8
  else if (pitchMm <= 0.65) reduction = 0.85

  return {
    width: padWidthMm * reduction,
    length: padLengthMm * reduction,
    reduction,
  }
}

export function apertureAreaRatio(apertureWidthMm: number, apertureLengthMm: number, stencilThicknessMm: number) {
  if (!isPositive(apertureWidthMm) || !isPositive(apertureLengthMm) || !isPositive(stencilThicknessMm)) return 0
  const area = apertureWidthMm * apertureLengthMm
  const wallArea = 2 * (apertureWidthMm + apertureLengthMm) * stencilThicknessMm
  return wallArea > 0 ? area / wallArea : 0
}

export function solderPasteVolume(apertureAreaMm2: number, stencilThicknessMm: number) {
  if (!isPositive(apertureAreaMm2) || !isPositive(stencilThicknessMm)) return 0
  return apertureAreaMm2 * stencilThicknessMm
}

export function pwmFrequencyFromPeriod(periodUs: number) {
  if (!isPositive(periodUs)) return 0
  return 1_000_000 / periodUs
}

export function pwmPeriodFromFrequency(freqHz: number) {
  if (!isPositive(freqHz)) return 0
  return 1_000_000 / freqHz
}