'use client'

import { useState } from 'react'
import { Battery, Navigation, Target, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  missionEndurance,
  routeBatteryBudget,
  tacticalRadius,
  type EnduranceResult,
  type RouteBudgetResult,
  type TacticalRadiusResult,
} from '@/lib/mission-planning'
import { pointOfNoReturn, type PNRResult } from '@/lib/optics'

type PNRState = {
  totalEnduranceMin: number
  reserveMin: number
  gsOutKmh: number
  gsHomeKmh: number
}

const PNR_DEFAULTS: PNRState = {
  totalEnduranceMin: 25,
  reserveMin: 5,
  gsOutKmh: 80,
  gsHomeKmh: 60,
}

export function PNRCard() {
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

export function EnduranceCard() {
  const [endState, setEndState] = usePersistedState('mission.endurance', {
    batteryMah: 5000,
    avgCurrentA: 20,
    speedKmh: 60,
    usablePct: 80,
    reservePct: 20,
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
      {endResult && (
        <>
          <ResultBox copyValue={formatToolNumber(endResult.flightTimeMin, 1)}>
            Час польоту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.flightTimeMin, 1)} хв</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(endResult.maxRangeKm, 2)}>
            Максимальна дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.maxRangeKm, 2)} км</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(endResult.tacticalRadiusKm, 2)}>
            Тактичний радіус (туди): <span className="font-semibold text-ecalc-navy">{formatToolNumber(endResult.tacticalRadiusKm, 2)} км</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}

export function RouteBatteryBudgetCard() {
  const [routeState, setRouteState] = usePersistedState('mission.route', {
    distanceKm: 10,
    speedKmh: 60,
    avgCurrentA: 20,
    batteryMah: 5000,
    reservePct: 20,
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
      {routeResult && (
        <>
          {!routeResult.isFeasible && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm font-medium text-red-400">
              ⚠️ Маршрут нездійсненний — заряду не вистачить з урахуванням резерву
            </div>
          )}
          {routeResult.isFeasible && (
            <div className="rounded-xl border border-ecalc-green/20 bg-ecalc-green/5 px-3.5 py-2.5 text-sm font-medium text-ecalc-green">✓ Маршрут здійсненний</div>
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
        </>
      )}
    </ToolCard>
  )
}

export function TacticalRadiusCard() {
  const [tacState, setTacState] = usePersistedState('mission.tactical', {
    batteryMah: 5000,
    cruiseCurrentA: 20,
    hoverCurrentA: 30,
    speedKmh: 60,
    reservePct: 20,
    loiterMin: 5,
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
      {tacResult && (
        <>
          <ResultBox copyValue={formatToolNumber(tacResult.oneWayKm, 2)}>
            Радіус дії (туди): <span className="font-semibold text-ecalc-navy">{formatToolNumber(tacResult.oneWayKm, 2)} км</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(tacResult.totalRangeKm, 2)}>
            Загальний маршрут: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tacResult.totalRangeKm, 2)} км</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}
