'use client'

import { useState } from 'react'
import { Target, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Field, formatToolNumber, ResultBox, ToolCard, CalcEmptyState } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  crosswindDrift,
  drop3D,
  dropPointDrag,
  dropPointVacuum,
  dropSequenceSpread,
  impactKineticEnergy,
  safeStandoffDistance,
  targetLead,
  terminalVelocity,
  parachuteSizing,
  bombDrop,
  fuzeDelaySlide,
  FUZE_PRESETS,
  type Drop3DResult,
  type DropResult,
  type FuzeType,
  type KineticEnergyResult,
  type SequenceSpreadResult,
  type StandoffResult,
  type TargetLeadResult,
} from '@/lib/ballistics'

function VacuumDropCard() {
  const [vacState, setVacState] = usePersistedState('ballistics.vacuum', { altitudeM: 100, speedKmh: 80, headwindKmh: 0 })
  const [vacResult, setVacResult] = useState<DropResult | null>(null)

  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Без опору повітря (вакуум)" description="Ідеальна балістика — дає нижню межу горизонтального зміщення.">
      <Field label="Висота скидання, м"><Input type="number" min="1" value={vacState.altitudeM} onChange={(e) => setVacState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість носія, км/год"><Input type="number" min="0" value={vacState.speedKmh} onChange={(e) => setVacState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Зустрічний вітер, км/год" hint="+ зустрічний, − попутний"><Input type="number" value={vacState.headwindKmh} onChange={(e) => setVacState((s) => ({ ...s, headwindKmh: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setVacResult(dropPointVacuum(vacState))}>Розрахувати</Button>
      {vacResult && <>
        <ResultBox copyValue={formatToolNumber(vacResult.horizontalM, 1)}>Дальність падіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(vacResult.horizontalM, 1)} м</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(vacResult.timeS, 2)}>Час польоту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(vacResult.timeS, 2)} с</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(vacResult.impactSpeedMs, 1)}>Швидкість удару: <span className="font-semibold text-ecalc-navy">{formatToolNumber(vacResult.impactSpeedMs, 1)} м/с</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function DragDropCard() {
  const [dragState, setDragState] = usePersistedState('ballistics.drag', { altitudeM: 100, speedKmh: 80, headwindKmh: 0, massKg: 0.3, diameterM: 0.08, cdValue: 0.47 })
  const [dragResult, setDragResult] = useState<DropResult | null>(null)

  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="З опором повітря" description="Euler-інтегратор з Cd та площею поперечного перерізу. Реалістичніша оцінка.">
      <Field label="Висота скидання, м"><Input type="number" min="1" value={dragState.altitudeM} onChange={(e) => setDragState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість носія, км/год"><Input type="number" min="0" value={dragState.speedKmh} onChange={(e) => setDragState((s) => ({ ...s, speedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Зустрічний вітер, км/год" hint="+ зустрічний, − попутний"><Input type="number" value={dragState.headwindKmh} onChange={(e) => setDragState((s) => ({ ...s, headwindKmh: Number(e.target.value) }))} /></Field>
      <Field label="Маса вантажу, кг"><Input type="number" step="0.01" min="0.01" value={dragState.massKg} onChange={(e) => setDragState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
      <Field label="Діаметр (перетин), м" hint="Для сфери/циліндра"><Input type="number" step="0.01" min="0.01" value={dragState.diameterM} onChange={(e) => setDragState((s) => ({ ...s, diameterM: Number(e.target.value) }))} /></Field>
      <Field label="Cd" hint="Сфера ≈ 0.47, циліндр ≈ 0.82"><Input type="number" step="0.01" min="0.01" value={dragState.cdValue} onChange={(e) => setDragState((s) => ({ ...s, cdValue: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDragResult(dropPointDrag(dragState))}>Розрахувати</Button>
      {dragResult && <>
        <ResultBox copyValue={formatToolNumber(dragResult.horizontalM, 1)}>Дальність падіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dragResult.horizontalM, 1)} м</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(dragResult.releasePointM, 1)}>Точка скидання (до цілі): <span className="font-semibold text-ecalc-navy">{formatToolNumber(dragResult.releasePointM, 1)} м</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(dragResult.timeS, 2)}>Час польоту: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dragResult.timeS, 2)} с</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(dragResult.impactSpeedMs, 1)}>Швидкість удару: <span className="font-semibold text-ecalc-navy">{formatToolNumber(dragResult.impactSpeedMs, 1)} м/с</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function TargetLeadCard() {
  const [leadState, setLeadState] = usePersistedState('ballistics.lead', { altitudeM: 80, targetSpeedKmh: 20 })
  const [leadResult, setLeadResult] = useState<TargetLeadResult | null>(null)

  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Поправка на рух" description="Скільки метрів до цілі потрібно скидати, щоб потрапити — ціль рухається за час падіння.">
      <Field label="Висота скидання, м"><Input type="number" min="1" value={leadState.altitudeM} onChange={(e) => setLeadState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість цілі, км/год" hint="Наземна швидкість мети (піхота ≈ 5, БМП ≈ 30–60)"><Input type="number" min="0" value={leadState.targetSpeedKmh} onChange={(e) => setLeadState((s) => ({ ...s, targetSpeedKmh: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setLeadResult(targetLead(leadState))}>Розрахувати</Button>
      {leadResult && <>
        <ResultBox copyValue={formatToolNumber(leadResult.leadDistanceM, 1)}>Упередження: <span className="font-semibold text-ecalc-navy">{formatToolNumber(leadResult.leadDistanceM, 1)} м</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(leadResult.fallTimeS, 2)}>Час падіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(leadResult.fallTimeS, 2)} с</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function CrosswindDriftCard() {
  const [driftState, setDriftState] = usePersistedState('ballistics.drift', { altitudeM: 100, crosswindKmh: 15, massKg: 0.3, diameterM: 0.08, cdValue: 0.47 })
  const [driftResult, setDriftResult] = useState<number | null>(null)

  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Бічне відхилення від вітру" description="Горизонтальне бічне зміщення вантажу через поперечний вітер — Euler-інтегратор з Cd.">
      <Field label="Висота скидання, м"><Input type="number" value={driftState.altitudeM} onChange={(e) => setDriftState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Поперечний вітер, км/год"><Input type="number" value={driftState.crosswindKmh} onChange={(e) => setDriftState((s) => ({ ...s, crosswindKmh: Number(e.target.value) }))} /></Field>
      <Field label="Маса вантажу, кг"><Input type="number" step="0.01" min="0.01" value={driftState.massKg} onChange={(e) => setDriftState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
      <Field label="Діаметр, м"><Input type="number" step="0.01" min="0.01" value={driftState.diameterM} onChange={(e) => setDriftState((s) => ({ ...s, diameterM: Number(e.target.value) }))} /></Field>
      <Field label="Cd" hint="Сфера ≈ 0.47"><Input type="number" step="0.01" min="0.01" value={driftState.cdValue} onChange={(e) => setDriftState((s) => ({ ...s, cdValue: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setDriftResult(crosswindDrift(driftState))}>Розрахувати</Button>
      {driftResult !== null && (
        <ResultBox copyValue={formatToolNumber(driftResult, 2)}>Бічне відхилення: <span className="font-semibold text-ecalc-navy">{formatToolNumber(driftResult, 2)} м</span></ResultBox>
      )}
    </ToolCard>
  )
}

function TerminalVelocityCard() {
  const [tvState, setTvState] = usePersistedState('ballistics.terminal', { massKg: 0.3, diameterM: 0.08, cdValue: 0.47 })
  const [tvResult, setTvResult] = useState<number | null>(null)

  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Термінова швидкість (Vt)" description="Максимальна швидкість вільного падіння, коли тяга аеродинамічного опору рівна силі тяжіння.">
      <Field label="Маса вантажу, кг"><Input type="number" step="0.01" min="0.01" value={tvState.massKg} onChange={(e) => setTvState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
      <Field label="Діаметр (перетин), м"><Input type="number" step="0.01" min="0.01" value={tvState.diameterM} onChange={(e) => setTvState((s) => ({ ...s, diameterM: Number(e.target.value) }))} /></Field>
      <Field label="Cd"><Input type="number" step="0.01" min="0.01" value={tvState.cdValue} onChange={(e) => setTvState((s) => ({ ...s, cdValue: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setTvResult(terminalVelocity(tvState))}>Розрахувати</Button>
      {tvResult !== null && (
        <ResultBox copyValue={formatToolNumber(tvResult, 1)}>Термінова швидкість: <span className="font-semibold text-ecalc-navy">{formatToolNumber(tvResult, 1)} м/с</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(tvResult * 3.6, 1)} км/год)</span></ResultBox>
      )}
    </ToolCard>
  )
}

function KineticEnergyCard() {
  const [ekState, setEkState] = usePersistedState('ballistics.energy', { massKg: 0.3, impactSpeedMs: 35 })
  const [ekResult, setEkResult] = useState<KineticEnergyResult | null>(null)

  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Кінетична енергія удару" description="Енергія при ударі за масою та швидкістю зіткнення: Ek = ½mv².">
      <Field label="Маса вантажу, кг"><Input type="number" step="0.01" value={ekState.massKg} onChange={(e) => setEkState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість удару, м/с" hint="Підставте імпакт-швидкість з інших інструментів"><Input type="number" step="0.5" value={ekState.impactSpeedMs} onChange={(e) => setEkState((s) => ({ ...s, impactSpeedMs: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setEkResult(impactKineticEnergy(ekState.massKg, ekState.impactSpeedMs))}>Розрахувати</Button>
      {ekResult && <>
        <ResultBox copyValue={formatToolNumber(ekResult.joules, 0)}>Енергія: <span className="font-semibold text-ecalc-navy">{formatToolNumber(ekResult.joules, 0)} Дж</span> <span className="text-xs text-ecalc-muted">({formatToolNumber(ekResult.kilojoules, 3)} кДж)</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(ekResult.tntGramEquivalent, 3)}>Енергетичний еквівалент: <span className="font-semibold text-ecalc-navy">{formatToolNumber(ekResult.tntGramEquivalent, 3)} г</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function FuzeStandoffCard() {
  const [standoffState, setStandoffState] = usePersistedState('ballistics.standoff', { altitudeM: 100, platformSpeedKmh: 80, headwindKmh: 0, fuzeDelayS: 1.5 })
  const [standoffResult, setStandoffResult] = useState<StandoffResult | null>(null)

  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Поріг спрацювання" description="Горизонтальна відстань, яку пролітає вантаж за час затримки підривника. Переконайтесь, що вистачає часу на взведення.">
      <Field label="Висота скидання, м"><Input type="number" value={standoffState.altitudeM} onChange={(e) => setStandoffState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість носія, км/год"><Input type="number" value={standoffState.platformSpeedKmh} onChange={(e) => setStandoffState((s) => ({ ...s, platformSpeedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Зустрічний вітер, км/год"><Input type="number" value={standoffState.headwindKmh} onChange={(e) => setStandoffState((s) => ({ ...s, headwindKmh: Number(e.target.value) }))} /></Field>
      <Field label="Затримка активації, с" hint="Час після скидання до активації"><Input type="number" step="0.1" value={standoffState.fuzeDelayS} onChange={(e) => setStandoffState((s) => ({ ...s, fuzeDelayS: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setStandoffResult(safeStandoffDistance(standoffState))}>Розрахувати</Button>
      {standoffResult && <>
        <ResultBox copyValue={formatToolNumber(standoffResult.standoffM, 1)}>Відстань взводу: <span className="font-semibold text-ecalc-navy">{formatToolNumber(standoffResult.standoffM, 1)} м</span></ResultBox>
        <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${standoffResult.fuzeArmsBeforeImpact ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
          {standoffResult.fuzeArmsBeforeImpact ? `✓ Активація відбувається до удару (падіння: ${formatToolNumber(standoffResult.fallTimeS, 2)} с)` : `✗ Активація НЕ ВСТИГАЄ відбутися — потрібна менша затримка або більша висота`}
        </div>
      </>}
    </ToolCard>
  )
}

function ParachuteSizingCard() {
  const [chuteState, setChuteState] = usePersistedState('ballistics.chute', { massKg: 1.2, targetLandingMs: 6, cdCanopy: 0.75 })
  const [chuteResult, setChuteResult] = useState<ReturnType<typeof parachuteSizing> | null>(null)

  return (
    <ToolCard icon={<Target className="h-4 w-4" />} title="Розрахунок парашута" description="Діаметр купола для заданої швидкості приземлення. Cd=0.75 для напівсферичного купола.">
      <Field label="Маса системи, кг"><Input type="number" step="0.05" min="0.01" value={chuteState.massKg} onChange={(e) => setChuteState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
      <Field label="Цільова швидкість, м/с" hint="Типово 5–8 м/с для дронів"><Input type="number" step="0.5" min="1" value={chuteState.targetLandingMs} onChange={(e) => setChuteState((s) => ({ ...s, targetLandingMs: Number(e.target.value) }))} /></Field>
      <Field label="Cd купола" hint="0.75 — напівсфера, 1.5 — хрестовий">  <Input type="number" step="0.05" min="0.1" value={chuteState.cdCanopy} onChange={(e) => setChuteState((s) => ({ ...s, cdCanopy: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setChuteResult(parachuteSizing(chuteState))}>Розрахувати</Button>
      {chuteResult && <>
        <ResultBox copyValue={formatToolNumber(chuteResult.diameterM, 2)}>Діаметр купола: <span className="font-semibold text-ecalc-navy">{formatToolNumber(chuteResult.diameterM, 2)} м</span></ResultBox>
        <ResultBox>Площа: <span className="font-semibold text-ecalc-navy">{formatToolNumber(chuteResult.areaMsq, 3)} м²</span> <span className="text-xs text-ecalc-muted">Vt = {formatToolNumber(chuteResult.actualVtMs, 2)} м/с</span></ResultBox>
      </>}
    </ToolCard>
  )
}

function BombDropCard() {
  const [bombState, setBombState] = usePersistedState('ballistics.bomb2', {
    altitudeM: 80, platformSpeedMs: 15, windMs: 0,
    massKg: 0.35, dragCoeff: 0.47, crossSectionM2: 0.005,
    fuzeType: 'instant' as FuzeType, customDelayS: 3.5, frictionCoeff: 0.35,
  })
  const [bombResult, setBombResult] = useState<ReturnType<typeof bombDrop> | null>(null)
  const [fuzeResult, setFuzeResult] = useState<ReturnType<typeof fuzeDelaySlide> | null>(null)

  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Скид з урахуванням опору" description="Числова інтеграція траєкторії + ковзання після удару з урахуванням типу капсуля-детонатора.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Висота, м"><Input type="number" min="1" value={bombState.altitudeM} onChange={(e) => setBombState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
        <Field label="Швидкість носія, м/с"><Input type="number" step="0.5" min="0" value={bombState.platformSpeedMs} onChange={(e) => setBombState((s) => ({ ...s, platformSpeedMs: Number(e.target.value) }))} /></Field>
        <Field label="Зустрічний вітер, м/с"><Input type="number" step="0.5" value={bombState.windMs} onChange={(e) => setBombState((s) => ({ ...s, windMs: Number(e.target.value) }))} /></Field>
        <Field label="Маса вантажу, кг"><Input type="number" step="0.01" min="0.01" value={bombState.massKg} onChange={(e) => setBombState((s) => ({ ...s, massKg: Number(e.target.value) }))} /></Field>
        <Field label="Cd вантажу" hint="Куля 0.47, циліндр 0.82"><Input type="number" step="0.01" min="0.01" value={bombState.dragCoeff} onChange={(e) => setBombState((s) => ({ ...s, dragCoeff: Number(e.target.value) }))} /></Field>
        <Field label="Площа перерізу, м²"><Input type="number" step="0.001" min="0.001" value={bombState.crossSectionM2} onChange={(e) => setBombState((s) => ({ ...s, crossSectionM2: Number(e.target.value) }))} /></Field>
      </div>

      {/* Fuze section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-ecalc-muted">Тип капсуля-детонатора</div>
        <Field label="Тип підривника">
          <select
            aria-label="Тип підривника"
            value={bombState.fuzeType}
            onChange={(e) => setBombState((s) => ({ ...s, fuzeType: e.target.value as FuzeType }))}
            className="w-full rounded-lg border border-ecalc-border bg-ecalc-darksurf px-3 py-2 text-sm text-ecalc-text focus:outline-none focus:ring-1 focus:ring-ecalc-orange"
          >
            {(Object.entries(FUZE_PRESETS) as [FuzeType, typeof FUZE_PRESETS[FuzeType]][]).map(([key, p]) => (
              <option key={key} value={key}>{p.label}</option>
            ))}
          </select>
        </Field>
        {bombState.fuzeType !== 'instant' && bombState.fuzeType !== 'vog' && (
          <div className="text-[11px] text-ecalc-muted">{FUZE_PRESETS[bombState.fuzeType].description}</div>
        )}
        {bombState.fuzeType === 'custom' && (
          <Field label="Затримка, с">
            <Input type="number" step="0.1" min="0" max="30" value={bombState.customDelayS} onChange={(e) => setBombState((s) => ({ ...s, customDelayS: Number(e.target.value) }))} />
          </Field>
        )}
        <Field label="Тертя поверхні (μ)" hint="Тверда підлога ≈ 0.25, трава ≈ 0.40, ґрунт ≈ 0.55">
          <Input type="number" step="0.05" min="0.05" max="1" value={bombState.frictionCoeff} onChange={(e) => setBombState((s) => ({ ...s, frictionCoeff: Number(e.target.value) }))} />
        </Field>
      </div>

      <Button onClick={() => {
        const drop = bombDrop(bombState)
        setBombResult(drop)
        const delayS = bombState.fuzeType === 'custom'
          ? bombState.customDelayS
          : FUZE_PRESETS[bombState.fuzeType].delayS
        setFuzeResult(fuzeDelaySlide({ vxImpactMs: drop.vxImpactMs, fuzeDelayS: delayS, frictionCoeff: bombState.frictionCoeff }))
      }}>Розрахувати</Button>

      {!bombResult && <CalcEmptyState />}
      {bombResult && fuzeResult && <>
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted pt-1">Траєкторія падіння</div>
        <ResultBox copyValue={formatToolNumber(bombResult.timeS, 2)}>Час падіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(bombResult.timeS, 2)} с</span></ResultBox>
        <ResultBox copyValue={formatToolNumber(bombResult.forwardM, 1)}>Зміщення при ударі: <span className="font-semibold text-ecalc-navy">{formatToolNumber(bombResult.forwardM, 1)} м</span></ResultBox>
        <ResultBox>Швидкість удару: <span className="font-semibold text-ecalc-navy">{formatToolNumber(bombResult.totalSpeedMs, 1)} м/с</span> <span className="text-xs text-ecalc-muted">(гориз. {formatToolNumber(Math.abs(bombResult.vxImpactMs), 1)} м/с)</span></ResultBox>

        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted pt-1">Після удару — капсуль</div>
        {bombState.fuzeType === 'instant' || bombState.fuzeType === 'vog' ? (
          <div className="rounded-xl border border-ecalc-green/30 bg-ecalc-green/10 px-3.5 py-2.5 text-sm font-semibold text-ecalc-green">
            ⚡ Накольний — підрив на місці удару. Ковзання: 0 м
          </div>
        ) : (
          <>
            <ResultBox copyValue={formatToolNumber(fuzeResult.slideM, 1)}>
              Ковзання за затримку: <span className="font-semibold text-ecalc-navy">{formatToolNumber(fuzeResult.slideM, 1)} м</span>
              <span className="ml-2 text-xs text-ecalc-muted">(зупинка через {formatToolNumber(fuzeResult.stopTimeS, 1)} с)</span>
            </ResultBox>
            <ResultBox copyValue={formatToolNumber(bombResult.forwardM + fuzeResult.slideM, 1)}>
              Точка підриву від скидання: <span className="font-semibold text-ecalc-orange">{formatToolNumber(bombResult.forwardM + fuzeResult.slideM, 1)} м</span>
            </ResultBox>
            {!Number.isFinite(fuzeResult.slideM) ? (
              <div className="rounded-xl border border-ecalc-border bg-white/5 px-3.5 py-2.5 text-sm text-ecalc-muted">
                Стан при підриві: — (перевірте вхідні дані)
              </div>
            ) : (
              <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-medium ${fuzeResult.stillMovingAtDetonation ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green'}`}>
                {fuzeResult.stillMovingAtDetonation
                  ? `⚠ Підрив під час руху — швидкість при підриві ${formatToolNumber(fuzeResult.detonationVelocityMs, 1)} м/с. Осколки зміщені вперед.`
                  : `✓ Граната зупинилась до підриву — симетричне осколкове поле.`}
              </div>
            )}
          </>
        )}
      </>}
    </ToolCard>
  )
}

function Drop3DCard() {
  const [s, setS] = usePersistedState('ballistics.drop3d.v1', {
    altitudeM: 80,
    carrierSpeedMs: 15,
    pitchDeg: 0,
    releaseImpulseMs: 0,
    massKg: 0.35,
    diameterM: 0.065,
    cdStable: 0.40,
    cdTumble: 0.90,
    stabilizationAltM: 15,
    windHeadMs: 3,
    windCrossMs: 2,
    terrainZ0: 0.03,
    cor: 0.0,
    frictionCoeff: 0.35,
    fuzeDelayS: 0,
    fuzeType: 'instant' as FuzeType,
    customDelayS: 3.5,
  })
  const [result, setResult] = useState<Drop3DResult | null>(null)

  function calc() {
    const fuzeS = s.fuzeType === 'custom'
      ? s.customDelayS
      : FUZE_PRESETS[s.fuzeType].delayS
    setResult(drop3D({ ...s, fuzeDelayS: fuzeS }))
  }

  return (
    <ToolCard
      icon={<Target className="h-4 w-4" />}
      title="3D Балістика — пікірування / підкидання"
      description="Числова інтеграція з кутом скиду, вітровим профілем ISO 4354, фазою перекидання Cd та відскоком CoR."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Висота скидання, м"><Input type="number" min="1" value={s.altitudeM} onChange={(e) => setS((p) => ({ ...p, altitudeM: +e.target.value }))} /></Field>
        <Field label="Швидкість носія, м/с"><Input type="number" step="0.5" min="0" value={s.carrierSpeedMs} onChange={(e) => setS((p) => ({ ...p, carrierSpeedMs: +e.target.value }))} /></Field>
        <Field label="Кут тангажу, °" hint="−=пікірування, +=підкидання, 0=рівень">
          <Input type="number" step="1" min="-60" max="60" value={s.pitchDeg} onChange={(e) => setS((p) => ({ ...p, pitchDeg: +e.target.value }))} />
        </Field>
        <Field label="Імпульс скидання, м/с" hint="Пружинний / трубчастий механізм">
          <Input type="number" step="0.1" min="0" value={s.releaseImpulseMs} onChange={(e) => setS((p) => ({ ...p, releaseImpulseMs: +e.target.value }))} />
        </Field>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-ecalc-muted">Боєприпас</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Маса, кг"><Input type="number" step="0.01" min="0.01" value={s.massKg} onChange={(e) => setS((p) => ({ ...p, massKg: +e.target.value }))} /></Field>
          <Field label="Діаметр, м" hint="ВОГ ≈ 0.04, Ф-1 ≈ 0.055, РГД ≈ 0.065"><Input type="number" step="0.005" min="0.01" value={s.diameterM} onChange={(e) => setS((p) => ({ ...p, diameterM: +e.target.value }))} /></Field>
          <Field label="Cd стабільний" hint="Носом вперед: ВОГ ≈ 0.3, граната ≈ 0.47"><Input type="number" step="0.01" min="0.05" value={s.cdStable} onChange={(e) => setS((p) => ({ ...p, cdStable: +e.target.value }))} /></Field>
          <Field label="Cd перекидання" hint="Циліндр плашма ≈ 0.82–1.2"><Input type="number" step="0.05" min="0.1" value={s.cdTumble} onChange={(e) => setS((p) => ({ ...p, cdTumble: +e.target.value }))} /></Field>
          <Field label="Висота стабілізації, м" hint="Падіння до стабілізації Cd"><Input type="number" step="1" min="0" value={s.stabilizationAltM} onChange={(e) => setS((p) => ({ ...p, stabilizationAltM: +e.target.value }))} /></Field>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-ecalc-muted">Вітер (лог. профіль ISO 4354)</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Зустрічний вітер, м/с" hint="+ проти руху носія"><Input type="number" step="0.5" value={s.windHeadMs} onChange={(e) => setS((p) => ({ ...p, windHeadMs: +e.target.value }))} /></Field>
          <Field label="Боковий вітер, м/с" hint="+ справа від курсу носія"><Input type="number" step="0.5" value={s.windCrossMs} onChange={(e) => setS((p) => ({ ...p, windCrossMs: +e.target.value }))} /></Field>
          <Field label="z₀ рельєфу, м" hint="Поле 0.03, ліс 0.5, місто 2.0"><Input type="number" step="0.01" min="0.0001" value={s.terrainZ0} onChange={(e) => setS((p) => ({ ...p, terrainZ0: +e.target.value }))} /></Field>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-ecalc-muted">Удар та підрив</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="CoR (відскок)" hint="Асфальт ≈ 0.4, трава ≈ 0.1, ґрунт ≈ 0"><Input type="number" step="0.05" min="0" max="0.9" value={s.cor} onChange={(e) => setS((p) => ({ ...p, cor: +e.target.value }))} /></Field>
          <Field label="Тертя μ" hint="Тверде ≈ 0.25, ґрунт ≈ 0.55"><Input type="number" step="0.05" min="0.05" max="1" value={s.frictionCoeff} onChange={(e) => setS((p) => ({ ...p, frictionCoeff: +e.target.value }))} /></Field>
        </div>
        <Field label="Тип підривника">
          <select
            aria-label="Тип підривника"
            value={s.fuzeType}
            onChange={(e) => setS((p) => ({ ...p, fuzeType: e.target.value as FuzeType }))}
            className="w-full rounded-lg border border-ecalc-border bg-ecalc-darksurf px-3 py-2 text-sm text-ecalc-text focus:outline-none focus:ring-1 focus:ring-ecalc-orange"
          >
            {(Object.entries(FUZE_PRESETS) as [FuzeType, typeof FUZE_PRESETS[FuzeType]][]).map(([k, p]) => (
              <option key={k} value={k}>{p.label}</option>
            ))}
          </select>
        </Field>
        {s.fuzeType === 'custom' && (
          <Field label="Затримка, с"><Input type="number" step="0.1" min="0" max="30" value={s.customDelayS} onChange={(e) => setS((p) => ({ ...p, customDelayS: +e.target.value }))} /></Field>
        )}
      </div>

      <Button onClick={calc}>Розрахувати 3D траєкторію</Button>

      {!result && <CalcEmptyState />}
      {result && <>
        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted pt-1">Перший удар</div>
        <ResultBox copyValue={formatToolNumber(result.xForwardM, 1)}>
          Зміщення вперед: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.xForwardM, 1)} м</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(result.yLateralM, 2)}>
          Бічне відхилення: <span className="font-semibold text-ecalc-navy">
            {result.yLateralM >= 0 ? '+' : ''}{formatToolNumber(result.yLateralM, 2)} м
          </span>
          <span className="ml-2 text-xs text-ecalc-muted">{result.yLateralM > 0.1 ? '→ вправо' : result.yLateralM < -0.1 ? '← вліво' : '≈ по курсу'}</span>
        </ResultBox>
        <ResultBox copyValue={formatToolNumber(result.timeToFirstImpactS, 2)}>
          Час падіння: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.timeToFirstImpactS, 2)} с</span>
        </ResultBox>
        <ResultBox>
          Швидкість удару: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.impactSpeedMs, 1)} м/с</span>
          <span className="ml-2 text-xs text-ecalc-muted">кут {formatToolNumber(result.impactAngleDeg, 1)}° від горизонталі</span>
        </ResultBox>

        {(result.bounceCount > 0 || result.finalXM !== result.xForwardM) && <>
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted pt-1">Після удару — підрив</div>
          {result.bounceCount > 0 && (
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/8 px-3.5 py-2 text-sm text-yellow-300">
              ↑ {result.bounceCount} відскок{result.bounceCount === 1 ? '' : result.bounceCount < 5 ? 'и' : 'ів'}
            </div>
          )}
          <ResultBox copyValue={formatToolNumber(result.finalXM, 1)}>
            Точка підриву — вперед: <span className="font-semibold text-ecalc-orange">{formatToolNumber(result.finalXM, 1)} м</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.finalYM, 2)}>
            Точка підриву — бічна: <span className="font-semibold text-ecalc-orange">
              {result.finalYM >= 0 ? '+' : ''}{formatToolNumber(result.finalYM, 2)} м
            </span>
          </ResultBox>
          <ResultBox>
            Загальний час: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.totalTimeS, 2)} с</span>
          </ResultBox>
        </>}
      </>}
    </ToolCard>
  )
}

function DropSequenceSpreadCard() {
  const [spreadState, setSpreadState] = usePersistedState('ballistics.spread', { count: 4, intervalS: 0.5, altitudeM: 100, platformSpeedKmh: 80, headwindKmh: 0 })
  const [spreadResult, setSpreadResult] = useState<SequenceSpreadResult | null>(null)

  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Розсіювання" description="Площа охоплення при скиданні серії вантажів з однаковим інтервалом — планування килимового скидання.">
      <Field label="Кількість елементів" hint="Максимум 20"><Input type="number" min={1} max={20} value={spreadState.count} onChange={(e) => setSpreadState((s) => ({ ...s, count: Number(e.target.value) }))} /></Field>
      <Field label="Інтервал між скиданнями, с"><Input type="number" step="0.1" value={spreadState.intervalS} onChange={(e) => setSpreadState((s) => ({ ...s, intervalS: Number(e.target.value) }))} /></Field>
      <Field label="Висота скидання, м"><Input type="number" value={spreadState.altitudeM} onChange={(e) => setSpreadState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} /></Field>
      <Field label="Швидкість носія, км/год"><Input type="number" value={spreadState.platformSpeedKmh} onChange={(e) => setSpreadState((s) => ({ ...s, platformSpeedKmh: Number(e.target.value) }))} /></Field>
      <Field label="Зустрічний вітер, км/год"><Input type="number" value={spreadState.headwindKmh} onChange={(e) => setSpreadState((s) => ({ ...s, headwindKmh: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSpreadResult(dropSequenceSpread(spreadState))}>Розрахувати</Button>
      {spreadResult && spreadResult.impactOffsetsM.length > 0 && <>
        <ResultBox copyValue={formatToolNumber(spreadResult.spanM, 1)}>Загальне охоплення: <span className="font-semibold text-ecalc-navy">{formatToolNumber(spreadResult.spanM, 1)} м</span></ResultBox>
        <div className="text-[10px] text-ecalc-muted leading-relaxed">
          Точки падіння (відстань від носія): {spreadResult.impactOffsetsM.map((d) => formatToolNumber(d, 0) + ' м').join(' · ')}
        </div>
      </>}
    </ToolCard>
  )
}

export function BallisticsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Модель падіння об&apos;єкта</CardTitle>
          <CardDescription>
            Розрахунок точки падіння та часу польоту при скиданні вантажу з рухомого БПЛА.
            Тільки для первинної оцінки — не враховує турбулентність, обертання та нестаціонарний вітер.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            ⚠️ Результати є наближеними. Обов&apos;язково проводьте польові калібрування перед польовим використанням.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Drop3DCard />
        <VacuumDropCard />
        <DragDropCard />
        <TargetLeadCard />
        <CrosswindDriftCard />
        <TerminalVelocityCard />
        <KineticEnergyCard />
        <FuzeStandoffCard />
        <ParachuteSizingCard />
        <BombDropCard />
        <DropSequenceSpreadCard />
      </div>
    </section>
  )
}
