function isPositive(value: number) {
  return Number.isFinite(value) && value > 0
}

export function aspectRatio(spanM: number, areaM2: number) {
  if (!isPositive(spanM) || !isPositive(areaM2)) return 0
  return Math.pow(spanM, 2) / areaM2
}

export function taperRatio(tipChordM: number, rootChordM: number) {
  if (!isPositive(tipChordM) || !isPositive(rootChordM)) return 0
  return tipChordM / rootChordM
}

export function sweepAngle(deltaXM: number, semiSpanM: number) {
  if (!Number.isFinite(deltaXM) || !isPositive(semiSpanM)) return 0
  return (Math.atan2(deltaXM, semiSpanM) * 180) / Math.PI
}

export function meanAerodynamicChord(rootChordM: number, tipChordM: number) {
  if (!isPositive(rootChordM) || !isPositive(tipChordM)) return 0
  const lambda = tipChordM / rootChordM
  return ((2 / 3) * rootChordM * (1 + lambda + Math.pow(lambda, 2))) / (1 + lambda)
}

export function macSpanPosition(spanM: number, tipChordM: number, rootChordM: number) {
  if (!isPositive(spanM) || !isPositive(tipChordM) || !isPositive(rootChordM)) return 0
  const lambda = tipChordM / rootChordM
  return (spanM / 6) * ((1 + 2 * lambda) / (1 + lambda))
}

export function horizontalTailVolume(tailAreaM2: number, tailArmM: number, wingAreaM2: number, macM: number) {
  if (!isPositive(tailAreaM2) || !isPositive(tailArmM) || !isPositive(wingAreaM2) || !isPositive(macM)) return 0
  return (tailAreaM2 * tailArmM) / (wingAreaM2 * macM)
}

export function verticalTailVolume(finAreaM2: number, tailArmM: number, wingAreaM2: number, spanM: number) {
  if (!isPositive(finAreaM2) || !isPositive(tailArmM) || !isPositive(wingAreaM2) || !isPositive(spanM)) return 0
  return (finAreaM2 * tailArmM) / (wingAreaM2 * spanM)
}

export function fuselageDiameter(volumeM3: number, lengthM: number) {
  if (!isPositive(volumeM3) || !isPositive(lengthM)) return 0
  return Math.sqrt((4 * volumeM3) / (Math.PI * lengthM))
}

export function relativeThickness(maxThicknessM: number, chordM: number) {
  if (!isPositive(maxThicknessM) || !isPositive(chordM)) return 0
  return maxThicknessM / chordM
}

export function washout(tipIncidenceDeg: number, rootIncidenceDeg: number) {
  if (!Number.isFinite(tipIncidenceDeg) || !Number.isFinite(rootIncidenceDeg)) return 0
  return rootIncidenceDeg - tipIncidenceDeg
}