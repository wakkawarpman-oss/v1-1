/**
 * Propeller database — static Ct / Cp from UIUC Propeller Database and manufacturer data.
 * Source: Selig et al., UIUC Propeller Data Site (https://m-selig.ae.illinois.edu/props/propDB.html)
 * Values are static (J→0) thrust and power coefficients.
 * Convention: T = Ct·ρ·n²·D⁴, P = Cp·ρ·n³·D⁵ (n in rev/s, D in m)
 */

export type PropSpec = {
  id: string
  brand: string
  name: string
  diameterIn: number
  pitchIn: number
  blades: number
  ct: number   // thrust coefficient at J=0
  cp: number   // power coefficient at J=0
  source?: string
}

export const PROPS: PropSpec[] = [
  // ── APC Electric (E) ─────────────────────────────────────────────────────
  { id: 'apc-8x4e',    brand: 'APC', name: '8×4E',     diameterIn: 8,  pitchIn: 4.0, blades: 2, ct: 0.0977, cp: 0.0390, source: 'UIUC' },
  { id: 'apc-8x6e',    brand: 'APC', name: '8×6E',     diameterIn: 8,  pitchIn: 6.0, blades: 2, ct: 0.1074, cp: 0.0504, source: 'UIUC' },
  { id: 'apc-9x6e',    brand: 'APC', name: '9×6E',     diameterIn: 9,  pitchIn: 6.0, blades: 2, ct: 0.1065, cp: 0.0503, source: 'UIUC' },
  { id: 'apc-10x7e',   brand: 'APC', name: '10×7E',    diameterIn: 10, pitchIn: 7.0, blades: 2, ct: 0.1048, cp: 0.0539, source: 'UIUC' },
  { id: 'apc-11x55e',  brand: 'APC', name: '11×5.5E',  diameterIn: 11, pitchIn: 5.5, blades: 2, ct: 0.1038, cp: 0.0460, source: 'UIUC' },
  { id: 'apc-11x7e',   brand: 'APC', name: '11×7E',    diameterIn: 11, pitchIn: 7.0, blades: 2, ct: 0.1069, cp: 0.0564, source: 'UIUC' },
  { id: 'apc-11x8e',   brand: 'APC', name: '11×8E',    diameterIn: 11, pitchIn: 8.0, blades: 2, ct: 0.1073, cp: 0.0592, source: 'UIUC' },
  { id: 'apc-12x6e',   brand: 'APC', name: '12×6E',    diameterIn: 12, pitchIn: 6.0, blades: 2, ct: 0.1027, cp: 0.0490, source: 'UIUC' },
  { id: 'apc-12x8e',   brand: 'APC', name: '12×8E',    diameterIn: 12, pitchIn: 8.0, blades: 2, ct: 0.1084, cp: 0.0570, source: 'UIUC' },
  { id: 'apc-13x65e',  brand: 'APC', name: '13×6.5E',  diameterIn: 13, pitchIn: 6.5, blades: 2, ct: 0.1056, cp: 0.0543, source: 'UIUC' },
  { id: 'apc-13x8e',   brand: 'APC', name: '13×8E',    diameterIn: 13, pitchIn: 8.0, blades: 2, ct: 0.1082, cp: 0.0579, source: 'UIUC' },
  // ── APC Sport/Normal (N) ─────────────────────────────────────────────────
  { id: 'apc-14x7n',   brand: 'APC', name: '14×7N',    diameterIn: 14, pitchIn: 7.0, blades: 2, ct: 0.1089, cp: 0.0598, source: 'UIUC' },
  { id: 'apc-15x8n',   brand: 'APC', name: '15×8N',    diameterIn: 15, pitchIn: 8.0, blades: 2, ct: 0.1053, cp: 0.0581, source: 'UIUC' },
  { id: 'apc-16x8n',   brand: 'APC', name: '16×8N',    diameterIn: 16, pitchIn: 8.0, blades: 2, ct: 0.1090, cp: 0.0605, source: 'UIUC' },
  { id: 'apc-17x10n',  brand: 'APC', name: '17×10N',   diameterIn: 17, pitchIn: 10.0, blades: 2, ct: 0.1080, cp: 0.0646, source: 'UIUC' },
  { id: 'apc-18x10n',  brand: 'APC', name: '18×10N',   diameterIn: 18, pitchIn: 10.0, blades: 2, ct: 0.1042, cp: 0.0614, source: 'UIUC' },
  { id: 'apc-20x10n',  brand: 'APC', name: '20×10N',   diameterIn: 20, pitchIn: 10.0, blades: 2, ct: 0.1069, cp: 0.0638, source: 'UIUC' },
  { id: 'apc-22x12n',  brand: 'APC', name: '22×12N',   diameterIn: 22, pitchIn: 12.0, blades: 2, ct: 0.1073, cp: 0.0668, source: 'UIUC' },
  // ── APC Slow-Fly (SF) ─────────────────────────────────────────────────────
  { id: 'apc-9x47sf',  brand: 'APC', name: '9×4.7SF',  diameterIn: 9,  pitchIn: 4.7, blades: 2, ct: 0.1014, cp: 0.0427, source: 'UIUC' },
  { id: 'apc-10x47sf', brand: 'APC', name: '10×4.7SF', diameterIn: 10, pitchIn: 4.7, blades: 2, ct: 0.1095, cp: 0.0513, source: 'UIUC' },
  { id: 'apc-11x47sf', brand: 'APC', name: '11×4.7SF', diameterIn: 11, pitchIn: 4.7, blades: 2, ct: 0.1060, cp: 0.0455, source: 'UIUC' },
  { id: 'apc-12x6sf',  brand: 'APC', name: '12×6SF',   diameterIn: 12, pitchIn: 6.0, blades: 2, ct: 0.1027, cp: 0.0490, source: 'UIUC' },
  // ── Graupner ──────────────────────────────────────────────────────────────
  { id: 'graupner-8x6',  brand: 'Graupner', name: '8×6',    diameterIn: 8,  pitchIn: 6.0, blades: 2, ct: 0.1050, cp: 0.0510, source: 'datasheet' },
  { id: 'graupner-10x5', brand: 'Graupner', name: '10×5',   diameterIn: 10, pitchIn: 5.0, blades: 2, ct: 0.0980, cp: 0.0430, source: 'datasheet' },
  { id: 'graupner-12x6', brand: 'Graupner', name: '12×6',   diameterIn: 12, pitchIn: 6.0, blades: 2, ct: 0.1050, cp: 0.0510, source: 'datasheet' },
  { id: 'graupner-14x8', brand: 'Graupner', name: '14×8',   diameterIn: 14, pitchIn: 8.0, blades: 2, ct: 0.1080, cp: 0.0600, source: 'datasheet' },
  { id: 'graupner-16x8', brand: 'Graupner', name: '16×8',   diameterIn: 16, pitchIn: 8.0, blades: 2, ct: 0.1070, cp: 0.0580, source: 'datasheet' },
  // ── Mejzlik ───────────────────────────────────────────────────────────────
  { id: 'mejzlik-14x9',  brand: 'Mejzlik', name: '14×9',    diameterIn: 14, pitchIn: 9.0, blades: 2, ct: 0.1100, cp: 0.0620, source: 'datasheet' },
  { id: 'mejzlik-16x8',  brand: 'Mejzlik', name: '16×8',    diameterIn: 16, pitchIn: 8.0, blades: 2, ct: 0.1090, cp: 0.0580, source: 'datasheet' },
  { id: 'mejzlik-18x8',  brand: 'Mejzlik', name: '18×8',    diameterIn: 18, pitchIn: 8.0, blades: 2, ct: 0.1070, cp: 0.0600, source: 'datasheet' },
  { id: 'mejzlik-20x10', brand: 'Mejzlik', name: '20×10',   diameterIn: 20, pitchIn: 10.0, blades: 2, ct: 0.1080, cp: 0.0650, source: 'datasheet' },
  // ── RFM (folding, для планерів) ───────────────────────────────────────────
  { id: 'rfm-12x6f',  brand: 'RFM', name: '12×6 folding',   diameterIn: 12, pitchIn: 6.0, blades: 2, ct: 0.0980, cp: 0.0460, source: 'datasheet' },
  { id: 'rfm-15x7f',  brand: 'RFM', name: '15×7 folding',   diameterIn: 15, pitchIn: 7.0, blades: 2, ct: 0.1020, cp: 0.0530, source: 'datasheet' },
]

export const PROP_BRANDS = [...new Set(PROPS.map((p) => p.brand))]

export function getPropsByBrand(brand: string): PropSpec[] {
  return PROPS.filter((p) => p.brand === brand)
}

export function getPropById(id: string): PropSpec | undefined {
  return PROPS.find((p) => p.id === id)
}
