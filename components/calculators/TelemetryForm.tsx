'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'

type State = 'idle' | 'sending' | 'done' | 'error'

export function TelemetryForm() {
  const [droneType, setDroneType] = useState('multirotor')
  const [flightTimeActual, setFlightTimeActual] = useState('')
  const [flightTimeCalc, setFlightTimeCalc] = useState('')
  const [wind, setWind] = useState('')
  const [tempC, setTempC] = useState('')
  const [altM, setAltM] = useState('')
  const [notes, setNotes] = useState('')
  const [state, setState] = useState<State>('idle')

  async function submit() {
    setState('sending')
    try {
      const res = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ droneType, flightTimeActual, flightTimeCalc, wind, tempC, altM, notes }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-ecalc-green">
          ✓ Дякуємо — дані отримано і будуть використані для калібрування моделей.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Польотна телеметрія</CardTitle>
        <CardDescription>
          Анонімно. Допомагає калібрувати математичні моделі з реального досвіду.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Тип платформи</label>
            <Select title="Тип" value={droneType} onChange={(e) => setDroneType(e.target.value)}>
              <option value="multirotor">Мультиротор</option>
              <option value="fixed-wing">Фіксоване крило</option>
              <option value="vtol">VTOL</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Реальний час польоту, хв</label>
            <Input type="number" placeholder="напр. 18" value={flightTimeActual} onChange={(e) => setFlightTimeActual(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Розрахунковий час, хв</label>
            <Input type="number" placeholder="з калькулятора" value={flightTimeCalc} onChange={(e) => setFlightTimeCalc(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Вітер, м/с</label>
            <Input type="number" placeholder="напр. 5" value={wind} onChange={(e) => setWind(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Температура, °C</label>
            <Input type="number" placeholder="напр. 15" value={tempC} onChange={(e) => setTempC(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-ecalc-muted">Висота над рівнем моря, м</label>
            <Input type="number" placeholder="напр. 200" value={altM} onChange={(e) => setAltM(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm text-ecalc-muted">{'Що не збіглось з калькулятором (необов\'язково)'}</label>
          <Input placeholder="напр. тяга завищена на 15%" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        {state === 'error' && (
          <p className="text-sm text-red-400">Помилка відправки — спробуйте ще раз.</p>
        )}
        <Button onClick={submit} disabled={state === 'sending'}>
          {state === 'sending' ? 'Надсилання...' : 'Надіслати анонімно'}
        </Button>
      </CardContent>
    </Card>
  )
}
