function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

export function gustWindSpeed(meanWindMs: number, sigmaMs: number) {
  if (!isPositive(meanWindMs) || !isPositive(sigmaMs)) return 0
  return meanWindMs + 1.5 * sigmaMs
}

// EDR (ε^(1/3)) in m^(2/3) s^(-1).
// Uses Kolmogorov inertial-subrange relation: ε = σ_w³ / L_w
// lengthScaleM: integral length scale (ICAO/FAA default 533 m at low altitude)
export function eddyDissipationRate(sigmaU: number, sigmaV: number, sigmaW: number, lengthScaleM = 533) {
  if (!isPositive(sigmaU) || !isPositive(sigmaV) || !isPositive(sigmaW) || !isPositive(lengthScaleM)) return 0
  const tke = (sigmaU ** 2 + sigmaV ** 2 + sigmaW ** 2) / 2  // turbulent kinetic energy
  const sigmaRef = Math.sqrt((2 / 3) * tke)                   // isotropic RMS velocity
  const epsilon = sigmaRef ** 3 / lengthScaleM                 // ε [m²/s³]
  return Math.pow(epsilon, 1 / 3)                              // EDR = ε^(1/3) [m^(2/3)/s]
}

export function magneticDeclination(lat: number, lon: number, year: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(year)) return 0
  return ((lat * 0.5 + lon * 0.3 + (year - 2000) * 0.05 + 540) % 360) - 180
}

export function airDensityMoist(rhoDry: number, specificHumidity: number) {
  if (!isPositive(rhoDry) || !Number.isFinite(specificHumidity)) return 0
  return rhoDry / (1 + 0.61 * specificHumidity)
}

export function potentialTemperature(tempKelvin: number, pressureHpa: number) {
  if (!isPositive(tempKelvin) || !isPositive(pressureHpa)) return 0
  return tempKelvin * Math.pow(1000 / pressureHpa, 0.286)
}

export function cloudBaseHeight(tempC: number, dewC: number) {
  if (!Number.isFinite(tempC) || !Number.isFinite(dewC)) return 0
  return Math.max(0, (tempC - dewC) * 125)
}

export function visibilityKm(extinctionCoeffKm: number) {
  if (!isPositive(extinctionCoeffKm)) return 0
  return 3 / extinctionCoeffKm
}

export function radioRefractivity(pressureHpa: number, tempKelvin: number, vaporPressureHpa: number) {
  if (!isPositive(pressureHpa) || !isPositive(tempKelvin) || !isPositive(vaporPressureHpa)) return 0
  return 77.6 * (pressureHpa / tempKelvin) + 3.73e5 * (vaporPressureHpa / Math.pow(tempKelvin, 2))
}

export function rainAttenuation(rainRateMmHr: number, distanceKm: number, freqGhz: number) {
  if (!isPositive(rainRateMmHr) || !isPositive(distanceKm) || !isPositive(freqGhz)) return 0
  let k = 0.01
  let alpha = 1
  if (freqGhz >= 10 && freqGhz < 30) {
    k = 0.02
    alpha = 1.1
  } else if (freqGhz >= 30) {
    k = 0.03
    alpha = 1.2
  }
  return k * Math.pow(rainRateMmHr, alpha) * distanceKm
}

export function gpsSolarDelay(kpIndex: number) {
  if (!isPositive(kpIndex)) return 0
  return kpIndex * 0.1
}

export function kpDescription(kp: number) {
  if (!Number.isFinite(kp)) return 'Невідомо'
  if (kp < 4) return 'Спокійна геомагнітна обстановка'
  if (kp < 6) return 'Помірна буря'
  if (kp < 8) return 'Сильна буря'
  return 'Екстремальна буря'
}

export function densityAltitude(pressureAltitudeM: number, tempC: number, isaTempC = 15) {
  if (!Number.isFinite(pressureAltitudeM) || !Number.isFinite(tempC) || !Number.isFinite(isaTempC)) return 0
  return pressureAltitudeM + (tempC - isaTempC) * 36.6
}

export function vonKarmanSpectrum(sigmaU: number, lu: number, waveNumber: number) {
  if (!isPositive(sigmaU) || !isPositive(lu) || !isPositive(waveNumber)) return 0
  return (sigmaU * sigmaU * (lu / Math.PI)) / Math.pow(1 + Math.pow(waveNumber * lu, 2), 5 / 6)
}

export function soundSpeedHumidity(tempC: number, specificHumidity: number) {
  if (!Number.isFinite(tempC) || !Number.isFinite(specificHumidity)) return 0
  const drySound = 331.3 * Math.sqrt(1 + tempC / 273.15)
  return drySound * (1 + 0.16 * specificHumidity)
}

export function richardsonNumber(gravity: number, thetaVKelvin: number, deltaThetaV: number, deltaZ: number, deltaU: number) {
  if (!isPositive(gravity) || !isPositive(thetaVKelvin) || !isPositive(deltaZ) || !Number.isFinite(deltaThetaV) || !Number.isFinite(deltaU)) {
    return 0
  }
  const buoyancy = (gravity / thetaVKelvin) * (deltaThetaV / deltaZ)
  const shear = Math.pow(deltaU / deltaZ, 2)
  if (shear === 0) return Number.POSITIVE_INFINITY
  return buoyancy / shear
}

export function pblHeight(ustar: number, coriolis: number) {
  if (!isPositive(ustar) || !isPositive(coriolis)) return 0
  return (0.3 * ustar) / coriolis
}

export function icingRate(liquidWaterContent: number, speedMs: number, beta: number) {
  if (!isPositive(liquidWaterContent) || !isPositive(speedMs) || !isPositive(beta)) return 0
  return 0.1 * liquidWaterContent * speedMs * beta
}

export function solarIrradiance(i0: number, tau: number, airMass: number, zenithDeg: number) {
  if (!isPositive(i0) || !isPositive(tau) || !isPositive(airMass) || !Number.isFinite(zenithDeg)) return 0
  const cosTheta = Math.cos((zenithDeg * Math.PI) / 180)
  return Math.max(0, i0 * Math.pow(tau, airMass) * cosTheta)
}

export function pressureAltitudeIsa(pressureHpa: number) {
  if (!isPositive(pressureHpa)) return 0
  const p0 = 1013.25
  const t0 = 288.15
  const lapse = 0.0065
  const gasConstant = 287.05
  const gravity = 9.80665
  const exponent = (gasConstant * lapse) / gravity
  return (t0 / lapse) * (1 - Math.pow(pressureHpa / p0, exponent))
}

export function radioHorizon(antennaHeightM: number, nUnits: number) {
  if (!isPositive(antennaHeightM) || !Number.isFinite(nUnits)) return 0
  const earthRadius = 6371000
  const factor = 1 + 0.25 * (nUnits / 1000)
  const effectiveRadius = earthRadius * factor
  return Math.sqrt(2 * effectiveRadius * antennaHeightM) / 1000
}