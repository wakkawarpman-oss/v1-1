import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MotorSpec } from '@/lib/motor-db'
import type { MotorDraft } from '@/lib/propulsion-contracts'

type MotorCardProps = {
  readonly draft: MotorDraft
  readonly motorQuery: string
  readonly motorResults: ReadonlyArray<MotorSpec>
  readonly autoSuggest: boolean
  readonly onMotorQueryChange: (value: string) => void
  readonly onApplyMotor: (motor: MotorSpec) => void
  readonly onDraftChange: <K extends keyof MotorDraft>(key: K, value: number) => void
  readonly onAutoSuggestChange: (enabled: boolean) => void
}

export function MotorCard(props: MotorCardProps) {
  const {
    draft,
    motorQuery,
    motorResults,
    autoSuggest,
    onMotorQueryChange,
    onApplyMotor,
    onDraftChange,
    onAutoSuggestChange,
  } = props

  return (
    <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ecalc-navy">Motor Selector</h4>
        <label className="flex items-center gap-1.5 text-xs text-ecalc-muted">
          <input
            type="checkbox"
            checked={autoSuggest}
            onChange={(e) => onAutoSuggestChange(e.target.checked)}
          />
          Auto-suggest проп
        </label>
      </div>

      <div className="space-y-1.5 relative">
        <Label htmlFor="propulsion-motor-search">Пошук мотора</Label>
        <Input
          id="propulsion-motor-search"
          type="text"
          value={motorQuery}
          placeholder="напр. T-Motor MN4010"
          onChange={(e) => onMotorQueryChange(e.target.value)}
        />
        {motorResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-ecalc-border bg-ecalc-darksurf shadow-xl">
            {motorResults.map((motor) => (
              <button
                key={motor.id}
                type="button"
                className="w-full px-3 py-2 text-left text-xs hover:bg-white/10"
                onClick={() => onApplyMotor(motor)}
              >
                <span className="font-semibold text-white/90">{motor.brand} {motor.name}</span>
                <span className="ml-2 text-white/50">Kv={motor.kv} · Ri={motor.ri}Ω · I0={motor.i0}A</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="motor-kv">KV</Label>
          <Input id="motor-kv" type="number" value={draft.kv} onChange={(e) => onDraftChange('kv', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motor-ri">Ri, Ω</Label>
          <Input id="motor-ri" type="number" step="0.001" value={draft.riOhms} onChange={(e) => onDraftChange('riOhms', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motor-i0">I0, A</Label>
          <Input id="motor-i0" type="number" step="0.1" value={draft.i0A} onChange={(e) => onDraftChange('i0A', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motor-esc">ESC max, A</Label>
          <Input id="motor-esc" type="number" value={draft.escMaxAmps} onChange={(e) => onDraftChange('escMaxAmps', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motor-stator">Stator, мм</Label>
          <Input id="motor-stator" type="number" value={draft.statorDiameterMm} onChange={(e) => onDraftChange('statorDiameterMm', Number(e.target.value))} />
        </div>
      </div>
    </div>
  )
}
