function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

// Parallel MOSFETs share current → effective Rds_on = Rds / N → loss = I²·Rds / N
export function escPowerLoss(currentA: number, rdsOnOhm: number, mosfetCount: number) {
  if (!isPositive(currentA) || !isPositive(rdsOnOhm) || !isPositive(mosfetCount)) return 0
  return (Math.pow(currentA, 2) * rdsOnOhm) / mosfetCount
}

export function backupRuntime(capacityAh: number, voltageV: number, loadW: number) {
  if (!isPositive(capacityAh) || !isPositive(voltageV) || !isPositive(loadW)) return 0
  return (capacityAh * voltageV) / loadW
}

export function voltageDrop(currentA: number, lengthM: number, crossSectionMm2: number, resistivityCu = 1.68e-8) {
  if (!isPositive(currentA) || !isPositive(lengthM) || !isPositive(crossSectionMm2) || !isPositive(resistivityCu)) return 0
  const resistance = (2 * lengthM * resistivityCu) / (crossSectionMm2 * 1e-6)
  return currentA * resistance
}

export function filterCapacitance(loadCurrentA: number, switchingFrequencyHz: number, rippleVoltageV: number) {
  if (!isPositive(loadCurrentA) || !isPositive(switchingFrequencyHz) || !isPositive(rippleVoltageV)) return 0
  return loadCurrentA / (2 * switchingFrequencyHz * rippleVoltageV)
}

export function electricalFrequency(rpm: number, polePairs: number) {
  if (!isPositive(rpm) || !isPositive(polePairs)) return 0
  return (rpm * polePairs) / 60
}

export function receiverSensitivity(tempK: number, bandwidthHz: number, noiseFigureDb: number) {
  if (!isPositive(tempK) || !isPositive(bandwidthHz) || !Number.isFinite(noiseFigureDb)) return 0
  const boltzmann = 1.38e-23
  const noiseFloor = 10 * Math.log10(boltzmann * tempK * bandwidthHz) + 30
  return noiseFloor + noiseFigureDb
}

export function freeSpaceRange(ptDbm: number, gtDbi: number, grDbi: number, systemLossDb: number, rxSensitivityDbm: number, freqGhz: number) {
  if (!isPositive(freqGhz)) return 0
  const ptxLinear = Math.pow(10, (ptDbm - 30) / 10)
  const prxLinear = Math.pow(10, (rxSensitivityDbm - 30) / 10)
  const wavelengthM = 0.3 / freqGhz
  const numerator = ptxLinear * Math.pow(10, (gtDbi + grDbi - systemLossDb) / 10)
  const denominator = prxLinear * Math.pow(4 * Math.PI, 2)

  if (numerator <= 0 || denominator <= 0) return 0

  return (Math.sqrt(numerator / denominator) * wavelengthM) / 1000
}

export function dutyCycle(motorVoltageV: number, batteryVoltageV: number) {
  if (!isPositive(motorVoltageV) || !isPositive(batteryVoltageV)) return 0
  return motorVoltageV / batteryVoltageV
}

export function tempRise(powerLossW: number, thermalResistanceCPerW: number) {
  if (!isPositive(powerLossW) || !isPositive(thermalResistanceCPerW)) return 0
  return powerLossW * thermalResistanceCPerW
}

export function calibrationTime(bandwidthHz: number) {
  if (!isPositive(bandwidthHz)) return 0
  const tau = 1 / (2 * Math.PI * bandwidthHz)
  return 3 * tau
}
// ── ESC / BLDC Thermal Model ──────────────────────────────────────────────────
// Estimates ESC junction temperature rise from I²·Rds(on) conduction losses
// plus switching losses, then applies junction-to-ambient thermal resistance.
export function escThermal(params: {
  currentA: number
  rdsOnMOhm: number       // Rds(on) per MOSFET in milli-ohms
  mosfetPairs: number     // parallel MOSFETs per switch position (1 = standard single MOSFET per switch)
  switchingFreqKhz: number
  chargeNCoulombs: number // gate charge Qg in nano-Coulombs
  voltageV: number
  thetaJaCPerW: number    // junction-to-ambient thermal resistance °C/W
  ambientC: number
}): { conductionW: number; switchingW: number; totalW: number; junctionC: number } {
  const { currentA, rdsOnMOhm, mosfetPairs, switchingFreqKhz, chargeNCoulombs, voltageV, thetaJaCPerW, ambientC } = params
  const rds = (rdsOnMOhm / 1000) * 2 / mosfetPairs  // 2 MOSFETs in series (high+low side), divided by parallel count per switch
  const conductionW = currentA ** 2 * rds
  const switchingW = chargeNCoulombs * 1e-9 * voltageV * switchingFreqKhz * 1000
  const totalW = conductionW + switchingW
  const junctionC = ambientC + totalW * thetaJaCPerW
  return { conductionW, switchingW, totalW, junctionC }
}
