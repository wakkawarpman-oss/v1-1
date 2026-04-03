/**
 * Battery database — Li-Ion cells (18650 / 21700) + LiPo RC packs.
 *
 * Each record includes:
 *   - Standard electrical specs (capacity, voltage, max current, Ri)
 *   - peukertK — Peukert exponent for capacity correction at high C-rates
 *     Ideal = 1.0; typical Li-Ion 1.02–1.06; LiPo 1.05–1.12
 *     Effective capacity: C_eff = C_rated × (I_rate / I_actual)^(K−1)
 *
 * Sources: manufacturer datasheets, LYGTE-INFO.dk measurements, HKJ reviews.
 */

export type CellFormFactor = '18650' | '21700' | '26650' | 'LiPo'
export type CellChemistry  = 'Li-Ion' | 'LiPo' | 'LiFePO4'

// ── Li-Ion cell record ────────────────────────────────────────────────────────

export type CellSpec = {
  id:               string
  label:            string
  formFactor:       CellFormFactor
  chemistry:        CellChemistry
  capacityMah:      number
  nominalVoltageV:  number   // 3.6 V Li-Ion, 3.7 V LiPo nom
  maxContinuousA:   number   // continuous discharge limit (A)
  riMOhms:          number   // DC internal resistance (mΩ) at room temp, 50% SoC
  peukertK:         number   // Peukert exponent (1.0 = ideal)
  weightG:          number   // bare cell weight (g)
  notes:            string
}

// ── 18650 cells ──────────────────────────────────────────────────────────────

const CELLS_18650: CellSpec[] = [
  {
    id: 'samsung-30q',
    label: 'Samsung 30Q (18650)',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 3000, nominalVoltageV: 3.6,
    maxContinuousA: 15, riMOhms: 20, peukertK: 1.05, weightG: 46,
    notes: 'Найпопулярніший 18650 для DIY. Відмінний баланс ємності та струму.',
  },
  {
    id: 'sony-vtc6',
    label: 'Sony VTC6 (18650)',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 3000, nominalVoltageV: 3.6,
    maxContinuousA: 15, riMOhms: 18, peukertK: 1.04, weightG: 46,
    notes: 'Низький DCIR, стабільна крива розряду. Вибір для FPV 18650 паків.',
  },
  {
    id: 'lg-hg2',
    label: 'LG HG2 (18650)',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 3000, nominalVoltageV: 3.6,
    maxContinuousA: 20, riMOhms: 22, peukertK: 1.05, weightG: 46,
    notes: 'До 20A безперервно. Перевірений роками у e-bike та RC.',
  },
  {
    id: 'samsung-25r',
    label: 'Samsung 25R (18650)',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 2500, nominalVoltageV: 3.6,
    maxContinuousA: 20, riMOhms: 15, peukertK: 1.03, weightG: 44,
    notes: 'Висока потужність серед 18650. Низький Ri за рахунок меншої ємності.',
  },
  {
    id: 'sanyo-ncr18650ga',
    label: 'Sanyo/Panasonic NCR18650GA',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 3500, nominalVoltageV: 3.6,
    maxContinuousA: 10, riMOhms: 28, peukertK: 1.06, weightG: 48,
    notes: 'Найвища ємність 18650. Тільки для малострумових застосувань (≤10A).',
  },
  {
    id: 'murata-vtc5d',
    label: 'Murata VTC5D (18650)',
    formFactor: '18650', chemistry: 'Li-Ion',
    capacityMah: 2800, nominalVoltageV: 3.6,
    maxContinuousA: 25, riMOhms: 12, peukertK: 1.03, weightG: 47,
    notes: 'Топ для високого струму серед 18650. До 25A, DCIR 12 мОм.',
  },
]

// ── 21700 cells ──────────────────────────────────────────────────────────────

const CELLS_21700: CellSpec[] = [
  {
    id: 'molicel-p42a',
    label: 'Molicel P42A (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 4200, nominalVoltageV: 3.6,
    maxContinuousA: 45, riMOhms: 13, peukertK: 1.03, weightG: 68,
    notes: 'Галузевий стандарт: висока потужність + термічна стабільність.',
  },
  {
    id: 'molicel-p45b',
    label: 'Molicel P45B (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 4500, nominalVoltageV: 3.6,
    maxContinuousA: 45, riMOhms: 9, peukertK: 1.02, weightG: 70,
    notes: 'Ультранизький DCIR 9 мОм, зарядка до 3C — ідеал для ударних платформ.',
  },
  {
    id: 'samsung-40t',
    label: 'Samsung 40T (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 4000, nominalVoltageV: 3.6,
    maxContinuousA: 35, riMOhms: 13, peukertK: 1.03, weightG: 67,
    notes: 'Перевірена стабільність під навантаженням.',
  },
  {
    id: 'samsung-50s',
    label: 'Samsung 50S (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 5000, nominalVoltageV: 3.6,
    maxContinuousA: 25, riMOhms: 15, peukertK: 1.04, weightG: 72,
    notes: 'Найвища щільність енергії 250 Вт·год/кг — оптимально для дальніх маршрутів.',
  },
  {
    id: 'samsung-50g',
    label: 'Samsung 50G (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 5000, nominalVoltageV: 3.6,
    maxContinuousA: 15, riMOhms: 16, peukertK: 1.05, weightG: 69,
    notes: '5000 мАч при обмеженому струмі. Ідеальний для ISR/дальніх місій.',
  },
  {
    id: 'murata-m21700',
    label: 'Murata US21700VTC6 (21700)',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 4000, nominalVoltageV: 3.6,
    maxContinuousA: 30, riMOhms: 11, peukertK: 1.03, weightG: 70,
    notes: 'Балансує між потужністю та ємністю. DCIR 11 мОм при 30A.',
  },
  {
    id: 'custom',
    label: 'Власна комірка',
    formFactor: '21700', chemistry: 'Li-Ion',
    capacityMah: 3000, nominalVoltageV: 3.7,
    maxContinuousA: 20, riMOhms: 20, peukertK: 1.05, weightG: 65,
    notes: 'Ручне введення параметрів.',
  },
]

// ── LiPo pack records ─────────────────────────────────────────────────────────
// LiPo packs are described as ready-made packs (S×P baked in).

export type LiPoPackSpec = {
  id:            string
  label:         string
  brand:         string
  sCells:        number   // series cells
  pCells:        number   // parallel cells (usually 1 for RC)
  capacityMah:   number   // rated capacity
  cRating:       number   // burst C rating
  continuousC:   number   // continuous C rating
  riMOhmsTotal:  number   // total pack Ri (mΩ) — not per cell
  peukertK:      number
  weightG:       number
  notes:         string
}

export const LIPO_DB: LiPoPackSpec[] = [
  // ── Micro / Tiny Whoop ──
  {
    id: 'gnb-4s-650',
    label: 'GNB 4S 650mAh 100C',
    brand: 'GNB', sCells: 4, pCells: 1,
    capacityMah: 650, cRating: 100, continuousC: 60,
    riMOhmsTotal: 8, peukertK: 1.08, weightG: 85,
    notes: 'Мікро FPV квадрокоптери (65–100 мм). Висока потужність на грам.',
  },
  // ── FPV 5" racer ──
  {
    id: 'tattu-4s-1300',
    label: 'TATTU R-Line 4S 1300mAh 95C',
    brand: 'TATTU', sCells: 4, pCells: 1,
    capacityMah: 1300, cRating: 95, continuousC: 95,
    riMOhmsTotal: 6, peukertK: 1.07, weightG: 162,
    notes: 'Стандарт FPV 5" рейсер. Стабільна напруга до 80% розряду.',
  },
  {
    id: 'cnhl-4s-1300',
    label: 'CNHL 4S 1300mAh 100C',
    brand: 'CNHL', sCells: 4, pCells: 1,
    capacityMah: 1300, cRating: 100, continuousC: 80,
    riMOhmsTotal: 7, peukertK: 1.08, weightG: 158,
    notes: 'Бюджетна альтернатива TATTU для тренувань.',
  },
  {
    id: 'gnb-6s-1300',
    label: 'GNB 6S 1300mAh 120C',
    brand: 'GNB', sCells: 6, pCells: 1,
    capacityMah: 1300, cRating: 120, continuousC: 80,
    riMOhmsTotal: 9, peukertK: 1.07, weightG: 228,
    notes: '6S FPV 5"— вища ефективність приводу, менший струм при тій самій потужності.',
  },
  {
    id: 'tattu-4s-1800',
    label: 'TATTU 4S 1800mAh 75C',
    brand: 'TATTU', sCells: 4, pCells: 1,
    capacityMah: 1800, cRating: 75, continuousC: 75,
    riMOhmsTotal: 9, peukertK: 1.07, weightG: 215,
    notes: '7" або повільніший 5" FPV. Більше льотного часу.',
  },
  // ── Середні дрони ──
  {
    id: 'tattu-4s-4000',
    label: 'TATTU 4S 4000mAh 45C',
    brand: 'TATTU', sCells: 4, pCells: 1,
    capacityMah: 4000, cRating: 45, continuousC: 45,
    riMOhmsTotal: 14, peukertK: 1.06, weightG: 390,
    notes: 'Середні мультиротори (DJI F450 клас). 8–12 хв часу польоту.',
  },
  {
    id: 'gens-ace-6s-5000',
    label: 'Gens Ace 6S 5000mAh 50C',
    brand: 'Gens Ace', sCells: 6, pCells: 1,
    capacityMah: 5000, cRating: 50, continuousC: 50,
    riMOhmsTotal: 18, peukertK: 1.06, weightG: 680,
    notes: 'Великі гексакоптери та октокоптери. ISR платформи.',
  },
  // ── Фіксоване крило ──
  {
    id: 'gens-ace-3s-5200',
    label: 'Gens Ace 3S 5200mAh 60C',
    brand: 'Gens Ace', sCells: 3, pCells: 1,
    capacityMah: 5200, cRating: 60, continuousC: 60,
    riMOhmsTotal: 12, peukertK: 1.06, weightG: 320,
    notes: 'Фіксоване крило, планери. Тривалий польот при низькому струмі.',
  },
  {
    id: 'tattu-4s-10000',
    label: 'TATTU 4S 10000mAh 15C',
    brand: 'TATTU', sCells: 4, pCells: 1,
    capacityMah: 10000, cRating: 15, continuousC: 15,
    riMOhmsTotal: 30, peukertK: 1.05, weightG: 790,
    notes: 'Великі фіксованокрилі БПЛА, дальні місії. Ємність > час.',
  },
  // ── Тактичні / FPV ударні ──
  {
    id: 'gnb-6s-1800',
    label: 'GNB 6S 1800mAh 100C',
    brand: 'GNB', sCells: 6, pCells: 1,
    capacityMah: 1800, cRating: 100, continuousC: 70,
    riMOhmsTotal: 10, peukertK: 1.07, weightG: 305,
    notes: 'Важкі FPV дрони з корисним навантаженням. Баланс потужності та часу.',
  },
]

// ── Unified cell database ─────────────────────────────────────────────────────

export const CELL_DB: CellSpec[] = [...CELLS_18650, ...CELLS_21700]

// ── Peukert capacity correction ───────────────────────────────────────────────
/**
 * Peukert-corrected effective capacity at actual discharge current.
 *
 * Model: C_eff = C_rated × (I_1C / I_actual)^(K − 1)
 *
 * where I_1C = C_rated[Ah] × 1 (1C discharge reference).
 * At low C-rates (< 1C) the formula returns > rated capacity (slight boost);
 * at high C-rates it returns less (capacity loss).
 *
 * @param ratedMah   - Rated capacity in mAh
 * @param currentA   - Actual discharge current (A)
 * @param peukertK   - Peukert exponent (from CELL_DB or LIPO_DB)
 * @returns Effective capacity in mAh
 */
export function peukertCapacityMah(
  ratedMah: number,
  currentA: number,
  peukertK: number,
): number {
  if (ratedMah <= 0 || currentA <= 0 || peukertK <= 0) return ratedMah
  const i1c = ratedMah / 1000  // 1C current in A
  // Clamp ratio to [0.1, 10] — same bounds as aero.ts peukertCapacityMah —
  // so both implementations return identical results across all C-rates.
  const ratio = Math.min(10, Math.max(0.1, i1c / currentA))
  return ratedMah * Math.pow(ratio, peukertK - 1)
}

/**
 * Peukert-corrected flight time in minutes.
 *
 * @param ratedMah   - Rated pack capacity (mAh)
 * @param currentA   - Average discharge current (A)
 * @param peukertK   - Peukert exponent
 * @param reservePct - Safety reserve fraction (default 0.20 = 20%)
 */
export function peukertFlightTimeMin(
  ratedMah: number,
  currentA: number,
  peukertK: number,
  reservePct = 0.20,
): number {
  if (ratedMah <= 0 || currentA <= 0) return 0
  const effectiveMah = peukertCapacityMah(ratedMah, currentA, peukertK)
  const usableMah = effectiveMah * (1 - reservePct)
  return (usableMah / 1000 / currentA) * 60
}

/**
 * Peukert exponent estimate from two discharge measurements.
 * Useful for calibrating a cell from actual flight data.
 *
 * log(t1/t2) / log(I2/I1)  where ti = minutes at Ii amps.
 */
export function estimatePeukertK(
  I1: number, t1Min: number,
  I2: number, t2Min: number,
): number {
  if (I1 <= 0 || I2 <= 0 || t1Min <= 0 || t2Min <= 0 || I1 === I2) return 1.05
  return Math.log(t1Min / t2Min) / Math.log(I2 / I1)
}
