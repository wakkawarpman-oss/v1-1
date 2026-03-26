'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Download,
  Gauge,
  Plane,
  RotateCw,
  ShieldCheck,
  TestTubeDiagonal,
  TimerReset,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { perfSummary, round, staticThrustFromProp, type PerfCalcInput } from '@/lib/aero'
import {
  cgCalibrationCases,
  perfCalibrationCases,
  propCalibrationCases,
  suiteCatalog,
  xcopterCalibrationCases,
  type CGCalcInput,
  type MetricReference,
  type PropCalcInput,
  type VirtualTestCase,
  type XcopterInput,
} from '@/components/calibrations/calibration-data'

type ImplementedCalculator = 'perfcalc' | 'xcoptercalc' | 'propcalc' | 'cgcalc'

type RunRecord = {
  id: string
  calculator: string
  timestamp: string
  accuracy: number
  cases: number
  mode: 'preset' | 'manual'
}

type ComparisonRow = {
  scenario: string
  inputSummary: string
  metric: string
  reference: number
  clone: number
  delta: number
  errorPct: number
  status: 'pass' | 'warn' | 'fail'
}

type Report = {
  calculator: string
  accuracy: number
  rows: ComparisonRow[]
  recommendations: string[]
  mode: 'preset' | 'manual'
  timestamp: string
}

const metricLabels: Record<string, string> = {
  stallSpeedKmh: 'Швидкість зриву',
  bestRangeKmh: 'Найкраща дальність (Карсон)',
  levelMaxSpeedKmh: 'Макс. швидкість',
  maxRocMs: 'Макс. швидкість набору',
  thrustToWeight: 'Співвідношення тяги до ваги',
  hoverThrustG: 'Тяга в висінні на мотор',
  flightTimeMin: 'Час польоту',
  payloadG: 'Корисне навантаження',
  thrustG: 'Тяга',
  currentA: 'Струм',
  efficiencyPct: 'Ефективність',
  totalWeightG: 'Загальна маса',
  cgMm: 'Центр ваги',
}

const metricUnits: Record<string, string> = {
  stallSpeedKmh: 'км/год',
  bestRangeKmh: 'км/год',
  levelMaxSpeedKmh: 'км/год',
  maxRocMs: 'м/с',
  thrustToWeight: ':1',
  hoverThrustG: 'г',
  flightTimeMin: 'хв',
  payloadG: 'г',
  thrustG: 'г',
  currentA: 'A',
  efficiencyPct: '%',
  totalWeightG: 'г',
  cgMm: 'мм',
}

const historyKey = 'ecalc-ua-virtual-test-history'

export function VirtualTestersModule() {
  const [activeCalculator, setActiveCalculator] = useState<ImplementedCalculator>('perfcalc')
  const [manualMode, setManualMode] = useState(false)
  const [referenceResults, setReferenceResults] = useState<Record<string, MetricReference>>({})
  const [cloneResults, setCloneResults] = useState<Record<string, MetricReference>>({})
  const [running, setRunning] = useState(false)
  const [progressA, setProgressA] = useState(0)
  const [progressB, setProgressB] = useState(0)
  const [currentScenario, setCurrentScenario] = useState('Очікування')
  const [history, setHistory] = useState<RunRecord[]>([])
  const [lastReport, setLastReport] = useState<Report | null>(null)
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [manualPerfInput, setManualPerfInput] = useState<PerfCalcInput>(perfCalibrationCases[0].input)
  const [manualXcopterInput, setManualXcopterInput] = useState<XcopterInput>(xcopterCalibrationCases[0].input)
  const [manualPropInput, setManualPropInput] = useState<PropCalcInput>(propCalibrationCases[0].input)
  const [manualCGInput, setManualCGInput] = useState<CGCalcInput>(cgCalibrationCases[0].input)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(historyKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as RunRecord[]
      setHistory(parsed)
    } catch {
      // ignore invalid cached history
    }
  }, [])

  useEffect(() => {
    if (history.length > 0) {
      globalThis.localStorage?.setItem(historyKey, JSON.stringify(history.slice(0, 10)))
    }
  }, [history])

  const availableCases = useMemo(() => {
    let base: VirtualTestCase<unknown>[]
    if (activeCalculator === 'perfcalc') {
      base = manualMode
        ? [{ id: 'manual-perf', name: 'Manual perfCalc', description: 'Ручний прогін', input: manualPerfInput, reference: buildPerfReference(manualPerfInput) }]
        : perfCalibrationCases
    } else if (activeCalculator === 'propcalc') {
      base = manualMode
        ? [{ id: 'manual-prop', name: 'Manual propCalc', description: 'Ручний прогін', input: manualPropInput, reference: buildPropReference(manualPropInput) }]
        : propCalibrationCases
    } else if (activeCalculator === 'cgcalc') {
      base = manualMode
        ? [{ id: 'manual-cg', name: 'Manual cgCalc', description: 'Ручний прогін', input: manualCGInput, reference: buildCGReference(manualCGInput) }]
        : cgCalibrationCases
    } else {
      base = manualMode
        ? [{ id: 'manual-xcopter', name: 'Manual xcopterCalc', description: 'Ручний прогін', input: manualXcopterInput, reference: buildXcopterReference(manualXcopterInput) }]
        : xcopterCalibrationCases
    }
    if (!manualMode && selectedPresetId) {
      const filtered = base.filter((c) => c.id === selectedPresetId)
      if (filtered.length > 0) return filtered
    }
    return base
  }, [activeCalculator, manualMode, manualPerfInput, manualXcopterInput, manualPropInput, manualCGInput, selectedPresetId])

  const globalAccuracy = useMemo(() => {
    const relevant = history.filter((item) => ['perfcalc', 'xcoptercalc', 'propcalc', 'cgcalc'].includes(item.calculator))
    if (relevant.length === 0) return null
    return relevant.reduce((sum, item) => sum + item.accuracy, 0) / relevant.length
  }, [history])
  const reportTone = lastReport ? getAccuracyTone(lastReport.accuracy) : 'neutral'

  const processedReferenceCases = Object.keys(referenceResults).length
  const processedCloneCases = Object.keys(cloneResults).length

  async function runSynchronousTest() {
    const runCases = [...availableCases]
    setRunning(true)
    setShowPdfPreview(false)
    setReferenceResults({})
    setCloneResults({})
    setProgressA(0)
    setProgressB(0)
    setCurrentScenario('Підготовка до прогону')

    const refAcc: Record<string, MetricReference> = {}
    const cloneAcc: Record<string, MetricReference> = {}

    for (let index = 0; index < runCases.length; index += 1) {
      const testCase = runCases[index]
      setCurrentScenario(testCase.name)
      await delay(380)

      const reference = testCase.reference
      let clone: MetricReference
      if (activeCalculator === 'perfcalc') clone = calculatePerfClone(testCase.input as PerfCalcInput)
      else if (activeCalculator === 'propcalc') clone = calculatePropClone(testCase.input as PropCalcInput)
      else if (activeCalculator === 'cgcalc') clone = calculateCGClone(testCase.input as CGCalcInput)
      else clone = calculateXcopterClone(testCase.input as XcopterInput)

      refAcc[testCase.id] = reference
      cloneAcc[testCase.id] = clone
      setReferenceResults({ ...refAcc })
      setCloneResults({ ...cloneAcc })

      const pct = ((index + 1) / runCases.length) * 100
      setProgressA(pct)
      setProgressB(pct)
      await delay(360)
    }

    const report = buildReport(activeCalculator, runCases as VirtualTestCase<unknown>[], refAcc, cloneAcc, manualMode ? 'manual' : 'preset')
    setLastReport(report)
    setHistory((current) => [
      {
        id: `${activeCalculator}-${Date.now()}`,
        calculator: activeCalculator,
        timestamp: report.timestamp,
        accuracy: report.accuracy,
        cases: runCases.length,
        mode: report.mode,
      },
      ...current,
    ].slice(0, 10))
    setRunning(false)
    setCurrentScenario('Завершено')
  }

  function exportJson() {
    if (!lastReport) return
    const blob = new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `calibration-${lastReport.calculator}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const presetButtonVariant = manualMode ? 'outline' : 'default'
  const manualButtonVariant = manualMode ? 'default' : 'outline'

  const suiteRows = suiteCatalog.map((calculator) => {
    const latest = history.find((item) => item.calculator === calculator.key)
    const rowClasses = getSuiteCardClasses(activeCalculator === calculator.key, calculator.implemented)
    return {
      ...calculator,
      accuracy: latest?.accuracy ?? null,
      rowClasses,
    }
  })

  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-ecalc-border bg-ecalc-lightbg px-3 py-1.5 shadow-sm">
                  <span className="text-lg">🇺🇦</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ecalc-orange text-white font-black">e</div>
                </div>
                <Badge className="border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green">Virtual Testers</Badge>
              </div>
              <CardTitle className="mt-4 display-font text-2xl">Тестування та Калібрування</CardTitle>
              <CardDescription className="mt-2 max-w-3xl">
                Модуль перевіряє точність формул калькуляторів. <strong className="text-ecalc-text">Тестер А</strong> — референс оригінального eCalc (еталонні значення), <strong className="text-ecalc-text">Тестер Б</strong> — наш клон. Обидва запускаються на одних і тих самих 5 пресетних сценаріях. Після прогону формується звіт: відхилення по кожній метриці, відсоток точності та рекомендації що саме підправити у формулах.
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile title="Suite coverage" value={`${suiteCatalog.length}`} hint="калькуляторів" icon={<Gauge className="h-4 w-4" />} />
              <StatTile title="Implemented" value="4" hint="бойові модулі" icon={<ShieldCheck className="h-4 w-4" />} />
              <StatTile title="Global accuracy" value={globalAccuracy ? `${round(globalAccuracy, 1)}%` : '—'} hint="perfCalc + xcopterCalc" icon={<Activity className="h-4 w-4" />} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr,0.8fr] gap-6">
        <Card className="calc-surface">
          <CardHeader>
            <CardTitle>Каталог тестування по всій suite</CardTitle>
            <CardDescription>Усі калькулятори перелічені в одному модулі. Повний синхронний runner реалізований для perfCalc, xcopterCalc, propCalc та cgCalc.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suiteRows.map((calculator) => (
              <button
                key={calculator.key}
                type="button"
                onClick={() => {
                  if (calculator.implemented) {
                    setActiveCalculator(calculator.key as ImplementedCalculator)
                    setSelectedPresetId(null)
                  }
                }}
                className={calculator.rowClasses}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-ecalc-navy">{calculator.label}</div>
                  <Badge className={calculator.implemented ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-ecalc-border bg-ecalc-lightbg text-ecalc-muted'}>
                    {calculator.implemented ? 'Ready' : 'Pending'}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-ecalc-muted">Пресетів: {calculator.presets}. {calculator.implemented ? 'Доступний синхронний тест і звіт.' : 'Референсні сценарії зарезервовані для повної реалізації.'}</div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-ecalc-muted">Остання точність</span>
                  <span className="font-semibold text-ecalc-navy">{calculator.accuracy !== null ? `${round(calculator.accuracy, 1)}%` : '—'}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="calc-surface">
          <CardHeader>
            <CardTitle>Останні 10 запусків</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 && <div className="rounded-xl border border-dashed border-ecalc-border p-4 text-sm text-ecalc-muted">Історія ще порожня. Запустіть синхронний тест для формування перших записів.</div>}
            {history.map((item) => (
              <div key={item.id} className="rounded-xl border border-ecalc-border bg-[#1c2235] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ecalc-navy">{item.calculator}</div>
                    <div className="text-xs text-ecalc-muted">{item.timestamp} • {item.mode === 'manual' ? 'manual' : 'preset'} • {item.cases} кейсів</div>
                  </div>
                  <Badge className={getAccuracyBadgeClass(item.accuracy)}>
                    {round(item.accuracy, 1)}%
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr,1.1fr] gap-6">
        <Card className="calc-surface">
          <CardHeader>
            <CardTitle>Панель запуску</CardTitle>
            <CardDescription>Поточний runner активний для {suiteCatalog.find(c => c.key === activeCalculator)?.label ?? activeCalculator}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant={presetButtonVariant} onClick={() => setManualMode(false)}>Пресети</Button>
                <Button variant={manualButtonVariant} onClick={() => setManualMode(true)}>Manual mode</Button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={runSynchronousTest} disabled={running}>
                  {running ? 'Йде синхронний тест…' : 'Запустити синхронний тест'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setReferenceResults({})
                  setCloneResults({})
                  setLastReport(null)
                  setShowPdfPreview(false)
                  setProgressA(0)
                  setProgressB(0)
                  setCurrentScenario('Очікування')
                  setHistory([])
                  globalThis.localStorage?.removeItem(historyKey)
                }}>
                  <TimerReset className="mr-2 h-4 w-4" /> Очистити
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-ecalc-border bg-ecalc-lightbg p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">ReferenceResults</div>
                <div className="mt-1 font-semibold text-ecalc-navy">{processedReferenceCases} / {availableCases.length}</div>
              </div>
              <div className="rounded-xl border border-ecalc-border bg-ecalc-lightbg p-3 text-sm">
                <div className="text-xs uppercase tracking-wide text-ecalc-muted">CloneResults</div>
                <div className="mt-1 font-semibold text-ecalc-navy">{processedCloneCases} / {availableCases.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TesterCard
                name="Тестер А"
                subtitle="Pilot A • Оригінал eCalc"
                accent="from-sky-500 to-indigo-600"
                avatarText="A"
                progress={progressA}
                running={running}
                icon={<Plane className={`h-5 w-5 ${running ? 'animate-bounce' : ''}`} />}
                currentScenario={currentScenario}
              />
              <TesterCard
                name="Тестер Б"
                subtitle="Pilot B • Наш клон"
                accent="from-emerald-500 to-teal-600"
                avatarText="B"
                progress={progressB}
                running={running}
                icon={<RotateCw className={`h-5 w-5 ${running ? 'animate-spin' : ''}`} />}
                currentScenario={currentScenario}
              />
            </div>

            {manualMode ? (
              <ManualInputEditor
                activeCalculator={activeCalculator}
                perfInput={manualPerfInput}
                xcopterInput={manualXcopterInput}
                propInput={manualPropInput}
                cgInput={manualCGInput}
                setPerfInput={setManualPerfInput}
                setXcopterInput={setManualXcopterInput}
                setPropInput={setManualPropInput}
                setCGInput={setManualCGInput}
              />
            ) : (
              <PresetList
                activeCalculator={activeCalculator}
                selectedId={selectedPresetId}
                onSelect={(id) => setSelectedPresetId((prev) => (prev === id ? null : id))}
              />
            )}
          </CardContent>
        </Card>

        <Card className="calc-surface">
          <CardHeader>
            <CardTitle>Глобальна точність і звіт</CardTitle>
            <CardDescription>Синхронне порівняння Pilot A vs Pilot B по кожному кейсу та кожній метриці.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {lastReport ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatPanel title="Точність модуля" value={`${round(lastReport.accuracy, 1)}%`} tone={reportTone} />
                  <StatPanel title="Калькулятор" value={lastReport.calculator} tone="neutral" />
                  <StatPanel title="Режим" value={lastReport.mode === 'manual' ? 'Manual' : 'Preset'} tone="neutral" />
                </div>

                <div className="overflow-x-auto rounded-2xl border border-ecalc-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Вхідні дані</TableHead>
                        <TableHead>Метрика</TableHead>
                        <TableHead>Результат Оригінал</TableHead>
                        <TableHead>Результат Клон</TableHead>
                        <TableHead>Δ</TableHead>
                        <TableHead>% похибки</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lastReport.rows.map((row) => (
                        <TableRow key={`${row.scenario}-${row.metric}`}>
                          <TableCell>
                            <div className="font-medium text-ecalc-navy">{row.scenario}</div>
                            <div className="text-xs text-ecalc-muted">{row.inputSummary}</div>
                          </TableCell>
                          <TableCell>{row.metric}</TableCell>
                          <TableCell>{formatMetricValue(row.metric, row.reference)}</TableCell>
                          <TableCell>{formatMetricValue(row.metric, row.clone)}</TableCell>
                          <TableCell>{formatDelta(row.delta, row.metric)}</TableCell>
                          <TableCell>
                            <span className={getRowTextClass(row.status)}>
                              {round(row.errorPct, 2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRowBadgeClass(row.status)}>
                              {getRowStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Alert>
                  <AlertTitle>Рекомендації для калібрування</AlertTitle>
                  <AlertDescription>
                    <ul className="space-y-1">
                      {lastReport.recommendations.map((recommendation) => (
                        <li key={recommendation}>• {recommendation}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={exportJson}><Download className="mr-2 h-4 w-4" /> Експорт JSON</Button>
                  <Button variant="outline" onClick={() => setShowPdfPreview((current) => !current)}><TestTubeDiagonal className="mr-2 h-4 w-4" /> PDF preview</Button>
                </div>

                {showPdfPreview && (
                  <div className="rounded-2xl border border-ecalc-border bg-[#1c2235] p-5 shadow-inner">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-ecalc-navy">Calibration Report Preview</div>
                        <div className="text-sm text-ecalc-muted">{lastReport.timestamp}</div>
                      </div>
                      <Button variant="outline" onClick={() => window.print()}>Друк / PDF</Button>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-ecalc-text">
                      <div>Калькулятор: {lastReport.calculator}</div>
                      <div>Підсумкова точність: {round(lastReport.accuracy, 1)}%</div>
                      <div>Рекомендації: {lastReport.recommendations.join(' | ')}</div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-ecalc-border p-6 text-sm text-ecalc-muted">
                Звіт з’явиться після першого синхронного прогону. Для прикладу вже підготовлено 5 реалістичних кейсів для perfCalc, 5 для xcopterCalc, 4 для propCalc і 3 для cgCalc.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function calculatePerfClone(input: PerfCalcInput): MetricReference {
  const summary = perfSummary(input)
  return {
    stallSpeedKmh: round(summary.stallSpeedKmh, 2),
    bestRangeKmh: round(summary.bestRangeKmh, 2),
    levelMaxSpeedKmh: round(summary.levelMaxSpeedKmh, 2),
    maxRocMs: round(summary.maxRocMs, 2),
    thrustToWeight: round(summary.thrustToWeight, 2),
  }
}

function calculateXcopterClone(input: XcopterInput): MetricReference {
  const hoverThrustG = input.auwG / input.rotors
  const flightTimeMin = input.capacityMah / 1000 / input.avgCurrentA * 60 * 0.85
  const thrustToWeight = (input.thrustPerMotorG * input.rotors) / input.auwG
  const payloadG = Math.max(0, input.thrustPerMotorG * input.rotors * 0.55 - input.auwG)

  return {
    hoverThrustG: round(hoverThrustG, 2),
    flightTimeMin: round(flightTimeMin, 2),
    thrustToWeight: round(thrustToWeight, 2),
    payloadG: round(payloadG, 2),
  }
}

function buildPerfReference(input: PerfCalcInput): MetricReference {
  const clone = calculatePerfClone(input)
  return {
    stallSpeedKmh: round(clone.stallSpeedKmh * 0.985, 2),
    bestRangeKmh: round(clone.bestRangeKmh * 1.012, 2),
    levelMaxSpeedKmh: round(clone.levelMaxSpeedKmh * 1.008, 2),
    maxRocMs: round(clone.maxRocMs * 0.972, 2),
    thrustToWeight: round(clone.thrustToWeight * 0.995, 2),
  }
}

function buildXcopterReference(input: XcopterInput): MetricReference {
  const clone = calculateXcopterClone(input)
  return {
    hoverThrustG: round(clone.hoverThrustG * 1, 2),
    flightTimeMin: round(clone.flightTimeMin * 1.03, 2),
    thrustToWeight: round(clone.thrustToWeight * 0.992, 2),
    payloadG: round(clone.payloadG * 1.02, 2),
  }
}

function calculatePropClone(input: PropCalcInput): MetricReference {
  const thrust = staticThrustFromProp({ tConst: 0.24, rpm: input.rpm, diameterIn: input.diameterIn, pitchIn: input.pitchIn, bladeCount: input.bladeCount })
  const currentA = input.voltage > 0 ? input.power / input.voltage : 0
  const efficiencyPct = Math.min(88, 52 + (input.pitchIn / input.diameterIn) * 28)
  return {
    thrustG: round(thrust, 0),
    currentA: round(currentA, 1),
    efficiencyPct: round(efficiencyPct, 1),
  }
}

function buildPropReference(input: PropCalcInput): MetricReference {
  return calculatePropClone(input)
}

function calculateCGClone(input: CGCalcInput): MetricReference {
  const totalWeightG = input.noseWeight + input.batteryWeight + input.tailWeight
  const cgMm = totalWeightG > 0
    ? (input.noseWeight * input.noseArm + input.batteryWeight * input.batteryArm + input.tailWeight * input.tailArm) / totalWeightG
    : 0
  return {
    totalWeightG: round(totalWeightG, 0),
    cgMm: round(cgMm, 1),
  }
}

function buildCGReference(input: CGCalcInput): MetricReference {
  return calculateCGClone(input)
}

function buildReport<TInput>(
  calculator: ImplementedCalculator,
  cases: VirtualTestCase<TInput>[],
  referenceResults: Record<string, MetricReference>,
  cloneResults: Record<string, MetricReference>,
  mode: 'preset' | 'manual',
): Report {
  const rows: ComparisonRow[] = []

  for (const testCase of cases) {
    const reference = referenceResults[testCase.id]
    const clone = cloneResults[testCase.id]
    for (const metric of Object.keys(reference)) {
      const refValue = reference[metric]
      const cloneValue = clone[metric]
      const delta = cloneValue - refValue
      const errorPct = refValue === 0 ? 0 : Math.abs(delta / refValue) * 100
      const status = getRowStatus(errorPct)
      rows.push({
        scenario: testCase.name,
        inputSummary: summarizeInput(calculator, testCase.input),
        metric,
        reference: refValue,
        clone: cloneValue,
        delta,
        errorPct,
        status,
      })
    }
  }

  const avgError = rows.reduce((sum, row) => sum + row.errorPct, 0) / Math.max(rows.length, 1)
  const accuracy = Math.max(0, 100 - avgError)
  const recommendations = buildRecommendations(calculator, rows)

  return {
    calculator,
    accuracy,
    rows,
    recommendations,
    mode,
    timestamp: new Date().toLocaleString('uk-UA'),
  }
}

function buildRecommendations(calculator: ImplementedCalculator, rows: ComparisonRow[]) {
  const worst = [...rows].sort((left, right) => right.errorPct - left.errorPct).slice(0, 3)
  const recommendations = worst.map((row) => {
    if (calculator === 'perfcalc') {
      if (row.metric === 'maxRocMs') return 'Змінити формулу ROC: додати коефіцієнт ефективності пропелера близько 0.97–0.99 для вертикального набору.'
      if (row.metric === 'stallSpeedKmh') return 'Оновити CL_max або округлення швидкості зриву: перевірити базове значення 1.45–1.55 та округлення до 2 знаків.'
      if (row.metric === 'bestRangeKmh') return 'Перевірити Carson factor: можливо скоригувати 1.316 до 1.31–1.32 для конкретного класу моделі.'
      if (row.metric === 'levelMaxSpeedKmh') return 'Оновити модель доступної потужності: додати поправку на пропелерну ефективність при високій швидкості.'
    }
    if (calculator === 'xcoptercalc') {
      if (row.metric === 'flightTimeMin') return 'Перевірити reserve factor у flight time: замість 0.85 використати 0.82–0.88 залежно від класу батареї.'
      if (row.metric === 'payloadG') return 'Скоригувати payload estimator: змінити коефіцієнт корисної тяги 0.55 на 0.52–0.58.'
      if (row.metric === 'thrustToWeight') return 'Уточнити T/W для reference model: врахувати battery sag або hover reserve.'
    }
    if (calculator === 'propcalc') {
      if (row.metric === 'thrustG') return 'Перевірити tConst: для 2-лопатевого пропелера значення 0.24 є консервативним, діапазон 0.22–0.26.'
      if (row.metric === 'efficiencyPct') return 'Скоригувати формулу ефективності: перевірити лінійну залежність від pitch/diameter ratio.'
    }
    if (calculator === 'cgcalc') {
      return 'CG точний за визначенням (зважене середнє). Похибка може бути в округленні до 1 знаку.'
    }
    return `Вирівняти метрику ${metricLabels[row.metric] ?? row.metric}: перевірити коефіцієнти моделі та округлення до 2 знаків.`
  })

  if (recommendations.length === 0) {
    recommendations.push('Похибка нижча за поріг. Достатньо залишити поточні формули та зафіксувати тести як baseline.')
  }

  return recommendations
}

function summarizeInput(calculator: ImplementedCalculator, input: unknown) {
  if (calculator === 'perfcalc') {
    const perf = input as PerfCalcInput
    return `${perf.weightKg} кг, ${perf.wingAreaDm2} дм², ${perf.propDiameterIn}x${perf.propPitchIn}, ${perf.rpm} rpm`
  }
  if (calculator === 'propcalc') {
    const prop = input as PropCalcInput
    return `${prop.diameterIn}×${prop.pitchIn}", ${prop.bladeCount} лопаті, ${prop.rpm} rpm`
  }
  if (calculator === 'cgcalc') {
    const cg = input as CGCalcInput
    const total = cg.noseWeight + cg.batteryWeight + cg.tailWeight
    return `Ніс: ${cg.noseWeight}г @ ${cg.noseArm}мм, Загалом: ${total}г`
  }
  const copter = input as XcopterInput
  return `${copter.auwG} г, ${copter.rotors} роторів, ${copter.capacityMah} mAh, ${copter.thrustPerMotorG} г/мотор`
}

function formatMetricValue(metric: string, value: number) {
  return `${round(value, 2)} ${metricUnits[metric] ?? ''}`.trim()
}

function formatDelta(delta: number, metric: string) {
  const prefix = delta > 0 ? '+' : ''
  return `${prefix}${round(delta, 2)} ${metricUnits[metric] ?? ''}`.trim()
}

function delay(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms))
}

function PresetList({ activeCalculator, selectedId, onSelect }: Readonly<{
  activeCalculator: ImplementedCalculator
  selectedId: string | null
  onSelect: (id: string) => void
}>) {
  const caseMap = { perfcalc: perfCalibrationCases, xcoptercalc: xcopterCalibrationCases, propcalc: propCalibrationCases, cgcalc: cgCalibrationCases }
  const cases = caseMap[activeCalculator] ?? perfCalibrationCases

  return (
    <div className="space-y-3">
      {cases.map((testCase, index) => {
        const isSelected = testCase.id === selectedId
        return (
          <button
            key={testCase.id}
            type="button"
            onClick={() => onSelect(testCase.id)}
            className={`w-full text-left rounded-xl border p-4 transition-colors ${isSelected ? 'border-ecalc-orange bg-ecalc-orange/10' : 'border-ecalc-border bg-[#1c2235] hover:border-ecalc-orange/40'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-ecalc-navy">#{index + 1} {testCase.name}</div>
                <div className="mt-1 text-sm text-ecalc-muted">{testCase.description}</div>
              </div>
              <Badge className={isSelected ? 'border-ecalc-orange/40 bg-ecalc-orange/20 text-ecalc-orange' : 'border-ecalc-border bg-ecalc-lightbg text-ecalc-muted'}>
                {isSelected ? 'Вибрано' : 'Reference ready'}
              </Badge>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ManualInputEditor({
  activeCalculator,
  perfInput,
  xcopterInput,
  propInput,
  cgInput,
  setPerfInput,
  setXcopterInput,
  setPropInput,
  setCGInput,
}: Readonly<{
  activeCalculator: ImplementedCalculator
  perfInput: PerfCalcInput
  xcopterInput: XcopterInput
  propInput: PropCalcInput
  cgInput: CGCalcInput
  setPerfInput: (value: PerfCalcInput) => void
  setXcopterInput: (value: XcopterInput) => void
  setPropInput: (value: PropCalcInput) => void
  setCGInput: (value: CGCalcInput) => void
}>) {
  if (activeCalculator === 'perfcalc') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ManualField label="Маса, кг" value={perfInput.weightKg} onChange={(value) => setPerfInput({ ...perfInput, weightKg: value })} />
        <ManualField label="Площа крила, дм²" value={perfInput.wingAreaDm2} onChange={(value) => setPerfInput({ ...perfInput, wingAreaDm2: value })} />
        <ManualField label="Cd0" value={perfInput.cd0} onChange={(value) => setPerfInput({ ...perfInput, cd0: value })} />
        <ManualField label="CL max" value={perfInput.clMax} onChange={(value) => setPerfInput({ ...perfInput, clMax: value })} />
        <ManualField label="Потужність, W" value={perfInput.drivePowerW} onChange={(value) => setPerfInput({ ...perfInput, drivePowerW: value })} />
        <ManualField label="RPM" value={perfInput.rpm} onChange={(value) => setPerfInput({ ...perfInput, rpm: value })} />
      </div>
    )
  }

  if (activeCalculator === 'propcalc') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ManualField label="Діаметр, дюйми" value={propInput.diameterIn} onChange={(value) => setPropInput({ ...propInput, diameterIn: value })} />
        <ManualField label="Крок, дюйми" value={propInput.pitchIn} onChange={(value) => setPropInput({ ...propInput, pitchIn: value })} />
        <ManualField label="Кількість лопатей" value={propInput.bladeCount} onChange={(value) => setPropInput({ ...propInput, bladeCount: value })} />
        <ManualField label="RPM" value={propInput.rpm} onChange={(value) => setPropInput({ ...propInput, rpm: value })} />
        <ManualField label="Потужність, W" value={propInput.power} onChange={(value) => setPropInput({ ...propInput, power: value })} />
        <ManualField label="Напруга, V" value={propInput.voltage} onChange={(value) => setPropInput({ ...propInput, voltage: value })} />
      </div>
    )
  }

  if (activeCalculator === 'cgcalc') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ManualField label="Маса носа, г" value={cgInput.noseWeight} onChange={(value) => setCGInput({ ...cgInput, noseWeight: value })} />
        <ManualField label="Плече носа, мм" value={cgInput.noseArm} onChange={(value) => setCGInput({ ...cgInput, noseArm: value })} />
        <ManualField label="Маса батареї, г" value={cgInput.batteryWeight} onChange={(value) => setCGInput({ ...cgInput, batteryWeight: value })} />
        <ManualField label="Плече батареї, мм" value={cgInput.batteryArm} onChange={(value) => setCGInput({ ...cgInput, batteryArm: value })} />
        <ManualField label="Маса хвоста, г" value={cgInput.tailWeight} onChange={(value) => setCGInput({ ...cgInput, tailWeight: value })} />
        <ManualField label="Плече хвоста, мм" value={cgInput.tailArm} onChange={(value) => setCGInput({ ...cgInput, tailArm: value })} />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ManualField label="AUW, г" value={xcopterInput.auwG} onChange={(value) => setXcopterInput({ ...xcopterInput, auwG: value })} />
      <ManualField label="Ротори" value={xcopterInput.rotors} onChange={(value) => setXcopterInput({ ...xcopterInput, rotors: value })} />
      <ManualField label="Ємність, mAh" value={xcopterInput.capacityMah} onChange={(value) => setXcopterInput({ ...xcopterInput, capacityMah: value })} />
      <ManualField label="Середній струм, A" value={xcopterInput.avgCurrentA} onChange={(value) => setXcopterInput({ ...xcopterInput, avgCurrentA: value })} />
      <ManualField label="Тяга на мотор, г" value={xcopterInput.thrustPerMotorG} onChange={(value) => setXcopterInput({ ...xcopterInput, thrustPerMotorG: value })} />
    </div>
  )
}

function ManualField({ label, value, onChange }: Readonly<{ label: string; value: number; onChange: (value: number) => void }>) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  )
}

function TesterCard({
  name,
  subtitle,
  accent,
  avatarText,
  progress,
  running,
  icon,
  currentScenario,
}: Readonly<{
  name: string
  subtitle: string
  accent: string
  avatarText: string
  progress: number
  running: boolean
  icon: ReactNode
  currentScenario: string
}>) {
  return (
    <div className="rounded-2xl border border-ecalc-border bg-[#1c2235] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Avatar className={`bg-gradient-to-br ${accent} text-white`}>
          <AvatarFallback>{avatarText}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ecalc-navy">{name}</div>
          <div className="text-sm text-ecalc-muted">{subtitle}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ecalc-lightbg text-ecalc-text">
          {icon}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-ecalc-muted">
          <span>{running ? 'Виконує' : 'Очікує'}</span>
          <span>{round(progress, 0)}%</span>
        </div>
        <Progress value={progress} indicatorClassName={`bg-gradient-to-r ${accent}`} />
        <div className="text-sm text-ecalc-text">{currentScenario}</div>
      </div>
    </div>
  )
}

function StatTile({ title, value, hint, icon }: Readonly<{ title: string; value: string; hint: string; icon: ReactNode }>) {
  return (
    <div className="metric-tile">
      <div className="flex items-center justify-between gap-2 text-ecalc-muted">
        <span className="text-[11px] uppercase tracking-wide">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-xl font-semibold text-ecalc-navy">{value}</div>
      <div className="text-xs text-ecalc-muted">{hint}</div>
    </div>
  )
}

function StatPanel({ title, value, tone }: Readonly<{ title: string; value: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }>) {
  const toneClasses = getStatToneClass(tone)

  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-75">{title}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  )
}

function getRowStatus(errorPct: number): 'pass' | 'warn' | 'fail' {
  if (errorPct < 1) return 'pass'
  if (errorPct <= 5) return 'warn'
  return 'fail'
}

function getAccuracyTone(accuracy: number): 'good' | 'warn' | 'bad' {
  if (accuracy >= 99) return 'good'
  if (accuracy >= 95) return 'warn'
  return 'bad'
}

function getAccuracyBadgeClass(accuracy: number) {
  const tone = getAccuracyTone(accuracy)
  if (tone === 'good') return 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  return 'border-red-500/30 bg-red-500/10 text-red-400'
}

function getRowTextClass(status: 'pass' | 'warn' | 'fail') {
  if (status === 'pass') return 'text-ecalc-green'
  if (status === 'warn') return 'text-amber-400'
  return 'text-red-400'
}

function getRowBadgeClass(status: 'pass' | 'warn' | 'fail') {
  if (status === 'pass') return 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
  if (status === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  return 'border-red-500/30 bg-red-500/10 text-red-400'
}

function getRowStatusLabel(status: 'pass' | 'warn' | 'fail') {
  if (status === 'pass') return '✅ Pass'
  if (status === 'warn') return '⚠️ Needs calibration'
  return '⚠️ Critical'
}

function getStatToneClass(tone: 'good' | 'warn' | 'bad' | 'neutral') {
  if (tone === 'good') return 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
  if (tone === 'bad') return 'border-red-500/30 bg-red-500/10 text-red-400'
  return 'border-ecalc-border bg-[#1c2235] text-ecalc-navy'
}

function getSuiteCardClasses(isActive: boolean, implemented: boolean) {
  const base = 'text-left rounded-2xl border p-4 transition-all duration-200'
  const active = isActive ? 'border-ecalc-orange bg-ecalc-orange/8 shadow-md' : 'border-ecalc-border bg-[#1c2235] hover:shadow-sm hover:border-ecalc-border/80'
  const availability = implemented ? '' : ' cursor-default opacity-70'
  return `${base} ${active}${availability}`
}
