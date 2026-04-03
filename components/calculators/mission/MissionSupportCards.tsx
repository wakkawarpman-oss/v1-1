'use client'

import { useEffect, useState } from 'react'
import { Battery, Navigation, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useIntegrationState } from '@/hooks/useIntegrationState'
import {
  timeOnTarget,
  batteryRemainingEst,
  loiterBudgetAtTarget,
  windAdjustedPNR,
  multiLegFeasibility,
  type BatteryRemainingResult,
  type LoiterBudgetResult,
  type WindPNRResult,
  type LegResult,
} from '@/lib/mission-planning'

export function TimeOnTargetCard() {
  const [totState, setTotState] = usePersistedState('mission.tot', { distanceKm: 15, groundSpeedKmh: 80 })
  const [totResult, setTotResult] = useState<number | null>(null)

  return (
    <ToolCard
      icon={<Navigation className="h-4 w-4" />}
      title="Час до цілі (ETA)"
      description="Скільки хвилин потрібно від бази до точки призначення на заданій швидкості."
    >
      <Field label="Відстань до цілі, км">
        <Input
          type="number"
          step="0.1"
          value={totState.distanceKm}
          onChange={(e) => setTotState((s) => ({ ...s, distanceKm: Number(e.target.value) }))}
        />
      </Field>
      <Field label="Наземна швидкість, км/год">
        <Input
          type="number"
          value={totState.groundSpeedKmh}
          onChange={(e) => setTotState((s) => ({ ...s, groundSpeedKmh: Number(e.target.value) }))}
        />
      </Field>
      <Button onClick={() => setTotResult(timeOnTarget(totState))}>Розрахувати</Button>
      {totResult !== null && (
        <ResultBox copyValue={formatToolNumber(totResult, 1)}>
          ETA: <span className="font-semibold text-ecalc-navy">{formatToolNumber(totResult, 1)} хв</span>
        </ResultBox>
      )}
    </ToolCard>
  )
}

export function BatteryRemainingCard() {
  const [remState, setRemState] = usePersistedState('mission.remaining', {
    totalMah: 5000,
    avgCurrentA: 20,
    elapsedMinutes: 10,
  })
  const [remResult, setRemResult] = useState<BatteryRemainingResult | null>(null)
  const integration = useIntegrationState()

  useEffect(() => {
    setRemState((prev) => {
      const next = {
        ...prev,
        totalMah: integration.state.batteryCapacityMah,
        avgCurrentA: integration.state.hoverCurrentA,
      }
      if (next.totalMah === prev.totalMah && Math.abs(next.avgCurrentA - prev.avgCurrentA) < 0.05) return prev
      return next
    })
  }, [integration.state.batteryCapacityMah, integration.state.hoverCurrentA, setRemState])

  return (
    <ToolCard
      icon={<Battery className="h-4 w-4" />}
      title="Залишок батареї (в польоті)"
      description="Оперативна оцінка залишку заряду та часу польоту за потягнутим часом."
    >
      <Field label="Повна ємність батареї, mAh">
        <Input
          type="number"
          value={remState.totalMah}
          onChange={(e) => setRemState((s) => ({ ...s, totalMah: Number(e.target.value) }))}
        />
      </Field>
      <Field label="Середній струм, А">
        <Input
          type="number"
          step="0.1"
          value={remState.avgCurrentA}
          onChange={(e) => setRemState((s) => ({ ...s, avgCurrentA: Number(e.target.value) }))}
        />
      </Field>
      <Field label="Пройшло часу, хв">
        <Input
          type="number"
          step="0.5"
          value={remState.elapsedMinutes}
          onChange={(e) => setRemState((s) => ({ ...s, elapsedMinutes: Number(e.target.value) }))}
        />
      </Field>
      <Button onClick={() => setRemResult(batteryRemainingEst(remState))}>Розрахувати</Button>
      {remResult && (
        <>
          <ResultBox copyValue={formatToolNumber(remResult.remainingMah, 0)}>
            Залишок: <span className="font-semibold text-ecalc-navy">{formatToolNumber(remResult.remainingMah, 0)} mAh</span>{' '}
            <span className="text-xs text-ecalc-muted">({formatToolNumber(remResult.remainingPct, 1)} %)</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(remResult.timeRemainingMin, 1)}>
            Час до розрядки: <span className="font-semibold text-ecalc-navy">{formatToolNumber(remResult.timeRemainingMin, 1)} хв</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}

export function LoiterBudgetCard() {
  const [loiterState, setLoiterState] = usePersistedState('mission.loiter.v2', {
    batteryMah: 5000,
    transitCurrentA: 20,
    outboundKm: 3,
    speedKmh: 60,
    hoverCurrentA: 30,
    inboundKm: 3,
    reservePct: 20,
  })
  const [loiterResult, setLoiterResult] = useState<LoiterBudgetResult | null>(null)
  const integration = useIntegrationState()

  useEffect(() => {
    setLoiterState((prev) => {
      const next = {
        ...prev,
        batteryMah: integration.state.batteryCapacityMah,
        hoverCurrentA: integration.state.hoverCurrentA,
      }
      if (
        next.batteryMah === prev.batteryMah &&
        Math.abs(next.hoverCurrentA - prev.hoverCurrentA) < 0.05
      ) {
        return prev
      }
      return next
    })
  }, [integration.state.batteryCapacityMah, integration.state.hoverCurrentA, setLoiterState])

  return (
    <ToolCard
      icon={<Target className="h-4 w-4" />}
      title="Бюджет зависання над ціллю"
      description="Скільки часу можна зависати над ціллю після перельоту туди-назад із резервом."
    >
      <Field label="Ємність батареї, mAh">
        <Input type="number" value={loiterState.batteryMah} onChange={(e) => setLoiterState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} />
      </Field>
      <Field label="Струм транзиту, А">
        <Input type="number" step="0.1" value={loiterState.transitCurrentA} onChange={(e) => setLoiterState((s) => ({ ...s, transitCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Виліт, км">
        <Input type="number" step="0.1" value={loiterState.outboundKm} onChange={(e) => setLoiterState((s) => ({ ...s, outboundKm: Number(e.target.value) }))} />
      </Field>
      <Field label="Швидкість, км/год">
        <Input type="number" value={loiterState.speedKmh} onChange={(e) => setLoiterState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Струм зависання, А">
        <Input type="number" step="0.1" value={loiterState.hoverCurrentA} onChange={(e) => setLoiterState((s) => ({ ...s, hoverCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Повернення, км">
        <Input type="number" step="0.1" value={loiterState.inboundKm} onChange={(e) => setLoiterState((s) => ({ ...s, inboundKm: Number(e.target.value) }))} />
      </Field>
      <Field label="Резерв, %">
        <Input type="number" min="0" max="100" value={loiterState.reservePct} onChange={(e) => setLoiterState((s) => ({ ...s, reservePct: Number(e.target.value) }))} />
      </Field>
      <Button onClick={() => setLoiterResult(loiterBudgetAtTarget(loiterState))}>Розрахувати</Button>
      {loiterResult && (
        <>
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${loiterResult.isFeasible ? 'border-ecalc-green/20 bg-ecalc-green/5 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {loiterResult.isFeasible ? '✓ Зависання можливе' : `⚠️ Місія неможлива: транзит потребує ${Math.round(loiterResult.transitUsedMah)} mAh > ємність ${loiterState.batteryMah} mAh`}
          </div>
          {loiterResult.isFeasible && (
            <>
              <ResultBox copyValue={formatToolNumber(loiterResult.loiterTimeMin, 1)}>
                Час зависання: <span className="font-semibold text-ecalc-navy">{formatToolNumber(loiterResult.loiterTimeMin, 1)} хв</span>
              </ResultBox>
              <ResultBox copyValue={formatToolNumber(loiterResult.transitUsedMah, 0)}>
                Транзит витратить: <span className="font-semibold text-ecalc-navy">{formatToolNumber(loiterResult.transitUsedMah, 0)} mAh</span>
              </ResultBox>
            </>
          )}
        </>
      )}
    </ToolCard>
  )
}

export function WindAdjustedPNRCard() {
  const [wpnrState, setWpnrState] = usePersistedState('mission.windpnr', {
    safeEnduranceHours: 0.5,
    tasKmh: 80,
    windSpeedKmh: 15,
    windFromDeg: 270,
    outboundTrackDeg: 90,
  })
  const [wpnrResult, setWpnrResult] = useState<WindPNRResult | null>(null)

  return (
    <ToolCard
      icon={<Navigation className="h-4 w-4" />}
      title="PNR з урахуванням вітру"
      description="Точка неповернення з поправкою на вітер: груднева швидкість відносно землі туди-назад."
    >
      <Field label="Безпечний ендюранс, год">
        <Input type="number" step="0.05" value={wpnrState.safeEnduranceHours} onChange={(e) => setWpnrState((s) => ({ ...s, safeEnduranceHours: Number(e.target.value) }))} />
      </Field>
      <Field label="TAS (швидкість відносно повітря), км/год">
        <Input type="number" value={wpnrState.tasKmh} onChange={(e) => setWpnrState((s) => ({ ...s, tasKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Швидкість вітру, км/год">
        <Input type="number" value={wpnrState.windSpeedKmh} onChange={(e) => setWpnrState((s) => ({ ...s, windSpeedKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Напрямок вітру, °" hint="Звідки дме вітер (0°=північ, 90°=схід)">
        <Input type="number" min="0" max="359" value={wpnrState.windFromDeg} onChange={(e) => setWpnrState((s) => ({ ...s, windFromDeg: Number(e.target.value) }))} />
      </Field>
      <Field label="Курс вильоту, °">
        <Input type="number" min="0" max="359" value={wpnrState.outboundTrackDeg} onChange={(e) => setWpnrState((s) => ({ ...s, outboundTrackDeg: Number(e.target.value) }))} />
      </Field>
      <Button onClick={() => setWpnrResult(windAdjustedPNR(wpnrState))}>Розрахувати</Button>
      {wpnrResult && (
        <>
          <ResultBox copyValue={formatToolNumber(wpnrResult.maxDistanceKm, 2)}>
            PNR відстань: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wpnrResult.maxDistanceKm, 2)} км</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(wpnrResult.timeToTurnMinutes, 1)}>
            Час до повороту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wpnrResult.timeToTurnMinutes, 1)} хв</span>
          </ResultBox>
          <div className="text-xs text-ecalc-muted">
            GS виліт: {formatToolNumber(wpnrResult.gsOutboundKmh, 1)} км/год · GS повернення: {formatToolNumber(wpnrResult.gsHomeboundKmh, 1)} км/год
          </div>
        </>
      )}
    </ToolCard>
  )
}

export function MultiLegFeasibilityCard() {
  const [mlState, setMlState] = usePersistedState('mission.multileg', {
    batteryMah: 5000,
    reservePct: 20,
    legs: [
      { distanceKm: 5, speedKmh: 60, avgCurrentA: 20 },
      { distanceKm: 3, speedKmh: 40, avgCurrentA: 30 },
      { distanceKm: 5, speedKmh: 60, avgCurrentA: 20 },
    ],
  })
  const [mlResult, setMlResult] = useState<LegResult[] | null>(null)

  return (
    <ToolCard
      icon={<Target className="h-4 w-4" />}
      title="Маршрут із кількох відрізків"
      description="Перевірка реалістичності кожного відрізку маршруту з урахуванням акумулятивного споживання."
    >
      <Field label="Ємність батареї, mAh">
        <Input type="number" value={mlState.batteryMah} onChange={(e) => setMlState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} />
      </Field>
      <Field label="Резерв, %">
        <Input type="number" min="0" max="100" value={mlState.reservePct} onChange={(e) => setMlState((s) => ({ ...s, reservePct: Number(e.target.value) }))} />
      </Field>

      {mlState.legs.map((leg, i) => (
        <div key={i} className="rounded-xl border border-ecalc-border/40 bg-ecalc-light/40 p-3 space-y-2">
          <p className="text-xs font-semibold text-ecalc-navy">Відрізок {i + 1}</p>
          <Field label="Дистанція, км">
            <Input
              type="number"
              step="0.1"
              value={leg.distanceKm}
              onChange={(e) => {
                const legs = [...mlState.legs]
                legs[i] = { ...legs[i], distanceKm: Number(e.target.value) }
                setMlState((s) => ({ ...s, legs }))
              }}
            />
          </Field>
          <Field label="Швидкість, км/год">
            <Input
              type="number"
              value={leg.speedKmh}
              onChange={(e) => {
                const legs = [...mlState.legs]
                legs[i] = { ...legs[i], speedKmh: Number(e.target.value) }
                setMlState((s) => ({ ...s, legs }))
              }}
            />
          </Field>
          <Field label="Струм, А">
            <Input
              type="number"
              step="0.1"
              value={leg.avgCurrentA}
              onChange={(e) => {
                const legs = [...mlState.legs]
                legs[i] = { ...legs[i], avgCurrentA: Number(e.target.value) }
                setMlState((s) => ({ ...s, legs }))
              }}
            />
          </Field>
        </div>
      ))}

      <Button onClick={() => setMlResult(multiLegFeasibility(mlState))}>Перевірити</Button>
      {mlResult && (
        <div className="space-y-1">
          {mlResult.map((leg) => (
            <div
              key={leg.legIndex}
              className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${leg.feasible ? 'border-ecalc-green/20 bg-ecalc-green/5 text-ecalc-navy' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}
            >
              <span>
                {leg.feasible ? '✓' : '✗'} Відрізок {leg.legIndex}: {formatToolNumber(leg.distanceKm, 1)} км · {formatToolNumber(leg.timeMin, 1)} хв
              </span>
              <span>{formatToolNumber(leg.usedMah, 0)} mAh</span>
            </div>
          ))}
        </div>
      )}
    </ToolCard>
  )
}
