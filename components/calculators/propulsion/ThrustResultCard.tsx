import { memo } from 'react'
import { round } from '@/lib/aero'
import type { RiskLevel, ThrustResult } from '@/lib/propulsion-physics'

type ThrustResultCardProps = {
  readonly result: ThrustResult
}

function riskTone(risk: RiskLevel): string {
  if (risk === 'critical') return 'text-rose-400'
  if (risk === 'warning') return 'text-amber-400'
  return 'text-emerald-400'
}

function ThrustResultCardInner({ result }: ThrustResultCardProps) {
  return (
    <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-ecalc-navy">Thrust Calculator</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Metric label="Статична тяга" value={`${round(result.thrustG, 0)} г`} />
        <Metric label="Очікуваний струм" value={`${round(result.currentA, 1)} A`} />
        <Metric label="Потужність" value={`${round(result.electricalPowerW, 0)} W`} />
        <Metric label="Ефективність" value={`${round(result.efficiencyGW, 2)} г/Вт`} />
        <Metric label="Tip Mach" value={round(result.tipMach, 2).toString()} />
      </div>

      <div className="text-xs text-ecalc-muted">
        Індекс навантаження пропа: <span className="font-semibold text-ecalc-navy">{round(result.propLoadIndex, 2)}</span>
      </div>

      <div className={`text-xs font-semibold ${riskTone(result.overheatRisk)}`}>
        Overheat Risk: {result.overheatRisk === 'none' ? 'LOW' : result.overheatRisk.toUpperCase()}
      </div>

      {result.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 space-y-1">
          {result.warnings.map((warning) => (
            <p key={warning}>⚠ {warning}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export const ThrustResultCard = memo(ThrustResultCardInner)

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-ecalc-muted">{label}</div>
      <div className="mt-1 text-base font-semibold text-ecalc-navy">{value}</div>
    </div>
  )
}
