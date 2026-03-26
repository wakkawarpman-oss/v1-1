'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PerfCalcInput, aspectRatio, estimateOswald, round } from '@/lib/aero'

type Props = Readonly<{
  values: PerfCalcInput
  onChange: (key: keyof PerfCalcInput, value: number) => void
}>

export function AirframeForm({ values, onChange }: Props) {
  const ar = aspectRatio(values.wingSpanMm, values.wingAreaDm2)
  const oswaldAuto = useMemo(() => estimateOswald(ar), [ar])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Планер і аеродинаміка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Загальна злітна вага, кг</Label>
            <Input id="weightKg" type="number" step="0.01" value={values.weightKg} onChange={(e) => onChange('weightKg', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wingAreaDm2">Площа крила, дм²</Label>
            <Input id="wingAreaDm2" type="number" step="0.1" value={values.wingAreaDm2} onChange={(e) => onChange('wingAreaDm2', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="wingSpanMm">Розмах крила, мм</Label>
            <Input id="wingSpanMm" type="number" value={values.wingSpanMm} onChange={(e) => onChange('wingSpanMm', Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Аспектне відношення</Label>
            <div className="flex h-10 items-center rounded-md border border-ecalc-border bg-ecalc-lightbg px-3 text-sm font-semibold text-ecalc-navy">
              {round(ar, 2)}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cd0">Cd0, паразитний опір</Label>
          <Slider min={0.02} max={0.08} step={0.001} value={values.cd0} onChange={(e) => onChange('cd0', Number(e.target.value))} valueLabel={`Поточне значення: ${values.cd0.toFixed(3)}`} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="oswald">Коефіцієнт Освальда e</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 px-2 py-0 text-[11px] border-ecalc-border text-ecalc-muted hover:text-ecalc-navy"
              onClick={() => onChange('oswald', oswaldAuto)}
            >
              Авто ({round(oswaldAuto, 2)})
            </Button>
          </div>
          <Slider min={0.65} max={0.95} step={0.01} value={values.oswald} onChange={(e) => onChange('oswald', Number(e.target.value))} valueLabel={`Поточне значення: ${values.oswald.toFixed(2)}`} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="clMax">CLmax профілю <span className="text-[10px] font-normal text-ecalc-muted ml-1">→ визначає Vstall на графіку</span></Label>
          <Slider min={1.1} max={1.9} step={0.01} value={values.clMax} onChange={(e) => onChange('clMax', Number(e.target.value))} valueLabel={`Поточне значення: ${values.clMax.toFixed(2)}`} />
        </div>
      </CardContent>
    </Card>
  )
}
