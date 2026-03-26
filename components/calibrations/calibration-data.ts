import type { PerfCalcInput } from '@/lib/aero'

export type XcopterInput = {
  auwG: number
  rotors: number
  capacityMah: number
  avgCurrentA: number
  thrustPerMotorG: number
}

export type PropCalcInput = {
  rpm: number
  diameterIn: number
  pitchIn: number
  bladeCount: number
  power: number
  voltage: number
}

export type CGCalcInput = {
  noseWeight: number
  noseArm: number
  batteryWeight: number
  batteryArm: number
  tailWeight: number
  tailArm: number
}

export type MetricReference = Record<string, number>

export type VirtualTestCase<TInput> = {
  id: string
  name: string
  description: string
  input: TInput
  reference: MetricReference
}

export const suiteCatalog = [
  { key: 'perfcalc',    label: 'perfCalc — Продуктивність літака', implemented: true,  presets: 5 },
  { key: 'xcoptercalc', label: 'xcopterCalc — Мультиротор',        implemented: true,  presets: 5 },
  { key: 'propcalc',    label: 'propCalc — Мотор + Пропелер',      implemented: true,  presets: 4 },
  { key: 'cgcalc',      label: 'cgCalc — Центр ваги',              implemented: true,  presets: 3 },
] as const

export const perfCalibrationCases: VirtualTestCase<PerfCalcInput>[] = [
  {
    id: 'perf-foamie',
    name: 'Foamie trainer 1.3 кг',
    description: 'Легкий тренер для перевірки швидкості зриву та дальності.',
    input: {
      elevationM: 200, temperatureC: 18,
      weightKg: 1.5, wingAreaDm2: 27, wingSpanMm: 1180,
      cd0: 0.034, oswald: 0.83, clMax: 1.52,
      motorCount: 1, propDiameterIn: 10, propPitchIn: 6, bladeCount: 2,
      rpm: 9100, staticThrustG: 1620, drivePowerW: 470,
      batteryCells: 3, batteryVoltagePerCell: 3.7, batteryCapacityMah: 2200, averageCurrentA: 24,
    },
    reference: { stallSpeedKmh: 27.6, bestRangeKmh: 43.0, levelMaxSpeedKmh: 77.5, maxRocMs: 21.1, thrustToWeight: 1.07 },
  },
  {
    id: 'perf-3d',
    name: '3D aerobatic 60E',
    description: 'Висока тяга і сильний вертикальний набір.',
    input: {
      elevationM: 450, temperatureC: 24,
      weightKg: 3.8, wingAreaDm2: 61, wingSpanMm: 1570,
      cd0: 0.038, oswald: 0.79, clMax: 1.58,
      motorCount: 1, propDiameterIn: 17, propPitchIn: 8, bladeCount: 2,
      rpm: 7600, staticThrustG: 6350, drivePowerW: 1780,
      batteryCells: 6, batteryVoltagePerCell: 3.7, batteryCapacityMah: 5000, averageCurrentA: 57,
    },
    reference: { stallSpeedKmh: 29.4, bestRangeKmh: 48.3, levelMaxSpeedKmh: 94.0, maxRocMs: 31.8, thrustToWeight: 1.66 },
  },
  {
    id: 'perf-glider',
    name: 'Fast electric glider',
    description: 'Швидкісний планер з хорошим Oswald e.',
    input: {
      elevationM: 350, temperatureC: 17,
      weightKg: 2.3, wingAreaDm2: 38, wingSpanMm: 2100,
      cd0: 0.026, oswald: 0.88, clMax: 1.34,
      motorCount: 1, propDiameterIn: 13, propPitchIn: 10, bladeCount: 2,
      rpm: 9800, staticThrustG: 3350, drivePowerW: 1080,
      batteryCells: 4, batteryVoltagePerCell: 3.7, batteryCapacityMah: 3200, averageCurrentA: 39,
    },
    reference: { stallSpeedKmh: 31.0, bestRangeKmh: 37.6, levelMaxSpeedKmh: 118.5, maxRocMs: 35.9, thrustToWeight: 1.45 },
  },
  {
    id: 'perf-warbird',
    name: 'Warbird sport scale',
    description: 'Вищий паразитний опір і швидкісний крейсер.',
    input: {
      elevationM: 120, temperatureC: 22,
      weightKg: 4.7, wingAreaDm2: 58, wingSpanMm: 1470,
      cd0: 0.046, oswald: 0.75, clMax: 1.42,
      motorCount: 1, propDiameterIn: 15, propPitchIn: 10, bladeCount: 3,
      rpm: 8200, staticThrustG: 4880, drivePowerW: 1480,
      batteryCells: 6, batteryVoltagePerCell: 3.7, batteryCapacityMah: 4500, averageCurrentA: 54,
    },
    reference: { stallSpeedKmh: 34.6, bestRangeKmh: 53.7, levelMaxSpeedKmh: 94.0, maxRocMs: 20.1, thrustToWeight: 1.03 },
  },
  {
    id: 'perf-f5j',
    name: 'F5J thermal setup',
    description: 'Тонке крило, довгий розмах і помірна потужність.',
    input: {
      elevationM: 600, temperatureC: 21,
      weightKg: 1.85, wingAreaDm2: 42, wingSpanMm: 2970,
      cd0: 0.023, oswald: 0.9, clMax: 1.31,
      motorCount: 1, propDiameterIn: 11, propPitchIn: 8, bladeCount: 2,
      rpm: 7900, staticThrustG: 1980, drivePowerW: 540,
      batteryCells: 3, batteryVoltagePerCell: 3.7, batteryCapacityMah: 1800, averageCurrentA: 20,
    },
    reference: { stallSpeedKmh: 27.3, bestRangeKmh: 32.2, levelMaxSpeedKmh: 85.7, maxRocMs: 22.1, thrustToWeight: 1.06 },
  },
]

export const xcopterCalibrationCases: VirtualTestCase<XcopterInput>[] = [
  {
    id: 'xcopter-5inch',
    name: '5-inch FPV freestyle',
    description: 'Легкий квадрокоптер для freestyle.',
    input: { auwG: 720, rotors: 4, capacityMah: 1500, avgCurrentA: 24, thrustPerMotorG: 950 },
    reference: { hoverThrustG: 180, flightTimeMin: 3.2, thrustToWeight: 5.28, payloadG: 0 },
  },
  {
    id: 'xcopter-cinema',
    name: '7-inch cinelifter',
    description: 'Платформа з невеликим запасом під камеру.',
    input: { auwG: 2350, rotors: 4, capacityMah: 4200, avgCurrentA: 36, thrustPerMotorG: 1800 },
    reference: { hoverThrustG: 587.5, flightTimeMin: 5.8, thrustToWeight: 3.06, payloadG: 1610 },
  },
  {
    id: 'xcopter-agri6',
    name: 'Hexa utility 6-rotor',
    description: 'Шестироторна платформа з більшою стабільністю.',
    input: { auwG: 6200, rotors: 6, capacityMah: 16000, avgCurrentA: 78, thrustPerMotorG: 2450 },
    reference: { hoverThrustG: 1033.3, flightTimeMin: 10.5, thrustToWeight: 2.37, payloadG: 1885 },
  },
  {
    id: 'xcopter-x8',
    name: 'X8 mapping rig',
    description: 'Восьмироторна mapping-конфігурація.',
    input: { auwG: 9200, rotors: 8, capacityMah: 22000, avgCurrentA: 110, thrustPerMotorG: 2100 },
    reference: { hoverThrustG: 1150, flightTimeMin: 10.2, thrustToWeight: 1.83, payloadG: 40 },
  },
  {
    id: 'xcopter-longrange',
    name: 'Long-range quad',
    description: 'Оптимізація на ефективність і помірну масу.',
    input: { auwG: 1450, rotors: 4, capacityMah: 4000, avgCurrentA: 18, thrustPerMotorG: 1100 },
    reference: { hoverThrustG: 362.5, flightTimeMin: 11.3, thrustToWeight: 3.03, payloadG: 970 },
  },
]

export const propCalibrationCases: VirtualTestCase<PropCalcInput>[] = [
  {
    id: 'prop-sport-10x6',
    name: '10×6 спортивний 2S',
    description: 'Класичний 2-лопатевий пропелер для легкого тренера.',
    input: { rpm: 9200, diameterIn: 10, pitchIn: 6, bladeCount: 2, power: 380, voltage: 7.4 },
    reference: { thrustG: 820, currentA: 51.4, efficiencyPct: 68.8 },
  },
  {
    id: 'prop-3d-17x8',
    name: '17×8 3D пропелер 6S',
    description: 'Великий пропелер для 3D-моделі з високою тягою.',
    input: { rpm: 7600, diameterIn: 17, pitchIn: 8, bladeCount: 2, power: 1780, voltage: 22.2 },
    reference: { thrustG: 4250, currentA: 80.2, efficiencyPct: 74.7 },
  },
  {
    id: 'prop-tri-15x10',
    name: '15×10 3-лопатевий 6S',
    description: 'Трилопатевий пропелер для warbird-платформи.',
    input: { rpm: 8200, diameterIn: 15, pitchIn: 10, bladeCount: 3, power: 1480, voltage: 22.2 },
    reference: { thrustG: 3580, currentA: 66.7, efficiencyPct: 80.8 },
  },
  {
    id: 'prop-glider-13x10',
    name: '13×10 планер 4S',
    description: 'Ефективний планерний пропелер з великим кроком.',
    input: { rpm: 9800, diameterIn: 13, pitchIn: 10, bladeCount: 2, power: 1080, voltage: 14.8 },
    reference: { thrustG: 2180, currentA: 73.0, efficiencyPct: 80.8 },
  },
]

export const cgCalibrationCases: VirtualTestCase<CGCalcInput>[] = [
  {
    id: 'cg-trainer',
    name: 'Тренер 1.5 кг',
    description: 'Типовий розподіл мас тренувального літака.',
    input: { noseWeight: 620, noseArm: 110, batteryWeight: 420, batteryArm: 280, tailWeight: 160, tailArm: 790 },
    reference: { totalWeightG: 1200, cgMm: 290.3 },
  },
  {
    id: 'cg-warbird',
    name: 'Warbird 4.7 кг',
    description: 'Важкий фюзеляж, масивний двигун спереду.',
    input: { noseWeight: 1800, noseArm: 95, batteryWeight: 1400, batteryArm: 310, tailWeight: 620, tailArm: 820 },
    reference: { totalWeightG: 3820, cgMm: 295.4 },
  },
  {
    id: 'cg-glider',
    name: 'Планер 2.3 кг',
    description: 'Розподіл мас для довгого планера.',
    input: { noseWeight: 480, noseArm: 130, batteryWeight: 900, batteryArm: 340, tailWeight: 200, tailArm: 1050 },
    reference: { totalWeightG: 1580, cgMm: 332.3 },
  },
]
