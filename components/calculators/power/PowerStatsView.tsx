import { Flame } from 'lucide-react'
import { ResultBox, formatToolNumber } from '@/components/calculators/CalculatorToolPrimitives'
import { type BatteryPackResult, cRate, packEnergyDensity } from '@/lib/battery-pack'

export type PowerStatsViewProps = {
  readonly result: BatteryPackResult
  readonly loadCurrentA: number
  readonly selectedCellMaxContinuousA?: number
  readonly selectedPeukertK?: number
  readonly peukertCorrectedMah: number | null
  readonly peukertFlightTimeMin: number | null
}

export function PowerStatsView(props: PowerStatsViewProps) {
  const {
    result,
    loadCurrentA,
    selectedCellMaxContinuousA,
    selectedPeukertK,
    peukertCorrectedMah,
    peukertFlightTimeMin,
  } = props

  return (
    <div className="space-y-1.5">
      <ResultBox copyValue={formatToolNumber(result.nominalVoltageV, 1)}>
        Напруга (номінал): <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.nominalVoltageV, 1)} В</span>
        <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(result.chargedVoltageV, 1)} В заряд / {formatToolNumber(result.cutoffVoltageV, 1)} В відсічка)</span>
      </ResultBox>
      <ResultBox copyValue={formatToolNumber(result.capacityAh, 3)}>
        Ємність (номінал): <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.capacityAh * 1000, 0)} мАч</span>
        {peukertCorrectedMah !== null && (
          <span className="ml-2 text-xs text-ecalc-muted">
            → Пекерт: {formatToolNumber(peukertCorrectedMah, 0)} мАч при {formatToolNumber(loadCurrentA, 1)} А
          </span>
        )}
      </ResultBox>
      {peukertFlightTimeMin !== null && peukertFlightTimeMin > 0 && (
        <ResultBox>
          Польотний час (Пекерт, 20% резерв):{' '}
          <span className="font-semibold text-ecalc-navy">{formatToolNumber(peukertFlightTimeMin, 1)} хв</span>
          <span className="ml-2 text-xs text-ecalc-muted">K={selectedPeukertK ?? '—'}</span>
        </ResultBox>
      )}
      <ResultBox copyValue={formatToolNumber(result.energyWh, 2)}>
        Енергія: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.energyWh, 2)} Вт·год</span>
        <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(packEnergyDensity(result.energyWh, result.weightG), 0)} Вт·год/кг)</span>
      </ResultBox>
      <ResultBox copyValue={formatToolNumber(result.weightG, 0)}>
        Вага: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.weightG, 0)} г</span>
        <span className="ml-2 text-xs text-ecalc-muted">(з урахуванням +5% кабелів)</span>
      </ResultBox>

      <div className={`rounded-xl border px-3.5 py-2.5 text-sm ${result.loadIsOverSpec ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-ecalc-orange/15 bg-gradient-to-r from-ecalc-orange/6 to-[#161b27] text-ecalc-text'}`}>
        <div className="flex items-center justify-between">
          <span>Падіння напруги під навантаженням:</span>
          <span className="font-semibold">{formatToolNumber(result.voltageSagV, 3)} В</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Напруга під навантаженням:</span>
          <span className="font-semibold">{formatToolNumber(result.voltageUnderLoadV, 2)} В</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Тепловтрати (Джоуль-Ленц):</span>
          <span className="font-semibold">{formatToolNumber(result.powerLossW, 2)} Вт</span>
        </div>
        <div className="flex items-center justify-between">
          <span>C-Rate:</span>
          <span className="font-semibold">{formatToolNumber(cRate(loadCurrentA, result.capacityAh), 2)}C</span>
        </div>
        {result.loadIsOverSpec && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <Flame className="h-3 w-3" />
            Струм на комірку ({formatToolNumber(result.currentPerCellA, 1)} А) перевищує допустимий ({selectedCellMaxContinuousA ?? 0} А) - перегрів!
          </div>
        )}
      </div>
    </div>
  )
}
