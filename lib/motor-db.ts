/**
 * Motor database — Kv / Rᵢ / I₀ for common RC/BPLA brushless motors.
 * Sources: manufacturer datasheets, Altmann aufwind/MFI articles, community measurements.
 * Rᵢ and I₀ values are typical/nominal; individual units may vary ±15%.
 */

export type MotorSpec = {
  id: string
  brand: string
  name: string
  kv: number   // RPM/V
  ri: number   // Ω  internal resistance
  i0: number   // A  no-load current
  maxW?: number
  weightG?: number
}

export const MOTORS: MotorSpec[] = [
  // ── T-Motor ──────────────────────────────────────────────────────────────
  { id: 'tmotor-mn1005-90',    brand: 'T-Motor', name: 'MN1005 KV90',    kv: 90,   ri: 0.120, i0: 0.30, maxW: 160  },
  { id: 'tmotor-mn3110-470',   brand: 'T-Motor', name: 'MN3110 KV470',   kv: 470,  ri: 0.068, i0: 0.40, maxW: 350  },
  { id: 'tmotor-mn3510-400',   brand: 'T-Motor', name: 'MN3510 KV400',   kv: 400,  ri: 0.072, i0: 0.40, maxW: 400  },
  { id: 'tmotor-mn3515-400',   brand: 'T-Motor', name: 'MN3515 KV400',   kv: 400,  ri: 0.065, i0: 0.50, maxW: 450  },
  { id: 'tmotor-mn4010-370',   brand: 'T-Motor', name: 'MN4010 KV370',   kv: 370,  ri: 0.058, i0: 0.50, maxW: 500  },
  { id: 'tmotor-mn4014-330',   brand: 'T-Motor', name: 'MN4014 KV330',   kv: 330,  ri: 0.062, i0: 0.50, maxW: 500  },
  { id: 'tmotor-mn5008-340',   brand: 'T-Motor', name: 'MN5008 KV340',   kv: 340,  ri: 0.055, i0: 0.60, maxW: 700  },
  { id: 'tmotor-mn5212-340',   brand: 'T-Motor', name: 'MN5212 KV340',   kv: 340,  ri: 0.052, i0: 0.70, maxW: 800  },
  { id: 'tmotor-mn601s-170',   brand: 'T-Motor', name: 'MN601-S KV170',  kv: 170,  ri: 0.055, i0: 0.60, maxW: 900  },
  { id: 'tmotor-mn701s-160',   brand: 'T-Motor', name: 'MN701-S KV160',  kv: 160,  ri: 0.050, i0: 0.60, maxW: 1200 },
  { id: 'tmotor-mn801s-130',   brand: 'T-Motor', name: 'MN801-S KV130',  kv: 130,  ri: 0.048, i0: 0.70, maxW: 1500 },
  { id: 'tmotor-mn1000-90',    brand: 'T-Motor', name: 'MN1000 KV90',    kv: 90,   ri: 0.042, i0: 0.80, maxW: 2000 },
  { id: 'tmotor-u3-700',       brand: 'T-Motor', name: 'U3 KV700',       kv: 700,  ri: 0.055, i0: 0.50, maxW: 350  },
  { id: 'tmotor-u5-400',       brand: 'T-Motor', name: 'U5 KV400',       kv: 400,  ri: 0.058, i0: 0.50, maxW: 600  },
  { id: 'tmotor-u7-280',       brand: 'T-Motor', name: 'U7 KV280',       kv: 280,  ri: 0.060, i0: 0.60, maxW: 900  },
  { id: 'tmotor-u8-190',       brand: 'T-Motor', name: 'U8 KV190',       kv: 190,  ri: 0.055, i0: 0.60, maxW: 1400 },
  { id: 'tmotor-u8lite-190',   brand: 'T-Motor', name: 'U8 Lite KV190',  kv: 190,  ri: 0.052, i0: 0.70, maxW: 1400 },
  { id: 'tmotor-u10-100',      brand: 'T-Motor', name: 'U10 KV100',      kv: 100,  ri: 0.042, i0: 0.80, maxW: 2000 },
  { id: 'tmotor-u11-90',       brand: 'T-Motor', name: 'U11 KV90',       kv: 90,   ri: 0.038, i0: 0.90, maxW: 2500 },
  { id: 'tmotor-u12-80',       brand: 'T-Motor', name: 'U12 KV80',       kv: 80,   ri: 0.035, i0: 1.00, maxW: 3000 },
  { id: 'tmotor-at2312-1400',  brand: 'T-Motor', name: 'AT2312 KV1400',  kv: 1400, ri: 0.052, i0: 0.50, maxW: 250  },
  { id: 'tmotor-at2317-1050',  brand: 'T-Motor', name: 'AT2317 KV1050',  kv: 1050, ri: 0.055, i0: 0.50, maxW: 300  },
  { id: 'tmotor-at2820-860',   brand: 'T-Motor', name: 'AT2820 KV860',   kv: 860,  ri: 0.040, i0: 0.60, maxW: 400  },
  { id: 'tmotor-at2826-760',   brand: 'T-Motor', name: 'AT2826 KV760',   kv: 760,  ri: 0.038, i0: 0.70, maxW: 500  },
  { id: 'tmotor-at3520-400',   brand: 'T-Motor', name: 'AT3520 KV400',   kv: 400,  ri: 0.035, i0: 0.80, maxW: 700  },
  { id: 'tmotor-f40-2400',     brand: 'T-Motor', name: 'F40 KV2400',     kv: 2400, ri: 0.028, i0: 0.80, maxW: 700  },
  { id: 'tmotor-f60-2550',     brand: 'T-Motor', name: 'F60 KV2550',     kv: 2550, ri: 0.022, i0: 1.00, maxW: 1000 },

  // ── Hacker (datasheet + Altmann articles) ────────────────────────────────
  { id: 'hacker-a20-16m-1540', brand: 'Hacker', name: 'A20-16M KV1540',  kv: 1540, ri: 0.075, i0: 0.50, maxW: 250  },
  { id: 'hacker-a20-20l-1900', brand: 'Hacker', name: 'A20-20L KV1900',  kv: 1900, ri: 0.085, i0: 0.50, maxW: 300  },
  { id: 'hacker-a30-12xl-760', brand: 'Hacker', name: 'A30-12XL KV760',  kv: 760,  ri: 0.048, i0: 1.10, maxW: 560  },
  { id: 'hacker-a30-20s-1050', brand: 'Hacker', name: 'A30-20S KV1050',  kv: 1050, ri: 0.042, i0: 1.00, maxW: 600  },
  { id: 'hacker-a40-14l-500',  brand: 'Hacker', name: 'A40-14L KV500',   kv: 500,  ri: 0.032, i0: 1.20, maxW: 900  },
  { id: 'hacker-a40-10l-650',  brand: 'Hacker', name: 'A40-10L KV650',   kv: 650,  ri: 0.035, i0: 1.20, maxW: 850  },
  { id: 'hacker-a50-14s-400',  brand: 'Hacker', name: 'A50-14S KV400',   kv: 400,  ri: 0.024, i0: 1.50, maxW: 1400 },
  { id: 'hacker-a50-8s-800',   brand: 'Hacker', name: 'A50-8S KV800',    kv: 800,  ri: 0.025, i0: 1.50, maxW: 1200 },
  { id: 'hacker-a60-14m-260',  brand: 'Hacker', name: 'A60-14M KV260',   kv: 260,  ri: 0.018, i0: 2.00, maxW: 2000 },
  { id: 'hacker-a80-8s-380',   brand: 'Hacker', name: 'A80-8S KV380',    kv: 380,  ri: 0.015, i0: 2.50, maxW: 3000 },

  // ── SunnySky ──────────────────────────────────────────────────────────────
  { id: 'sunnysky-x2212-980',  brand: 'SunnySky', name: 'X2212 KV980',   kv: 980,  ri: 0.042, i0: 0.40, maxW: 250  },
  { id: 'sunnysky-x2216-1250', brand: 'SunnySky', name: 'X2216 KV1250',  kv: 1250, ri: 0.038, i0: 0.40, maxW: 300  },
  { id: 'sunnysky-x2814-900',  brand: 'SunnySky', name: 'X2814 KV900',   kv: 900,  ri: 0.040, i0: 0.50, maxW: 350  },
  { id: 'sunnysky-x3108-720',  brand: 'SunnySky', name: 'X3108S KV720',  kv: 720,  ri: 0.048, i0: 0.50, maxW: 500  },
  { id: 'sunnysky-x4108-380',  brand: 'SunnySky', name: 'X4108S KV380',  kv: 380,  ri: 0.065, i0: 0.50, maxW: 600  },
  { id: 'sunnysky-v3508-380',  brand: 'SunnySky', name: 'V3508 KV380',   kv: 380,  ri: 0.070, i0: 0.40, maxW: 500  },
  { id: 'sunnysky-v4014-330',  brand: 'SunnySky', name: 'V4014 KV330',   kv: 330,  ri: 0.078, i0: 0.50, maxW: 600  },
  { id: 'sunnysky-v5208-340',  brand: 'SunnySky', name: 'V5208 KV340',   kv: 340,  ri: 0.055, i0: 0.60, maxW: 800  },

  // ── EMAX ──────────────────────────────────────────────────────────────────
  { id: 'emax-rs2205-2300',    brand: 'EMAX', name: 'RS2205 KV2300',     kv: 2300, ri: 0.035, i0: 0.50, maxW: 600  },
  { id: 'emax-rs2306-2400',    brand: 'EMAX', name: 'RS2306 KV2400',     kv: 2400, ri: 0.030, i0: 0.60, maxW: 700  },
  { id: 'emax-gt2215-1180',    brand: 'EMAX', name: 'GT2215/09 KV1180',  kv: 1180, ri: 0.040, i0: 0.50, maxW: 280  },
  { id: 'emax-gt2826-1000',    brand: 'EMAX', name: 'GT2826/06 KV1000',  kv: 1000, ri: 0.038, i0: 0.60, maxW: 400  },
  { id: 'emax-mt2213-935',     brand: 'EMAX', name: 'MT2213 KV935',      kv: 935,  ri: 0.045, i0: 0.40, maxW: 250  },
  { id: 'emax-mt3510-600',     brand: 'EMAX', name: 'MT3510 KV600',      kv: 600,  ri: 0.050, i0: 0.50, maxW: 400  },
  { id: 'emax-mt4114-400',     brand: 'EMAX', name: 'MT4114 KV400',      kv: 400,  ri: 0.060, i0: 0.50, maxW: 550  },

  // ── Scorpion ──────────────────────────────────────────────────────────────
  { id: 'scorpion-m2205-2350', brand: 'Scorpion', name: 'M-2205-2350',   kv: 2350, ri: 0.035, i0: 0.50, maxW: 600  },
  { id: 'scorpion-m3011-1000', brand: 'Scorpion', name: 'M-3011-1000',   kv: 1000, ri: 0.048, i0: 0.60, maxW: 450  },
  { id: 'scorpion-m4025-620',  brand: 'Scorpion', name: 'M-4025-620',    kv: 620,  ri: 0.040, i0: 0.80, maxW: 700  },
  { id: 'scorpion-m5025-380',  brand: 'Scorpion', name: 'M-5025-380',    kv: 380,  ri: 0.035, i0: 1.00, maxW: 1000 },
  { id: 'scorpion-hkiv-500',   brand: 'Scorpion', name: 'HKIV-4035-500', kv: 500,  ri: 0.032, i0: 1.00, maxW: 900  },

  // ── KDE Direct ────────────────────────────────────────────────────────────
  { id: 'kde-2315-885',        brand: 'KDE Direct', name: 'KDE2315XF-885',  kv: 885, ri: 0.048, i0: 0.50, maxW: 400  },
  { id: 'kde-2814-515',        brand: 'KDE Direct', name: 'KDE2814XF-515',  kv: 515, ri: 0.048, i0: 0.70, maxW: 600  },
  { id: 'kde-4213-360',        brand: 'KDE Direct', name: 'KDE4213XF-360',  kv: 360, ri: 0.045, i0: 0.80, maxW: 900  },
  { id: 'kde-5215-220',        brand: 'KDE Direct', name: 'KDE5215XF-220',  kv: 220, ri: 0.042, i0: 1.00, maxW: 1400 },
  { id: 'kde-7215-135',        brand: 'KDE Direct', name: 'KDE7215XF-135',  kv: 135, ri: 0.038, i0: 1.20, maxW: 2000 },
  { id: 'kde-8218-120',        brand: 'KDE Direct', name: 'KDE8218XF-120',  kv: 120, ri: 0.032, i0: 1.50, maxW: 2500 },

  // ── Cobra ────────────────────────────────────────────────────────────────
  { id: 'cobra-cm2204-1380',   brand: 'Cobra', name: 'CM2204/28 KV1380',  kv: 1380, ri: 0.040, i0: 0.40, maxW: 280  },
  { id: 'cobra-cm2206-2100',   brand: 'Cobra', name: 'CM2206/18 KV2100',  kv: 2100, ri: 0.035, i0: 0.50, maxW: 500  },
  { id: 'cobra-cm2208-1450',   brand: 'Cobra', name: 'CM2208/20 KV1450',  kv: 1450, ri: 0.038, i0: 0.50, maxW: 400  },
  { id: 'cobra-cm3515-400',    brand: 'Cobra', name: 'CM3515/09 KV400',   kv: 400,  ri: 0.062, i0: 0.60, maxW: 600  },
  { id: 'cobra-cm4016-400',    brand: 'Cobra', name: 'CM4016/14 KV400',   kv: 400,  ri: 0.055, i0: 0.70, maxW: 800  },
  { id: 'cobra-cm5208-280',    brand: 'Cobra', name: 'CM5208/28 KV280',   kv: 280,  ri: 0.045, i0: 0.80, maxW: 1200 },

  // ── Turnigy / Multistar ───────────────────────────────────────────────────
  { id: 'turnigy-4014-330',    brand: 'Turnigy', name: '4014-330KV',       kv: 330,  ri: 0.075, i0: 0.50, maxW: 500  },
  { id: 'turnigy-5010-360',    brand: 'Turnigy', name: '5010-360KV',       kv: 360,  ri: 0.065, i0: 0.60, maxW: 700  },
  { id: 'turnigy-d3542-1250',  brand: 'Turnigy', name: 'D3542/4 KV1250',  kv: 1250, ri: 0.038, i0: 0.50, maxW: 400  },
  { id: 'turnigy-d3542-1000',  brand: 'Turnigy', name: 'D3542/5 KV1000',  kv: 1000, ri: 0.040, i0: 0.50, maxW: 450  },
  { id: 'turnigy-g160-160',    brand: 'Turnigy', name: 'G160 KV160',      kv: 160,  ri: 0.055, i0: 0.70, maxW: 1400 },

  // ── BrotherHobby ──────────────────────────────────────────────────────────
  { id: 'bh-r6-2306-2400',     brand: 'BrotherHobby', name: 'Returner R6 2306 KV2400', kv: 2400, ri: 0.030, i0: 0.60, maxW: 700  },
  { id: 'bh-2805-1400',        brand: 'BrotherHobby', name: 'Tornado T2 2805 KV1400',  kv: 1400, ri: 0.038, i0: 0.50, maxW: 400  },

  // ── DYS ───────────────────────────────────────────────────────────────────
  { id: 'dys-2205-2300',       brand: 'DYS', name: 'BX2205 KV2300',       kv: 2300, ri: 0.032, i0: 0.50, maxW: 600  },
  { id: 'dys-se2205-2550',     brand: 'DYS', name: 'SE2205 KV2550',       kv: 2550, ri: 0.028, i0: 0.60, maxW: 650  },
  { id: 'dys-mr2205-2300',     brand: 'DYS', name: 'MR2205 KV2300',       kv: 2300, ri: 0.035, i0: 0.50, maxW: 600  },

  // ── RCTimer ───────────────────────────────────────────────────────────────
  { id: 'rctimer-bc3530-1400', brand: 'RCTimer', name: 'BC3530-14 KV1400', kv: 1400, ri: 0.042, i0: 0.50, maxW: 450  },
  { id: 'rctimer-bc3530-1100', brand: 'RCTimer', name: 'BC3530-18 KV1100', kv: 1100, ri: 0.045, i0: 0.50, maxW: 500  },
]

const normalize = (s: string) => s.toLowerCase().replace(/[-_]/g, '')

export function searchMotors(query: string): MotorSpec[] {
  if (query.length < 2) return []
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  return MOTORS.filter((m) => {
    const full = normalize(`${m.brand} ${m.name}`)
    return tokens.every((t) => full.includes(normalize(t)))
  }).slice(0, 12)
}

export function getMotorById(id: string): MotorSpec | undefined {
  return MOTORS.find((m) => m.id === id)
}
