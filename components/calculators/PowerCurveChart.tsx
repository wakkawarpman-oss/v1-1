'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PerfCurvePoint } from '@/lib/aero'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  points: PerfCurvePoint[]
  minPowerSpeedKmh: number
  minPowerW: number
  carsonSpeedKmh: number
  maxSpeedKmh: number
  stallSpeedKmh: number
}

export function PowerCurveChart({
  points,
  minPowerSpeedKmh,
  minPowerW,
  carsonSpeedKmh,
  maxSpeedKmh,
  stallSpeedKmh,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Діаграма потужності в горизонтальному польоті</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d0d7e2" />
              <XAxis
                dataKey="speedKmh"
                stroke="#6b7a99"
                tick={{ fontSize: 11 }}
                label={{ value: 'Швидкість, км/год', position: 'insideBottom', offset: -4 }}
              />
              <YAxis
                stroke="#6b7a99"
                tick={{ fontSize: 11 }}
                label={{ value: 'Потужність, W', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, borderColor: '#d0d7e2' }}
                formatter={(value: number, name) => [`${value.toFixed(1)} W`, name]}
                labelFormatter={(value) => `Швидкість: ${value} км/год`}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="parasitePower" name="Паразитна потужність" stroke="#f4900c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="inducedPower" name="Індуктивна потужність" stroke="#4a6fa5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="reqPower" name="Потрібна потужність" stroke="#1a2035" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="availablePower" name="Доступна потужність" stroke="#3d9e42" strokeWidth={3} strokeDasharray="6 4" dot={false} />
              <ReferenceLine x={Math.round(stallSpeedKmh)} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={2} label={{ value: `Vstall ${Math.round(stallSpeedKmh)} км/год`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
              <ReferenceDot x={minPowerSpeedKmh} y={minPowerW} r={6} fill="#e8740c" stroke="#fff" label={{ value: 'Min Power', position: 'top', fontSize: 11 }} />
              <ReferenceDot x={carsonSpeedKmh} y={points.find((point) => Math.abs(point.speedKmh - carsonSpeedKmh) < 2)?.reqPower ?? minPowerW} r={6} fill="#4a6fa5" stroke="#fff" label={{ value: 'Carson', position: 'top', fontSize: 11 }} />
              <ReferenceDot x={maxSpeedKmh} y={points.find((point) => point.speedKmh === maxSpeedKmh)?.reqPower ?? minPowerW} r={6} fill="#3d9e42" stroke="#fff" label={{ value: 'Vmax', position: 'top', fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}