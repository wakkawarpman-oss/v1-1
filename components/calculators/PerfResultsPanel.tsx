import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { round } from '@/lib/aero'

type Props = {
  summary: ReturnType<typeof import('@/lib/aero').perfSummary>
}

export function PerfResultsPanel({ summary }: Props) {
  const warnings: string[] = []

  if (summary.pitchSpeed < summary.stallSpeedKmh * 1.9) {
    warnings.push('Крокова швидкість пропелера замала: запас над швидкістю зриву менше рекомендованих 1.9×.')
  }
  if (summary.thrustToWeight < 0.5) {
    warnings.push('Низьке співвідношення тяги до ваги: модель матиме слабкий набір висоти.')
  }
  if (summary.thrustToWeight > 1.15) {
    warnings.push('Режим 3D можливий: статична тяга перевищує вагу моделі.')
  }

  const metrics = [
    ['Швидкість зриву (1g, чисте крило)', `${round(summary.stallSpeedKmh, 1)} км/год`],
    ['Pitch Speed', `${round(summary.pitchSpeed, 1)} км/год`],
    ['Найкраща дальність (за Карсоном)', `${round(summary.bestRangeKmh, 1)} км/год`],
    ['Макс. швидкість горизонтального польоту', `${round(summary.levelMaxSpeedKmh, 1)} км/год`],
    ['Макс. швидкість набору висоти', `${round(summary.maxRocMs, 2)} м/с @ ${round(summary.maxRocSpeedKmh, 0)} км/год`],
    ['Макс. кут набору', `${round(summary.maxAngleDeg, 1)}° @ ${round(summary.maxAngleSpeedKmh, 0)} км/год`],
    ['Мінімальна потрібна потужність', `${round(summary.minPowerW, 1)} W @ ${round(summary.minPowerSpeedKmh, 0)} км/год`],
    ['Співвідношення тяги до ваги', `${round(summary.thrustToWeight, 2)} : 1`],
    ['Час до 100 м', `${round(summary.timeTo100m, 1)} с`],
    ['Час до 500 м', `${round(summary.timeTo500m, 1)} с`],
    ['Оцінка польотного часу', `${round(summary.estimatedFlightTimeMin, 1)} хв`],
    ['Густина повітря', `${round(summary.density, 3)} кг/м³`],
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Ключові результати</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3">
                <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">{label}</div>
                <div className="mt-1 text-base font-semibold text-ecalc-navy">{value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <Alert>
          <AlertTitle>Перевірка конфігурації</AlertTitle>
          <AlertDescription>
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}