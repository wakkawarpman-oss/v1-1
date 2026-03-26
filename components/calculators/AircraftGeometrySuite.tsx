'use client'

import { useState } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { Compass, Layers3, MoveHorizontal, MoveVertical, Ruler, ScanLine, Triangle, Waves, Waypoints, Wind } from 'lucide-react'
import {
  aspectRatio,
  fuselageDiameter,
  horizontalTailVolume,
  macSpanPosition,
  meanAerodynamicChord,
  relativeThickness,
  sweepAngle,
  taperRatio,
  verticalTailVolume,
  washout,
} from '@/lib/aircraft-geometry'
import { Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function WingsIcon() {
  return <Ruler className="h-4 w-4" />
}

function AspectRatioCard() {
  const [arState, setArState] = usePersistedState('geometry.ar', { span: 10.5, area: 14.8 })
  const [arResult, setArResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<WingsIcon />} title="Aspect Ratio" description="Подовження крила через розмах і площу планформи.">
      <Field label="Розмах, м"><Input type="number" step="0.1" value={arState.span} onChange={(e) => setArState((s) => ({ ...s, span: Number(e.target.value) }))} /></Field>
      <Field label="Площа крила, м²"><Input type="number" step="0.1" value={arState.area} onChange={(e) => setArState((s) => ({ ...s, area: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setArResult(aspectRatio(arState.span, arState.area))}>Розрахувати</Button>
      <ResultBox>AR: <span className="font-semibold text-ecalc-navy">{formatToolNumber(arResult, 2)}</span></ResultBox>
    </ToolCard>
  )
}

function TaperRatioCard() {
  const [taperState, setTaperState] = usePersistedState('geometry.taper', { tipChord: 0.42, rootChord: 0.82 })
  const [taperResult, setTaperResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Triangle className="h-4 w-4" />} title="Taper Ratio" description="Звуження крила через tip chord до root chord.">
      <Field label="Tip chord, м"><Input type="number" step="0.01" value={taperState.tipChord} onChange={(e) => setTaperState((s) => ({ ...s, tipChord: Number(e.target.value) }))} /></Field>
      <Field label="Root chord, м"><Input type="number" step="0.01" value={taperState.rootChord} onChange={(e) => setTaperState((s) => ({ ...s, rootChord: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setTaperResult(taperRatio(taperState.tipChord, taperState.rootChord))}>Розрахувати</Button>
      <ResultBox>λ: <span className="font-semibold text-ecalc-navy">{formatToolNumber(taperResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function SweepAngleCard() {
  const [sweepState, setSweepState] = usePersistedState('geometry.sweep', { deltaX: 0.85, semiSpan: 5.2 })
  const [sweepResult, setSweepResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Compass className="h-4 w-4" />} title="Sweep Angle" description="Стрілоподібність за поздовжнім зсувом і піврозмахом.">
      <Field label="Δx, м"><Input type="number" step="0.01" value={sweepState.deltaX} onChange={(e) => setSweepState((s) => ({ ...s, deltaX: Number(e.target.value) }))} /></Field>
      <Field label="Піврозмах, м"><Input type="number" step="0.01" value={sweepState.semiSpan} onChange={(e) => setSweepState((s) => ({ ...s, semiSpan: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setSweepResult(sweepAngle(sweepState.deltaX, sweepState.semiSpan))}>Розрахувати</Button>
      <ResultBox>Sweep: <span className="font-semibold text-ecalc-navy">{formatToolNumber(sweepResult, 2)}°</span></ResultBox>
    </ToolCard>
  )
}

function MacCard() {
  const [macState, setMacState] = usePersistedState('geometry.mac', { rootChord: 0.82, tipChord: 0.42 })
  const [macResult, setMacResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Ruler className="h-4 w-4" />} title="Mean Aerodynamic Chord" description="MAC трапецієподібного крила для центрування і tail sizing.">
      <Field label="Root chord, м"><Input type="number" step="0.01" value={macState.rootChord} onChange={(e) => setMacState((s) => ({ ...s, rootChord: Number(e.target.value) }))} /></Field>
      <Field label="Tip chord, м"><Input type="number" step="0.01" value={macState.tipChord} onChange={(e) => setMacState((s) => ({ ...s, tipChord: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setMacResult(meanAerodynamicChord(macState.rootChord, macState.tipChord))}>Розрахувати</Button>
      <ResultBox>MAC: <span className="font-semibold text-ecalc-navy">{formatToolNumber(macResult, 3)} м</span></ResultBox>
    </ToolCard>
  )
}

function MacPositionCard() {
  const [macPosState, setMacPosState] = usePersistedState('geometry.macpos', { span: 10.5, tipChord: 0.42, rootChord: 0.82 })
  const [macPosResult, setMacPosResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<MoveHorizontal className="h-4 w-4" />} title="Положення MAC" description="Spanwise location середньої аеродинамічної хорди.">
      <Field label="Розмах, м"><Input type="number" step="0.1" value={macPosState.span} onChange={(e) => setMacPosState((s) => ({ ...s, span: Number(e.target.value) }))} /></Field>
      <Field label="Tip chord, м"><Input type="number" step="0.01" value={macPosState.tipChord} onChange={(e) => setMacPosState((s) => ({ ...s, tipChord: Number(e.target.value) }))} /></Field>
      <Field label="Root chord, м"><Input type="number" step="0.01" value={macPosState.rootChord} onChange={(e) => setMacPosState((s) => ({ ...s, rootChord: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setMacPosResult(macSpanPosition(macPosState.span, macPosState.tipChord, macPosState.rootChord))}>Розрахувати</Button>
      <ResultBox>yMAC: <span className="font-semibold text-ecalc-navy">{formatToolNumber(macPosResult, 3)} м</span></ResultBox>
    </ToolCard>
  )
}

function HorizontalTailVolumeCard() {
  const [hTailState, setHTailState] = usePersistedState('geometry.htail', { tailArea: 2.1, tailArm: 3.8, wingArea: 14.8, mac: 0.65 })
  const [hTailResult, setHTailResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Waypoints className="h-4 w-4" />} title="Horizontal Tail Volume" description="Коефіцієнт об'єму горизонтального оперення.">
      <Field label="S_h, м²"><Input type="number" step="0.01" value={hTailState.tailArea} onChange={(e) => setHTailState((s) => ({ ...s, tailArea: Number(e.target.value) }))} /></Field>
      <Field label="l_h, м"><Input type="number" step="0.01" value={hTailState.tailArm} onChange={(e) => setHTailState((s) => ({ ...s, tailArm: Number(e.target.value) }))} /></Field>
      <Field label="S wing, м²"><Input type="number" step="0.01" value={hTailState.wingArea} onChange={(e) => setHTailState((s) => ({ ...s, wingArea: Number(e.target.value) }))} /></Field>
      <Field label="MAC, м"><Input type="number" step="0.01" value={hTailState.mac} onChange={(e) => setHTailState((s) => ({ ...s, mac: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setHTailResult(horizontalTailVolume(hTailState.tailArea, hTailState.tailArm, hTailState.wingArea, hTailState.mac))}>Розрахувати</Button>
      <ResultBox>Vh: <span className="font-semibold text-ecalc-navy">{formatToolNumber(hTailResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function VerticalTailVolumeCard() {
  const [vTailState, setVTailState] = usePersistedState('geometry.vtail', { finArea: 1.2, tailArm: 3.6, wingArea: 14.8, span: 10.5 })
  const [vTailResult, setVTailResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<MoveVertical className="h-4 w-4" />} title="Vertical Tail Volume" description="Коефіцієнт об'єму вертикального оперення.">
      <Field label="S_v, м²"><Input type="number" step="0.01" value={vTailState.finArea} onChange={(e) => setVTailState((s) => ({ ...s, finArea: Number(e.target.value) }))} /></Field>
      <Field label="l_v, м"><Input type="number" step="0.01" value={vTailState.tailArm} onChange={(e) => setVTailState((s) => ({ ...s, tailArm: Number(e.target.value) }))} /></Field>
      <Field label="S wing, м²"><Input type="number" step="0.01" value={vTailState.wingArea} onChange={(e) => setVTailState((s) => ({ ...s, wingArea: Number(e.target.value) }))} /></Field>
      <Field label="Розмах, м"><Input type="number" step="0.01" value={vTailState.span} onChange={(e) => setVTailState((s) => ({ ...s, span: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setVTailResult(verticalTailVolume(vTailState.finArea, vTailState.tailArm, vTailState.wingArea, vTailState.span))}>Розрахувати</Button>
      <ResultBox>Vv: <span className="font-semibold text-ecalc-navy">{formatToolNumber(vTailResult, 3)}</span></ResultBox>
    </ToolCard>
  )
}

function FuselageDiameterCard() {
  const [fuselageState, setFuselageState] = usePersistedState('geometry.fuselage', { volume: 2.8, length: 7.5 })
  const [fuselageResult, setFuselageResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Layers3 className="h-4 w-4" />} title="Діаметр фюзеляжу" description="Циліндричне наближення для volume sizing фюзеляжу.">
      <Field label="Об'єм, м³"><Input type="number" step="0.1" value={fuselageState.volume} onChange={(e) => setFuselageState((s) => ({ ...s, volume: Number(e.target.value) }))} /></Field>
      <Field label="Довжина, м"><Input type="number" step="0.1" value={fuselageState.length} onChange={(e) => setFuselageState((s) => ({ ...s, length: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setFuselageResult(fuselageDiameter(fuselageState.volume, fuselageState.length))}>Розрахувати</Button>
      <ResultBox>Діаметр: <span className="font-semibold text-ecalc-navy">{formatToolNumber(fuselageResult, 3)} м</span></ResultBox>
    </ToolCard>
  )
}

function RelativeThicknessCard() {
  const [thicknessState, setThicknessState] = usePersistedState('geometry.thickness', { maxThickness: 0.072, chord: 0.42 })
  const [thicknessResult, setThicknessResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<ScanLine className="h-4 w-4" />} title="Відносна товщина профілю" description="t/c через максимальну товщину і локальну хорду.">
      <Field label="t_max, м"><Input type="number" step="0.001" value={thicknessState.maxThickness} onChange={(e) => setThicknessState((s) => ({ ...s, maxThickness: Number(e.target.value) }))} /></Field>
      <Field label="Chord, м"><Input type="number" step="0.001" value={thicknessState.chord} onChange={(e) => setThicknessState((s) => ({ ...s, chord: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setThicknessResult(relativeThickness(thicknessState.maxThickness, thicknessState.chord))}>Розрахувати</Button>
      <ResultBox>t/c: <span className="font-semibold text-ecalc-navy">{formatToolNumber(thicknessResult ? thicknessResult * 100 : null, 2)}%</span></ResultBox>
    </ToolCard>
  )
}

function WashoutCard() {
  const [washoutState, setWashoutState] = usePersistedState('geometry.washout', { tip: -2, root: 1.5 })
  const [washoutResult, setWashoutResult] = useState<number | null>(null)
  return (
    <ToolCard icon={<Wind className="h-4 w-4" />} title="Washout" description="Геометричне крутіння крила між root і tip incidence.">
      <Field label="Incidence tip, °"><Input type="number" step="0.1" value={washoutState.tip} onChange={(e) => setWashoutState((s) => ({ ...s, tip: Number(e.target.value) }))} /></Field>
      <Field label="Incidence root, °"><Input type="number" step="0.1" value={washoutState.root} onChange={(e) => setWashoutState((s) => ({ ...s, root: Number(e.target.value) }))} /></Field>
      <Button onClick={() => setWashoutResult(washout(washoutState.tip, washoutState.root))}>Розрахувати</Button>
      <ResultBox>Washout: <span className="font-semibold text-ecalc-navy">{formatToolNumber(washoutResult, 2)}°</span></ResultBox>
    </ToolCard>
  )
}

export function AircraftGeometrySuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Aircraft Geometry Suite</CardTitle>
          <CardDescription>
            10 геометричних інструментів для планера, крила, хвостового оперення, фюзеляжу та профілів літака або безпілотника.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-ecalc-orange/20 bg-ecalc-orange/5 px-4 py-3 text-sm text-ecalc-text">
            Цей пакет закриває основні пропорції конструкції: AR, taper, sweep, MAC, tail volume, thickness ratio і washout для раннього sizing та перевірки геометрії.
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Інструментів</div><div className="mt-1 text-xl font-semibold text-ecalc-navy">10</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Фокус</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Wing + empennage sizing</div></div>
            <div className="metric-tile"><div className="text-[11px] uppercase tracking-wide text-ecalc-muted">Тип</div><div className="mt-1 text-sm font-semibold text-ecalc-navy">Geometry sanity-check</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        <AspectRatioCard />
        <TaperRatioCard />
        <SweepAngleCard />
        <MacCard />
        <MacPositionCard />
        <HorizontalTailVolumeCard />
        <VerticalTailVolumeCard />
        <FuselageDiameterCard />
        <RelativeThicknessCard />
        <WashoutCard />
      </div>
    </section>
  )
}
