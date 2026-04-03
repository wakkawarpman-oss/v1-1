import {
  Activity,
  BarChart2,
  Compass,
  Cpu,
  Database,
  Eye,
  Flame,
  Gauge,
  Map,
  Navigation,
  Plane,
  Radio,
  Ruler,
  ShieldAlert,
  ShieldCheck,
  Target,
  Thermometer,
  Volume2,
  Wind,
  Wrench,
  Zap,
  Battery,
  type LucideIcon,
} from 'lucide-react'

export type DashboardTabDef = {
  value: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

export type DashboardTabGroup = {
  group: string | null
  tabs: DashboardTabDef[]
}

export const dashboardTabGroups: DashboardTabGroup[] = [
  {
    group: null,
    tabs: [{ value: 'dashboard', label: 'Головна', shortLabel: 'Головна', icon: Gauge }],
  },
  {
    group: 'Характеристики',
    tabs: [
      { value: 'perfcalc', label: 'Продуктивність літака', shortLabel: 'Продуктивність', icon: BarChart2 },
      { value: 'xcoptercalc', label: 'Мультиротор', shortLabel: 'Мультиротор', icon: Cpu },
      { value: 'propcalc', label: 'Мотор і пропелер', shortLabel: 'Мотор', icon: Plane },
      { value: 'cgcalc', label: 'Центр ваги', shortLabel: 'Центр ваги', icon: Target },
    ],
  },
  {
    group: 'Планування місії',
    tabs: [
      { value: 'mission', label: 'Центр планування місії', shortLabel: 'Місія', icon: Navigation },
      { value: 'fieldops', label: 'Польові рішення', shortLabel: 'Польові', icon: ShieldCheck },
      { value: 'aeronav', label: 'Аеронавігація', shortLabel: 'Аеронавігація', icon: Compass },
      { value: 'coords', label: 'Системи координат', shortLabel: 'Координати', icon: Map },
    ],
  },
  {
    group: 'Інженерія',
    tabs: [
      { value: 'engineering', label: 'Авіаційна інженерія', shortLabel: 'Інженерія', icon: Wrench },
      { value: 'avionics', label: 'Авіоніка і електроніка', shortLabel: 'Авіоніка', icon: Zap },
      { value: 'geometry', label: 'Геометрія літака', shortLabel: 'Геометрія', icon: Ruler },
      { value: 'environment', label: 'Зовнішні фактори', shortLabel: 'Середовище', icon: Wind },
      { value: 'windprofile', label: 'Профіль вітру (ISO 4354)', shortLabel: 'Вітер', icon: Wind },
      { value: 'thermalcooling', label: 'Ram-Air охолодження', shortLabel: 'Охолодження', icon: Thermometer },
      { value: 'acoustic', label: 'Акустичний підпис', shortLabel: 'Акустика', icon: Volume2 },
      { value: 'slipstream', label: 'Slipstream — Слід гвинта', shortLabel: 'Слід гвинта', icon: Wind },
    ],
  },
  {
    group: 'Зв\'язок і радіо',
    tabs: [
      { value: 'radiohorizon', label: 'Радіогоризонт і радар', shortLabel: 'Радіогориз.', icon: Radio },
      { value: 'frequency', label: 'Частотні інструменти', shortLabel: 'Частоти', icon: Activity },
      { value: 'optics', label: 'Оптика, GSD та радіоканал', shortLabel: 'Оптика', icon: Eye },
      { value: 'ew', label: 'РЕБ — Стійкість лінку', shortLabel: 'РЕБ', icon: ShieldAlert },
    ],
  },
  {
    group: 'Інструменти',
    tabs: [
      { value: 'dronetools', label: 'Польові інструменти', shortLabel: 'Польові інстр.', icon: Wrench },
      { value: 'soldering', label: 'Паяння та монтаж', shortLabel: 'Паяння', icon: Flame },
      { value: 'ballistics', label: 'Балістика скидання', shortLabel: 'Балістика', icon: Target },
      { value: 'battery', label: 'Конструктор батарейного паку', shortLabel: 'Батарея', icon: Battery },
    ],
  },
  {
    group: 'База знань',
    tabs: [{ value: 'dronedb', label: 'База дронів — ТТХ', shortLabel: 'База дронів', icon: Database }],
  },
]

export const dashboardTabs: DashboardTabDef[] = dashboardTabGroups.flatMap((group) => group.tabs)

export function isDashboardTab(value: string | null): value is string {
  return dashboardTabs.some((tab) => tab.value === value)
}
