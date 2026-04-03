export type AccuracyGroup = 'A' | 'B' | 'C' | 'D'

export type AccuracyUnit = 'percent' | 'db'

export type AccuracyMetric = {
  group: AccuracyGroup
  metric: string
  accuracy: string
  basis: string
  unit: AccuracyUnit
  // Absolute bound range used for contract testing and CI gates.
  lowerBound: number
  upperBound: number
}

export const GROUP_BOUNDS_PERCENT: Record<AccuracyGroup, { min: number; max: number }> = {
  A: { min: 0, max: 5 },
  B: { min: 5, max: 15 },
  C: { min: 15, max: 30 },
  D: { min: 20, max: Number.POSITIVE_INFINITY },
}

export const ACCURACY_BASELINE: AccuracyMetric[] = [
  { group: 'A', metric: 'Щільність повітря', accuracy: '±0.3%', basis: 'ISA (ICAO Doc 7488) аналітичні формули', unit: 'percent', lowerBound: 0.3, upperBound: 0.3 },
  { group: 'A', metric: 'Радіогоризонт', accuracy: '±2–3%', basis: 'Геометрія (ITU-R P.526), k-factor 4/3', unit: 'percent', lowerBound: 2, upperBound: 3 },
  { group: 'A', metric: 'Напруга під навантаженням', accuracy: '±2%', basis: 'Peukert + V-sag (Rint model), 17 еталонів', unit: 'percent', lowerBound: 2, upperBound: 2 },
  { group: 'A', metric: 'Статична тяга (CT відомий)', accuracy: '±3–5%', basis: 'CT = T/ρn²D⁴, AIAA 2012, UIUC OLS', unit: 'percent', lowerBound: 3, upperBound: 5 },
  { group: 'A', metric: 'Швидкість зриву (airfoil-db)', accuracy: '±3–5%', basis: '3 airfoil-db cd0/oswald, UIUC/NACA Re-полари', unit: 'percent', lowerBound: 3, upperBound: 5 },
  { group: 'A', metric: 'FSPL / бюджет лінку', accuracy: '±1–2%', basis: 'Friis (1946), дБ-модель LOS', unit: 'percent', lowerBound: 1, upperBound: 2 },
  { group: 'B', metric: 'Ендюранс мультиротора', accuracy: '±7–10%', basis: 'Altmann motor model + Peukert Kp, 80 моторів', unit: 'percent', lowerBound: 7, upperBound: 10 },
  { group: 'B', metric: 'Потужність приводу', accuracy: '±5–10%', basis: 'back-EMF + advance ratio, η_esc ≈ 0.92', unit: 'percent', lowerBound: 5, upperBound: 10 },
  { group: 'B', metric: 'Ендюранс фіксованого крила', accuracy: '±8–12%', basis: 'Бреге-Доналдсон, спрощений CD(CL)', unit: 'percent', lowerBound: 8, upperBound: 12 },
  { group: 'B', metric: 'GSD / охоплення камери', accuracy: '±5%', basis: 'Thin lens, сенсор-пресети Sony/DJI/custom', unit: 'percent', lowerBound: 5, upperBound: 5 },
  { group: 'C', metric: 'Аеродинамічний опір CD₀', accuracy: '±15–25%', basis: 'Wetted-area методика, без CFD', unit: 'percent', lowerBound: 15, upperBound: 25 },
  { group: 'C', metric: 'FPV тяга в польоті', accuracy: '±15–20%', basis: 'CT(J) з prop-db, 33 пропелери; без Mach-корекції', unit: 'percent', lowerBound: 15, upperBound: 20 },
  { group: 'C', metric: 'Акустичний OASPL', accuracy: '±3–6 дБ', basis: 'Gutin-Lighthill, без турбулентного шуму', unit: 'db', lowerBound: 3, upperBound: 6 },
  { group: 'D', metric: 'Температура ESC', accuracy: '±30–50%', basis: 'Теплова ємність без реальної конвекції', unit: 'percent', lowerBound: 30, upperBound: 50 },
  { group: 'D', metric: 'CG зі складним компонуванням', accuracy: '±20–40%', basis: 'Спрощена 3-масова модель', unit: 'percent', lowerBound: 20, upperBound: 40 },
]

export function isMetricWithinGroupBand(metric: AccuracyMetric): boolean {
  if (metric.unit !== 'percent') return true
  const bounds = GROUP_BOUNDS_PERCENT[metric.group]
  return metric.lowerBound >= bounds.min && metric.upperBound <= bounds.max
}
