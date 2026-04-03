'use client'

import { useState } from 'react'
import { Battery, Navigation, Target, MapPin, Wind, Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  missionEndurance,
  routeBatteryBudget,
  tacticalRadius,
  timeOnTarget,
  batteryRemainingEst,
  loiterBudgetAtTarget,
  windAdjustedPNR,
  multiLegFeasibility,
  type EnduranceResult,
  type RouteBudgetResult,
  type TacticalRadiusResult,
  type BatteryRemainingResult,
  type LoiterBudgetResult,
  type WindPNRResult,
  type LegResult,
} from '@/lib/mission-planning'
import { pointOfNoReturn, type PNRResult } from '@/lib/optics'
import { calculateInterception } from '@/lib/interception'
import { calculateGlideFootprint } from '@/lib/glide-footprint'

// ── Point of No Return (simple GS-based) ──────────────────────────────────────

type PNRState = { totalEnduranceMin: number; reserveMin: number; gsOutKmh: number; gsHomeKmh: number }
const PNR_DEFAULTS: PNRState = { totalEnduranceMin: 25, reserveMin: 5, gsOutKmh: 80, gsHomeKmh: 60 }

function PNRCard() {
  const [state, setState] = usePersistedState('mission.pnr', PNR_DEFAULTS)
  const [result, setResult] = useState<PNRResult | null>(null)

  function calculate() {
    const safeEnduranceHours = Math.max(0, state.totalEnduranceMin - state.reserveMin) / 60
    setResult(pointOfNoReturn({ safeEnduranceHours, gsOutboundKmh: state.gsOutKmh, gsHomeboundKmh: state.gsHomeKmh }))
  }

  return (
    <ToolCard icon={<MapPin className="h-4 w-4" />} title="PNR — точка беззворотного повернення" description="Проста модель GS-in: дальність виходу, після якої гарантоване повернення. Вітрова поправка — у картці PNR з вітром нижче.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ендюранс (всього), хв">
          <Input type="number" value={state.totalEnduranceMin} onChange={(e) => setState((s) => ({ ...s, totalEnduranceMin: Number(e.target.value) }))} />
        </Field>
        <Field label="Резерв, хв" hint="Недоторканний залишок">
          <Input type="number" value={state.reserveMin} onChange={(e) => setState((s) => ({ ...s, reserveMin: Number(e.target.value) }))} />
        </Field>
        <Field label="GS на вихід, км/год" hint="Наземна швидкість туди (з урахуванням вітру)">
          <Input type="number" value={state.gsOutKmh} onChange={(e) => setState((s) => ({ ...s, gsOutKmh: Number(e.target.value) }))} />
        </Field>
        <Field label="GS на повернення, км/год" hint="Наземна швидкість назад">
          <Input type="number" value={state.gsHomeKmh} onChange={(e) => setState((s) => ({ ...s, gsHomeKmh: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {result && result.maxDistanceKm > 0 && (
        <>
          <ResultBox copyValue={formatToolNumber(result.maxDistanceKm, 2)}>
            Дальність PNR: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.maxDistanceKm, 2)} км</span>
          </ResultBox>
          <ResultBox>
            Час до повороту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.timeToTurnMinutes, 1)} хв</span>
            <span className="ml-2 text-xs text-ecalc-muted">+ повернення {formatToolNumber(result.timeHomingMinutes, 1)} хв</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}

function EnduranceCard() {
  const [endState, setEndState] = usePersistedState('mission.endurance', {
    batteryMah: 5000, avgCurrentA: 20, speedKmh: 60, usablePct: 80, reservePct: 20,
  })
  const [endResult, setEndResult] = useState<EnduranceResult | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="Ендюранс та дальність" description="Час польоту, максимальна дальність та тактичний радіус дії.">
      <Field label="Ємність батареї, mAh">
        <Input type="number" value={endState.batteryMah} onChange={(e) => setEndState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} />
      </Field>
      <Field label="Середній струм, А">
        <Input type="number" step="0.1" value={endState.avgCurrentA} onChange={(e) => setEndState((s) => ({ ...s, avgCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Крейсерська швидкість, км/год">
        <Input type="number" value={endState.speedKmh} onChange={(e) => setEndState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Використовуваний заряд, %" hint="Рекомендовано 80% для LiPo">
        <Input type="number" min="0" max="100" value={endState.usablePct} onChange={(e) => setEndState((s) => ({ ...s, usablePct: Number(e.target.value) }))} />
      </Field>
      <Field label="Резерв на повернення, %" hint="Від загальної ємності батареї">
        <Input type="number" min="0" max="100" value={endState.reservePct} onChange={(e) => setEndState((s) => ({ ...s, reservePct: Number(e.target.value) }))} />
      </Field>
      <Button onClick={() => setEndResult(missionEndurance(endState))}>Розрахувати</Button>
      {endResult && <>
        <ResultBox copyValue={formatToolNumber(endResult.flightTimeMin, 1)}>
          Час польоту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.flightTimeMin, 1)} хв</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(endResult.maxRangeKm, 2)}>
          Максимальна дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.maxRangeKm, 2)} км</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(endResult.tacticalRadiusKm, 2)}>
          Тактичний радіус (туди): <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.tacticalRadiusKm, 2)} км</span>
        </ResultBox>
      </>}
    </ToolCard>
  )
}

function RouteBatteryBudgetCard() {
  const [routeState, setRouteState] = usePersistedState('mission.route', {
    distanceKm: 10, speedKmh: 60, avgCurrentA: 20, batteryMah: 5000, reservePct: 20,
  })
  const [routeResult, setRouteResult] = useState<RouteBudgetResult | null>(null)
  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="Бюджет маршруту" description="Чи вистачить батареї на маршрут заданої довжини із резервом.">
      <Field label="Відстань маршруту, км">
        <Input type="number" step="0.1" value={routeState.distanceKm} onChange={(e) => setRouteState((s) => ({ ...s, distanceKm: Number(e.target.value) }))} />
      </Field>
      <Field label="Швидкість, км/год">
        <Input type="number" value={routeState.speedKmh} onChange={(e) => setRouteState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Середній струм, А">
        <Input type="number" step="0.1" value={routeState.avgCurrentA} onChange={(e) => setRouteState((s) => ({ ...s, avgCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Ємність батареї, mAh">
        <Input type="number" value={routeState.batteryMah} onChange={(e) => setRouteState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} />
      </Field>
      <Field label="Резерв, %" hint="Мінімальний залишок після маршруту">
        <Input type="number" min="0" max="100" value={routeState.reservePct} onChange={(e) => setRouteState((s) => ({ ...s, reservePct: Number(e.target.value) }))} />
      </Field>
      <Button onClick={() => setRouteResult(routeBatteryBudget(routeState))}>Розрахувати</Button>
      {routeResult && <>
        {!routeResult.isFeasible && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-400">
            ⚠️ Маршрут нездійсненний — заряду не вистачить з урахуванням резерву
          </div>
        )}
        {routeResult.isFeasible && (
          <div className="rounded-xl border border-ecalc-green/20 bg-ecalc-green/5 px-3.5 py-2.5 text-sm font-medium text-ecalc-green">
            ✓ Маршрут здійсненний
          </div>
        )}
        <ResultBox copyValue={formatToolNumber(routeResult.timeMin, 1)}>
          Час маршруту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(routeResult.timeMin, 1)} хв</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(routeResult.usedPct, 1)}>
          Витрата заряду: <span className="font-semibold text-ecalc-navy">{formatToolNumber(routeResult.usedPct, 1)} %</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(routeResult.remainingMah, 0)}>
          Залишок після маршруту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(routeResult.remainingMah, 0)} mAh</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(routeResult.reserveMah, 0)}>
          Резерв (мінімум): <span className="font-semibold text-ecalc-navy">{formatToolNumber(routeResult.reserveMah, 0)} mAh</span>
        </ResultBox>
      </>}
    </ToolCard>
  )
}

function TacticalRadiusCard() {
  const [tacState, setTacState] = usePersistedState('mission.tactical', {
    batteryMah: 5000, cruiseCurrentA: 20, hoverCurrentA: 30, speedKmh: 60, reservePct: 20, loiterMin: 5,
  })
  const [tacResult, setTacResult] = useState<TacticalRadiusResult | null>(null)
  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Тактичний радіус" description="Максимальна відстань від бази із зависанням над ціллю та резервом.">
      <Field label="Ємність батареї, mAh">
        <Input type="number" value={tacState.batteryMah} onChange={(e) => setTacState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} />
      </Field>
      <Field label="Струм у польоті, А">
        <Input type="number" step="0.1" value={tacState.cruiseCurrentA} onChange={(e) => setTacState((s) => ({ ...s, cruiseCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Струм у зависанні, А">
        <Input type="number" step="0.1" value={tacState.hoverCurrentA} onChange={(e) => setTacState((s) => ({ ...s, hoverCurrentA: Number(e.target.value) }))} />
      </Field>
      <Field label="Крейсерська швидкість, км/год">
        <Input type="number" value={tacState.speedKmh} onChange={(e) => setTacState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} />
      </Field>
      <Field label="Резерв, %" hint="Залишок після повернення">
        <Input type="number" min="0" max="100" value={tacState.reservePct} onChange={(e) => setTacState((s) => ({ ...s, reservePct: Number(e.target.value) }))} />
      </Field>
      <Field label="Зависання над ціллю, хв">
        <Input type="number" step="0.5" value={tacState.loiterMin} onChange={(e) => setTacState((s) => ({ ...s, loiterMin: Number(e.target.value) }))} />
      </Field>
      <Button onClick={() => setTacResult(tacticalRadius(tacState))}>Розрахувати</Button>
      {tacResult && <>
        <ResultBox copyValue={formatToolNumber(tacResult.oneWayKm, 2)}>
          Радіус дії (туди): <span className="font-semibold text-ecalc-navy">{formatToolNumber(tacResult.oneWayKm, 2)} км</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(tacResult.totalRangeKm, 2)}>
          Загальний маршрут: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tacResult.totalRangeKm, 2)} км</span>
        </ResultBox>
      </>}
    </ToolCard>
  )
}

function TimeOnTargetCard() {
  const [totState, setTotState] = usePersistedState('mission.tot', { distanceKm: 15, groundSpeedKmh: 80 })
  const [totResult, setTotResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="Час до цілі (ETA)" description="Скільки хвилин потрібно від бази до точки призначення на заданій швидкості."><Field label="Відстань до цілі, км"><Input type="number" step="0.1" value={totState.distanceKm} onChange={(e) => setTotState((s) => ({ ...s, distanceKm: Number(e.target.value) }))} /></Field><Field label="Наземна швидкість, км/год"><Input type="number" value={totState.groundSpeedKmh} onChange={(e) => setTotState((s) => ({ ...s, groundSpeedKmh: Number(e.target.value) }))} /></Field><Button onClick={() => setTotResult(timeOnTarget(totState))}>Розрахувати</Button>{totResult !== null && (<ResultBox copyValue={formatToolNumber(totResult, 1)}>ETA: <span className="font-semibold text-ecalc-navy">{formatToolNumber(totResult, 1)} хв</span></ResultBox>)}</ToolCard>
  )
}

function BatteryRemainingCard() {
  const [remState, setRemState] = usePersistedState('mission.remaining', { totalMah: 5000, avgCurrentA: 20, elapsedMinutes: 10 })
  const [remResult, setRemResult] = useState<BatteryRemainingResult | null>(null)
  return (
    <ToolCard icon={<Battery className="h-4 w-4" />} title="Залишок батареї (в польоті)" description="Оперативна оцінка залишку заряду та часу польоту за потягнутим часом."><Field label="Повна ємність батареї, mAh"><Input type="number" value={remState.totalMah} onChange={(e) => setRemState((s) => ({ ...s, totalMah: Number(e.target.value) }))} /></Field><Field label="Середній струм, А"><Input type="number" step="0.1" value={remState.avgCurrentA} onChange={(e) => setRemState((s) => ({ ...s, avgCurrentA: Number(e.target.value) }))} /></Field><Field label="Пройшло часу, хв"><Input type="number" step="0.5" value={remState.elapsedMinutes} onChange={(e) => setRemState((s) => ({ ...s, elapsedMinutes: Number(e.target.value) }))} /></Field><Button onClick={() => setRemResult(batteryRemainingEst(remState))}>Розрахувати</Button>{remResult && <><ResultBox copyValue={formatToolNumber(remResult.remainingMah, 0)}>Залишок: <span className="font-semibold text-ecalc-navy">{formatToolNumber(remResult.remainingMah, 0)} mAh</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(remResult.remainingPct, 1)} %)</span></ResultBox><ResultBox copyValue={formatToolNumber(remResult.timeRemainingMin, 1)}>Час до розрядки: <span className="font-semibold text-ecalc-navy">{formatToolNumber(remResult.timeRemainingMin, 1)} хв</span></ResultBox></>}</ToolCard>
  )
}

function LoiterBudgetCard() {
  const [loiterState, setLoiterState] = usePersistedState('mission.loiter.v2', { batteryMah: 5000, transitCurrentA: 20, outboundKm: 3, speedKmh: 60, hoverCurrentA: 30, inboundKm: 3, reservePct: 20 })
  const [loiterResult, setLoiterResult] = useState<LoiterBudgetResult | null>(null)
  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Бюджет зависання над ціллю" description="Скільки часу можна зависати над ціллю після перельоту туди-назад із резервом."><Field label="Ємність батареї, mAh"><Input type="number" value={loiterState.batteryMah} onChange={(e) => setLoiterState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} /></Field><Field label="Струм транзиту, А"><Input type="number" step="0.1" value={loiterState.transitCurrentA} onChange={(e) => setLoiterState((s) => ({ ...s, transitCurrentA: Number(e.target.value) }))} /></Field><Field label="Виліт, км"><Input type="number" step="0.1" value={loiterState.outboundKm} onChange={(e) => setLoiterState((s) => ({ ...s, outboundKm: Number(e.target.value) }))} /></Field><Field label="Швидкість, км/год"><Input type="number" value={loiterState.speedKmh} onChange={(e) => setLoiterState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} /></Field><Field label="Струм зависання, А"><Input type="number" step="0.1" value={loiterState.hoverCurrentA} onChange={(e) => setLoiterState((s) => ({ ...s, hoverCurrentA: Number(e.target.value) }))} /></Field><Field label="Повернення, км"><Input type="number" step="0.1" value={loiterState.inboundKm} onChange={(e) => setLoiterState((s) => ({ ...s, inboundKm: Number(e.target.value) }))} /></Field><Field label="Резерв, %"><Input type="number" min="0" max="100" value={loiterState.reservePct} onChange={(e) => setLoiterState((s) => ({ ...s, reservePct: Number(e.target.value) }))} /></Field><Button onClick={() => setLoiterResult(loiterBudgetAtTarget(loiterState))}>Розрахувати</Button>{loiterResult && <><div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${loiterResult.isFeasible ? 'border-ecalc-green/20 bg-ecalc-green/5 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>{loiterResult.isFeasible ? '✓ Зависання можливе' : `⚠️ Місія неможлива: транзит потребує ${Math.round(loiterResult.transitUsedMah)} mAh > ємність ${loiterState.batteryMah} mAh`}</div>{loiterResult.isFeasible && <><ResultBox copyValue={formatToolNumber(loiterResult.loiterTimeMin, 1)}>Час зависання: <span className="font-semibold text-ecalc-navy">{formatToolNumber(loiterResult.loiterTimeMin, 1)} хв</span></ResultBox><ResultBox copyValue={formatToolNumber(loiterResult.transitUsedMah, 0)}>Транзит витратить: <span className="font-semibold text-ecalc-navy">{formatToolNumber(loiterResult.transitUsedMah, 0)} mAh</span></ResultBox></>}</>}</ToolCard>
  )
}

function WindAdjustedPNRCard() {
  const [wpnrState, setWpnrState] = usePersistedState('mission.windpnr', { safeEnduranceHours: 0.5, tasKmh: 80, windSpeedKmh: 15, windFromDeg: 270, outboundTrackDeg: 90 })
  const [wpnrResult, setWpnrResult] = useState<WindPNRResult | null>(null)
  return (
    <ToolCard icon={<Navigation className="h-4 w-4" />} title="PNR з урахуванням вітру" description="Точка неповернення з поправкою на вітер: груднева швидкість відносно землі туди/назад."><Field label="Безпечний ендюранс, год"><Input type="number" step="0.05" value={wpnrState.safeEnduranceHours} onChange={(e) => setWpnrState((s) => ({ ...s, safeEnduranceHours: Number(e.target.value) }))} /></Field><Field label="TAS (швидкість відносно повітря), км/год"><Input type="number" value={wpnrState.tasKmh} onChange={(e) => setWpnrState((s) => ({ ...s, tasKmh: Number(e.target.value) }))} /></Field><Field label="Швидкість вітру, км/год"><Input type="number" value={wpnrState.windSpeedKmh} onChange={(e) => setWpnrState((s) => ({ ...s, windSpeedKmh: Number(e.target.value) }))} /></Field><Field label="Напрямок вітру, °" hint="Звідки дме вітер (0°=північ, 90°=схід)"><Input type="number" min="0" max="359" value={wpnrState.windFromDeg} onChange={(e) => setWpnrState((s) => ({ ...s, windFromDeg: Number(e.target.value) }))} /></Field><Field label="Курс вильоту, °"><Input type="number" min="0" max="359" value={wpnrState.outboundTrackDeg} onChange={(e) => setWpnrState((s) => ({ ...s, outboundTrackDeg: Number(e.target.value) }))} /></Field><Button onClick={() => setWpnrResult(windAdjustedPNR(wpnrState))}>Розрахувати</Button>{wpnrResult && <><ResultBox copyValue={formatToolNumber(wpnrResult.maxDistanceKm, 2)}>PNR відстань: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wpnrResult.maxDistanceKm, 2)} км</span></ResultBox><ResultBox copyValue={formatToolNumber(wpnrResult.timeToTurnMinutes, 1)}>Час до повороту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(wpnrResult.timeToTurnMinutes, 1)} хв</span></ResultBox><div className="text-xs text-ecalc-muted">GS виліт: {formatToolNumber(wpnrResult.gsOutboundKmh, 1)} км/год · GS повернення: {formatToolNumber(wpnrResult.gsHomeboundKmh, 1)} км/год</div></>}</ToolCard>
  )
}

function MultiLegFeasibilityCard() {
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
    <ToolCard icon={<Target className="h-4 w-4" />} title="Маршрут із кількох відрізків" description="Перевірка реалістичності кожного відрізку маршруту з урахуванням акумулятивного споживання."><Field label="Ємність батареї, mAh"><Input type="number" value={mlState.batteryMah} onChange={(e) => setMlState((s) => ({ ...s, batteryMah: Number(e.target.value) }))} /></Field><Field label="Резерв, %"><Input type="number" min="0" max="100" value={mlState.reservePct} onChange={(e) => setMlState((s) => ({ ...s, reservePct: Number(e.target.value) }))} /></Field>{mlState.legs.map((leg, i) => (<div key={i} className="rounded-xl border border-ecalc-border/40 bg-ecalc-light/40 p-3 space-y-2"><p className="text-xs font-semibold text-ecalc-navy">Відрізок {i + 1}</p><Field label="Дистанція, км"><Input type="number" step="0.1" value={leg.distanceKm} onChange={(e) => { const legs = [...mlState.legs]; legs[i] = { ...legs[i], distanceKm: Number(e.target.value) }; setMlState((s) => ({ ...s, legs })) }} /></Field><Field label="Швидкість, км/год"><Input type="number" value={leg.speedKmh} onChange={(e) => { const legs = [...mlState.legs]; legs[i] = { ...legs[i], speedKmh: Number(e.target.value) }; setMlState((s) => ({ ...s, legs })) }} /></Field><Field label="Струм, А"><Input type="number" step="0.1" value={leg.avgCurrentA} onChange={(e) => { const legs = [...mlState.legs]; legs[i] = { ...legs[i], avgCurrentA: Number(e.target.value) }; setMlState((s) => ({ ...s, legs })) }} /></Field></div>))}<Button onClick={() => setMlResult(multiLegFeasibility(mlState))}>Перевірити</Button>{mlResult && <div className="space-y-1">{mlResult.map((leg) => (<div key={leg.legIndex} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs ${leg.feasible ? 'border-ecalc-green/20 bg-ecalc-green/5 text-ecalc-navy' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}><span>{leg.feasible ? '✓' : '✗'} Відрізок {leg.legIndex}: {formatToolNumber(leg.distanceKm, 1)} км · {formatToolNumber(leg.timeMin, 1)} хв</span><span>{formatToolNumber(leg.usedMah, 0)} mAh</span></div>))}</div>}</ToolCard>
  )
}

// ── Interception Kinematics ────────────────────────────────────────────────────

type InterceptState = {
  targetDistanceM: number
  targetSpeedMs: number
  targetHeadingDeg: number
  interceptorSpeedMs: number
  maxFlightTimeS: number
}

const INTERCEPT_DEFAULTS: InterceptState = {
  targetDistanceM: 2000,
  targetSpeedMs: 20,
  targetHeadingDeg: 90,
  interceptorSpeedMs: 50,
  maxFlightTimeS: 300,
}

function InterceptionCard() {
  const [state, setState] = usePersistedState('mission.intercept', INTERCEPT_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof calculateInterception> | null>(null)

  return (
    <ToolCard
      icon={<Crosshair className="h-4 w-4" />}
      title="Перехоплення рухомої цілі"
      description="Кінематика collision-course: кут упередження, час і дальність перехоплення."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Дистанція до цілі, м">
          <Input type="number" min="1" value={state.targetDistanceM}
            onChange={(e) => setState((s) => ({ ...s, targetDistanceM: Number(e.target.value) }))} />
        </Field>
        <Field label="Швидкість цілі, м/с">
          <Input type="number" min="0" step="0.5" value={state.targetSpeedMs}
            onChange={(e) => setState((s) => ({ ...s, targetSpeedMs: Number(e.target.value) }))} />
        </Field>
        <Field label="Курс цілі відн. LOS, °">
          <Input type="number" min="0" max="180" value={state.targetHeadingDeg}
            onChange={(e) => setState((s) => ({ ...s, targetHeadingDeg: Number(e.target.value) }))} />
        </Field>
        <Field label="Швидкість перехоплювача, м/с">
          <Input type="number" min="1" step="0.5" value={state.interceptorSpeedMs}
            onChange={(e) => setState((s) => ({ ...s, interceptorSpeedMs: Number(e.target.value) }))} />
        </Field>
        <Field label="Ресурс польоту, с">
          <Input type="number" min="1" value={state.maxFlightTimeS}
            onChange={(e) => setState((s) => ({ ...s, maxFlightTimeS: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={() => setResult(calculateInterception(state))}>Розрахувати</Button>
      {!result && <div className="text-xs text-ecalc-muted">Введіть параметри та натисніть «Розрахувати»</div>}
      {result && !result.isPossible && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400">
          ✗ Перехоплення неможливе — перевірте швидкості та кут.
        </div>
      )}
      {result?.isPossible && (
        <>
          <ResultBox copyValue={String(result.leadAngleDeg)}>
            Кут упередження φ: <span className="font-semibold text-ecalc-navy">{result.leadAngleDeg}°</span>
          </ResultBox>
          <ResultBox copyValue={String(result.timeToInterceptS)}>
            Час перехоплення: <span className="font-semibold text-ecalc-navy">{result.timeToInterceptS} с</span>
          </ResultBox>
          <ResultBox copyValue={String(result.interceptDistanceM)}>
            Дистанція перехоплювача: <span className="font-semibold text-ecalc-navy">{result.interceptDistanceM} м</span>
          </ResultBox>
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${result.batterySufficient ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {result.batterySufficient ? '✓ Ресурс достатній' : '✗ Не вистачить ресурсу'}
          </div>
        </>
      )}
    </ToolCard>
  )
}

// ── Emergency Glide Footprint ─────────────────────────────────────────────────

type GlideState = {
  altitudeAglM: number
  bestGlideSpeedMs: number
  maxLdRatio: number
  windSpeedMs: number
}

const GLIDE_DEFAULTS: GlideState = {
  altitudeAglM: 150,
  bestGlideSpeedMs: 18,
  maxLdRatio: 12,
  windSpeedMs: 5,
}

function GlideFootprintCard() {
  const [state, setState] = usePersistedState('mission.glide', GLIDE_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof calculateGlideFootprint> | null>(null)

  function calculate() {
    try { setResult(calculateGlideFootprint(state)) } catch { setResult(null) }
  }

  return (
    <ToolCard
      icon={<Wind className="h-4 w-4" />}
      title="Аварійне планування (відмова двигуна)"
      description="Площа досяжності при відмові двигуна: радіус планування з вітром і проти вітру."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Висота AGL, м">
          <Input type="number" min="1" value={state.altitudeAglM}
            onChange={(e) => setState((s) => ({ ...s, altitudeAglM: Number(e.target.value) }))} />
        </Field>
        <Field label="Швидкість планування V_bg, м/с">
          <Input type="number" min="1" step="0.5" value={state.bestGlideSpeedMs}
            onChange={(e) => setState((s) => ({ ...s, bestGlideSpeedMs: Number(e.target.value) }))} />
        </Field>
        <Field label="Аеродинамічна якість L/D">
          <Input type="number" min="1" step="0.5" value={state.maxLdRatio}
            onChange={(e) => setState((s) => ({ ...s, maxLdRatio: Number(e.target.value) }))} />
        </Field>
        <Field label="Швидкість вітру, м/с">
          <Input type="number" min="0" step="0.5" value={state.windSpeedMs}
            onChange={(e) => setState((s) => ({ ...s, windSpeedMs: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <div className="text-xs text-ecalc-muted">Введіть параметри та натисніть «Розрахувати»</div>}
      {result && (
        <>
          <ResultBox copyValue={String(result.radiusNoWindM)}>
            Радіус (без вітру): <span className="font-semibold text-ecalc-navy">{result.radiusNoWindM} м</span>
          </ResultBox>
          <ResultBox copyValue={String(result.maxDistanceDownwindM)}>
            Дальність за вітром: <span className="font-semibold text-ecalc-navy">{result.maxDistanceDownwindM} м</span>
          </ResultBox>
          <ResultBox copyValue={String(Math.max(0, result.maxDistanceUpwindM))}>
            Дальність проти вітру: <span className="font-semibold text-ecalc-navy">{result.maxDistanceUpwindM > 0 ? `${result.maxDistanceUpwindM} м` : '— зноситься'}</span>
          </ResultBox>
          <ResultBox copyValue={String(result.maxTimeAloftS)}>
            Час до землі: <span className="font-semibold text-ecalc-navy">{result.maxTimeAloftS} с</span>
          </ResultBox>
          <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${result.canHoldPosition ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
            {result.canHoldPosition ? '✓ Може утримувати позицію проти вітру' : '⚠ Повністю зноситься вітром'}
          </div>
        </>
      )}
    </ToolCard>
  )
}

export function MissionPlanningSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange">
              <Navigation className="h-4 w-4" />
            </span>
            Центр планування місії
          </CardTitle>
          <CardDescription>
            Розрахунок ендюрансу, тактичного радіусу та бюджету батареї для конкретного маршруту.
            Враховує резерв на повернення та зависання над ціллю.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Розраховує ендюранс', value: 'час + дальність' },
              { label: 'Тактичний радіус', value: 'туди + назад' },
              { label: 'Маршрутний бюджет', value: 'чи вистачить' },
            ].map((item) => (
              <div key={item.label} className="metric-tile text-center">
                <div className="text-xs text-ecalc-muted">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-ecalc-navy">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <EnduranceCard />
        <RouteBatteryBudgetCard />
        <TacticalRadiusCard />
        <TimeOnTargetCard />
        <BatteryRemainingCard />
        <LoiterBudgetCard />
        <PNRCard />
        <WindAdjustedPNRCard />
        <MultiLegFeasibilityCard />
        <InterceptionCard />
        <GlideFootprintCard />
      </div>
    </section>
  )
}
