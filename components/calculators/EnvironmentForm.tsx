'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerfCalcInput, round } from '@/lib/aero'

type Props = {
  values: PerfCalcInput
  density: number
  onChange: (key: keyof PerfCalcInput, value: number) => void
}

export function EnvironmentForm({ values, density, onChange }: Readonly<Props>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Середовище</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="elevationM">Висота над рівнем моря, м</Label>
          <Input id="elevationM" type="number" value={values.elevationM} onChange={(e) => onChange('elevationM', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="temperatureC">Температура, °C</Label>
          <Input id="temperatureC" type="number" value={values.temperatureC} onChange={(e) => onChange('temperatureC', Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2 rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3 text-sm text-ecalc-muted">
          Автоматично обчислена густина повітря: <span className="font-semibold text-ecalc-navy">{round(density, 3)} кг/м³</span>
        </div>
      </CardContent>
    </Card>
  )
}
