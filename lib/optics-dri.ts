/**
 * Optical DRI range calculator — Johnson Criteria.
 *
 * The Johnson criteria define the minimum number of sensor pixels that must
 * span the target's critical dimension for each recognition task:
 *
 *   Detection       ≈  1.5 px   (something is there)
 *   Recognition     ≈  6.0 px   (what category — vehicle, person, …)
 *   Identification  ≈ 12.0 px   (specific model/type — T-72, pickup, …)
 *
 * Maximum slant range for a given task:
 *
 *   GSD_max = D_c / N_required
 *   Range   = GSD_max × (f_mm × W_px) / W_sensor_mm
 *
 * References:
 *   Johnson (1958) "Analysis of image forming systems", IRIRS
 *   NATO STANAG 4586 / NIIRS scale (modern calibration)
 */

export interface DriInput {
  /** Physical sensor width, mm */
  sensorWidthMm: number
  /** Lens focal length, mm */
  focalLengthMm: number
  /** Horizontal image resolution, pixels */
  imageWidthPixels: number
  /**
   * Target critical dimension (smallest characteristic extent), m.
   * Typical values: human ≈ 0.5 m, car width ≈ 2.3 m, tank length ≈ 7 m.
   */
  targetCriticalDimensionM: number
}

export interface DriDistances {
  /** Max slant range for Detection (≥1.5 px on target), m */
  detectionMaxDistanceM: number
  /** Max slant range for Recognition (≥6 px on target), m */
  recognitionMaxDistanceM: number
  /** Max slant range for Identification (≥12 px on target), m */
  identificationMaxDistanceM: number
  /** Ground sample distance at each threshold, m/px */
  gsdDetectionM:     number
  gsdRecognitionM:   number
  gsdIdentificationM: number
}

const PX_DETECTION      = 1.5
const PX_RECOGNITION    = 6.0
const PX_IDENTIFICATION = 12.0

/**
 * Calculate Johnson-criteria DRI distances for a camera / target combination.
 */
export function calculateJohnsonCriteria(input: DriInput): DriDistances {
  const { sensorWidthMm, focalLengthMm, imageWidthPixels, targetCriticalDimensionM } = input

  if (
    sensorWidthMm <= 0 || focalLengthMm <= 0 ||
    imageWidthPixels <= 0 || targetCriticalDimensionM <= 0
  ) {
    return {
      detectionMaxDistanceM:     0,
      recognitionMaxDistanceM:   0,
      identificationMaxDistanceM: 0,
      gsdDetectionM:     0,
      gsdRecognitionM:   0,
      gsdIdentificationM: 0,
    }
  }

  const rangeFn = (gsdM: number) =>
    (gsdM * focalLengthMm * imageWidthPixels) / sensorWidthMm

  const gsdD  = targetCriticalDimensionM / PX_DETECTION
  const gsdR  = targetCriticalDimensionM / PX_RECOGNITION
  const gsdId = targetCriticalDimensionM / PX_IDENTIFICATION

  return {
    detectionMaxDistanceM:     +rangeFn(gsdD).toFixed(0),
    recognitionMaxDistanceM:   +rangeFn(gsdR).toFixed(0),
    identificationMaxDistanceM: +rangeFn(gsdId).toFixed(0),
    gsdDetectionM:     +gsdD.toFixed(4),
    gsdRecognitionM:   +gsdR.toFixed(4),
    gsdIdentificationM: +gsdId.toFixed(4),
  }
}
