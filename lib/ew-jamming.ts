/**
 * Electronic Warfare: Jamming-to-Signal (J/S) ratio calculator.
 *
 * Evaluates how vulnerable a UAV communication link is to jamming.
 *
 *   J/S = (EIRP_J − L_J + G_rJ) − (EIRP_S − L_S + G_rS) − BW_penalty − PG
 *
 * Path loss uses the distance-only form (20·log10 d), valid for J/S when both
 * signals share the same carrier — the wavelength term in FSPL cancels.
 *
 * Bandwidth penalty (barrage jamming): when the jammer spreads power across
 * a wider band than the receiver filter, only a fraction of jammer energy
 * enters the receiver passband:
 *   BW_penalty = 10·log10(B_jammer / B_signal)   when B_jammer > B_signal
 *
 * Processing gain (spread-spectrum, LoRa/DSSS): digital receivers can decode
 * signals below the noise floor. PG represents this coding margin:
 *   ELRS (LoRa SF6): PG ≈ 10–12 dB
 *   Analog RC / FPV: PG = 0 dB
 *
 * References:
 *   Poisel (2011) "Introduction to Communication Electronic Warfare Systems"
 *   ITU-R P.525-4 (free-space propagation)
 */

export interface JammingInput {
  /** Ground-station transmit power, dBm */
  txPowerDbm: number
  /** Ground-station antenna gain, dBi */
  txGainDbi: number
  /** Distance from ground station to UAV, m */
  txDistanceM: number
  /** Receiver passband / occupied bandwidth, MHz (e.g. 0.5 for ELRS, 18 for analog FPV) */
  txBandwidthMhz?: number

  /** Jammer transmit power, dBm */
  jammerPowerDbm: number
  /** Jammer antenna gain (in direction of UAV), dBi */
  jammerGainDbi: number
  /** Distance from jammer to UAV, m */
  jammerDistanceM: number
  /** Total jammed band, MHz (e.g. 100 for barrage jamming 800–900 MHz) */
  jammerBandwidthMhz?: number

  /** UAV receive antenna gain toward ground station, dBi (default 0 = isotropic) */
  rxGainTowardsTxDbi?: number
  /** UAV receive antenna gain toward jammer, dBi (default 0 = isotropic) */
  rxGainTowardsJamDbi?: number
  /** Spread-spectrum / coding gain of the link protocol, dB (default 0) */
  processingGainDb?: number
}

export interface JammingResult {
  /** Received signal power at UAV (raw, before coding gain), dBm */
  signalRssiDbm: number
  /** Received jammer power at UAV before bandwidth filtering, dBm */
  jammerRssiDbm: number
  /**
   * Bandwidth penalty applied to jammer — how many dB of jammer power
   * are wasted outside the receiver's passband. Zero when no BW params given.
   */
  bandwidthPenaltyDb: number
  /** Effective J/S after bandwidth penalty and processing gain, dB */
  jsRatioDb: number
  /** Margin before link degrades (positive = safe, negative = jammed) */
  marginDb: number
  /** True when effective J/S > −requiredSnrDb */
  isJammed: boolean
}

function pathLossDb(distanceM: number): number {
  return 20 * Math.log10(Math.max(distanceM, 1))
}

/**
 * Compute J/S ratio and link survivability.
 *
 * @param input         Link and jammer geometry / power parameters
 * @param requiredSnrDb Minimum SNR for link operation (default 6 dB).
 *                      Link survives when effective J/S < −requiredSnrDb.
 */
export function calculateJammingMargin(
  input: JammingInput,
  requiredSnrDb = 6,
): JammingResult {
  const rxTxGain  = input.rxGainTowardsTxDbi  ?? 0
  const rxJamGain = input.rxGainTowardsJamDbi ?? 0
  const pg        = input.processingGainDb    ?? 0

  const signalRssi = input.txPowerDbm     + input.txGainDbi     - pathLossDb(input.txDistanceM)     + rxTxGain
  const jammerRssi = input.jammerPowerDbm + input.jammerGainDbi - pathLossDb(input.jammerDistanceM) + rxJamGain

  // Bandwidth penalty: jammer power wasted outside receiver passband
  let bandwidthPenaltyDb = 0
  const bj = input.jammerBandwidthMhz ?? 0
  const bs = input.txBandwidthMhz     ?? 0
  if (bj > 0 && bs > 0 && bj > bs) {
    bandwidthPenaltyDb = 10 * Math.log10(bj / bs)
  }

  const effectiveJammerRssi = jammerRssi - bandwidthPenaltyDb
  const jsRatioDb = effectiveJammerRssi - signalRssi - pg
  const marginDb  = -requiredSnrDb - jsRatioDb

  return {
    signalRssiDbm:      +signalRssi.toFixed(2),
    jammerRssiDbm:      +jammerRssi.toFixed(2),
    bandwidthPenaltyDb: +bandwidthPenaltyDb.toFixed(2),
    jsRatioDb:          +jsRatioDb.toFixed(2),
    marginDb:           +marginDb.toFixed(2),
    isJammed:           jsRatioDb > -requiredSnrDb,
  }
}

/**
 * Maximum jammer-to-UAV distance at which the jammer still suppresses the link.
 * Accounts for bandwidth penalty and processing gain when provided.
 */
export function jammingRangeM(input: JammingInput, requiredSnrDb = 6): number {
  const rxTxGain  = input.rxGainTowardsTxDbi  ?? 0
  const rxJamGain = input.rxGainTowardsJamDbi ?? 0
  const pg        = input.processingGainDb    ?? 0

  const signalRssi = input.txPowerDbm + input.txGainDbi - pathLossDb(input.txDistanceM) + rxTxGain

  let bandwidthPenaltyDb = 0
  const bj = input.jammerBandwidthMhz ?? 0
  const bs = input.txBandwidthMhz     ?? 0
  if (bj > 0 && bs > 0 && bj > bs) {
    bandwidthPenaltyDb = 10 * Math.log10(bj / bs)
  }

  // Threshold: effectiveJammerRssi = signalRssi + pg − requiredSnrDb
  const requiredEffectiveJammerRssi = signalRssi + pg - requiredSnrDb
  const requiredRawJammerRssi = requiredEffectiveJammerRssi + bandwidthPenaltyDb

  const eirpJ = input.jammerPowerDbm + input.jammerGainDbi
  const log10d = (eirpJ + rxJamGain - requiredRawJammerRssi) / 20
  if (!Number.isFinite(log10d)) return Infinity
  return +Math.pow(10, log10d).toFixed(1)
}
