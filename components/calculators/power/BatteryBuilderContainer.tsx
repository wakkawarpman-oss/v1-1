'use client'

import { useMemo, useState } from 'react'
import { CalcEmptyState } from '@/components/calculators/CalculatorToolPrimitives'
import { BatterySelectorView } from '@/components/calculators/power/BatterySelectorView'
import { PowerStatsView } from '@/components/calculators/power/PowerStatsView'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useIntegrationState } from '@/hooks/useIntegrationState'
import {
  batteryPack,
  packMaxCurrent,
  type BatteryPackResult,
} from '@/lib/battery-pack'
import {
  CELL_DB,
  LIPO_DB,
  peukertCapacityMah,
  peukertFlightTimeMin,
  type CellFormFactor,
} from '@/lib/battery-db'
import {
  mapBatteryDraftToInput,
  mergeDraftNumber,
  switchBatteryChemistry,
  type BatteryDraft,
} from '@/lib/power-contracts'
import { estimateFlightTimeAt80DoD } from '@/lib/integration-contracts'

type BatteryBuilderState = {
  batteryType: 'liion-cell' | 'lipo-pack'
  formFactor: CellFormFactor | 'all'
  cellId: string
  lipoId: string
  s: number
  p: number
  loadCurrentA: number
  customCapacityMah: number
  customNominalV: number
  customMaxA: number
  customRiMOhms: number
  customWeightG: number
  cutoffPerCellV: number
}

const DEFAULT_STATE: BatteryBuilderState = {
  batteryType: 'liion-cell',
  formFactor: 'all',
  cellId: 'molicel-p42a',
  lipoId: LIPO_DB[0]?.id ?? '',
  s: 6,
  p: 1,
  loadCurrentA: 30,
  customCapacityMah: 3000,
  customNominalV: 3.7,
  customMaxA: 20,
  customRiMOhms: 20,
  customWeightG: 65,
  cutoffPerCellV: 3,
}

const DEFAULT_DRAFT: BatteryDraft = {
  chemistry: 'Li-Ion',
  sCount: 6,
  pCount: 1,
  voltagePerCellV: 3.7,
  capacityMah: 3000,
  dischargeCRating: 15,
  loadCurrentA: 30,
  weightG: 390,
  cutoffPerCellV: 3,
}

export function BatteryBuilderContainer({ onPackBuilt }: { onPackBuilt: (capacityAh: number, voltageV: number) => void }) {
  const [state, setState] = usePersistedState('batterypack.builder', DEFAULT_STATE)
  const [result, setResult] = useState<BatteryPackResult | null>(null)
  const integration = useIntegrationState()

  const selectedCell = useMemo(
    () => CELL_DB.find((c) => c.id === state.cellId) ?? CELL_DB[0],
    [state.cellId],
  )
  const selectedLipo = useMemo(
    () => LIPO_DB.find((p) => p.id === state.lipoId) ?? LIPO_DB[0],
    [state.lipoId],
  )

  const visibleCells = useMemo(
    () => CELL_DB.filter((c) => c.id === 'custom' || state.formFactor === 'all' || c.formFactor === state.formFactor),
    [state.formFactor],
  )

  const safeInput = useMemo(() => {
    if (state.batteryType === 'lipo-pack' && selectedLipo) {
      const lipoDraft = switchBatteryChemistry(
        {
          ...DEFAULT_DRAFT,
          chemistry: 'LiPo',
          sCount: selectedLipo.sCells,
          pCount: Math.max(1, selectedLipo.pCells),
          voltagePerCellV: 3.7,
          capacityMah: selectedLipo.capacityMah,
          dischargeCRating: selectedLipo.continuousC,
          loadCurrentA: state.loadCurrentA,
          weightG: selectedLipo.weightG,
          cutoffPerCellV: 3.2,
        },
        'LiPo',
      )
      return mapBatteryDraftToInput(lipoDraft, lipoDraft)
    }

    const usesCustomCell = state.cellId === 'custom'
    const activeCell = usesCustomCell
      ? {
          capacityMah: state.customCapacityMah,
          nominalVoltageV: state.customNominalV,
          maxContinuousA: state.customMaxA,
          weightG: state.customWeightG,
        }
      : selectedCell

    const capacityAh = (activeCell.capacityMah * state.p) / 1000
    const maxCurrentA = activeCell.maxContinuousA * state.p

    const liionDraft = switchBatteryChemistry(
      {
        ...DEFAULT_DRAFT,
        chemistry: 'Li-Ion',
        sCount: state.s,
        pCount: state.p,
        voltagePerCellV: activeCell.nominalVoltageV,
        capacityMah: activeCell.capacityMah * state.p,
        dischargeCRating: capacityAh > 0 ? maxCurrentA / capacityAh : DEFAULT_DRAFT.dischargeCRating,
        loadCurrentA: state.loadCurrentA,
        weightG: activeCell.weightG * state.s * state.p,
        cutoffPerCellV: state.cutoffPerCellV,
      },
      'Li-Ion',
    )

    return mapBatteryDraftToInput(liionDraft, liionDraft)
  }, [state, selectedCell, selectedLipo])

  const maxPackCurrentA = useMemo(() => {
    if (state.batteryType === 'lipo-pack' && selectedLipo) {
      return (selectedLipo.capacityMah / 1000) * selectedLipo.continuousC
    }
    if (state.cellId === 'custom') return state.customMaxA * state.p
    return packMaxCurrent(state.s, state.p, state.cellId)
  }, [state, selectedLipo])

  function onBatteryTypeChange(next: 'liion-cell' | 'lipo-pack') {
    setState((prev) => {
      if (next === prev.batteryType) return prev
      if (next === 'lipo-pack') {
        const preset = LIPO_DB.find((p) => p.id === prev.lipoId) ?? LIPO_DB[0]
        return {
          ...prev,
          batteryType: 'lipo-pack',
          s: preset?.sCells ?? prev.s,
          p: Math.max(1, preset?.pCells ?? prev.p),
          cutoffPerCellV: 3.2,
        }
      }
      return {
        ...prev,
        batteryType: 'liion-cell',
        cutoffPerCellV: 3.0,
      }
    })
  }

  function onLipoIdChange(id: string) {
    const preset = LIPO_DB.find((pack) => pack.id === id)
    setState((prev) => {
      if (!preset) return { ...prev, lipoId: id }
      return {
        ...prev,
        lipoId: id,
        s: preset.sCells,
        p: Math.max(1, preset.pCells),
        cutoffPerCellV: 3.2,
      }
    })
  }

  function onNumberChange(key: string, next: number) {
    setState((prev) => {
      if (!(key in prev)) return prev
      return mergeDraftNumber(prev, key as keyof BatteryBuilderState, next)
    })
  }

  function calculate() {
    const usesCustomCell = state.batteryType === 'lipo-pack' || state.cellId === 'custom'
    const customCell = usesCustomCell
      ? {
          capacityMah: state.batteryType === 'lipo-pack' && selectedLipo
            ? selectedLipo.capacityMah / Math.max(1, safeInput.pCount)
            : state.customCapacityMah,
          nominalVoltageV: safeInput.voltagePerCellV,
          maxContinuousA: state.batteryType === 'lipo-pack' && selectedLipo
            ? safeInput.maxContinuousCurrentA / Math.max(1, safeInput.pCount)
            : state.customMaxA,
          riMOhms: state.batteryType === 'lipo-pack' && selectedLipo
            ? selectedLipo.riMOhmsTotal / Math.max(1, safeInput.sCount)
            : state.customRiMOhms,
          weightG: state.batteryType === 'lipo-pack' && selectedLipo
            ? selectedLipo.weightG / Math.max(1, safeInput.sCount * safeInput.pCount)
            : state.customWeightG,
        }
      : undefined

    const nextResult = batteryPack({
      s: safeInput.sCount,
      p: safeInput.pCount,
      cellId: usesCustomCell ? 'custom' : state.cellId,
      customCell,
      loadCurrentA: safeInput.loadCurrentA,
    })

    setResult(nextResult)
    if (nextResult) {
      onPackBuilt(nextResult.capacityAh, nextResult.nominalVoltageV)
      integration.patch({
        batteryCells: safeInput.sCount,
        batteryCellWeightG: nextResult.weightG / Math.max(1, safeInput.sCount),
        batteryCapacityMah: nextResult.capacityAh * 1000,
        batteryVoltageV: nextResult.nominalVoltageV,
        flightTime80Min: estimateFlightTimeAt80DoD({
          batteryCapacityMah: nextResult.capacityAh * 1000,
          hoverCurrentA: integration.state.hoverCurrentA,
        }),
      })
    }
  }

  const peukertK = state.batteryType === 'lipo-pack'
    ? selectedLipo?.peukertK
    : selectedCell?.peukertK
  const ratedCapacityMah = state.batteryType === 'lipo-pack'
    ? selectedLipo?.capacityMah ?? 0
    : (state.cellId === 'custom' ? state.customCapacityMah * safeInput.pCount : (selectedCell?.capacityMah ?? 0) * safeInput.pCount)

  const peukertCorrectedMah = result && peukertK
    ? peukertCapacityMah(ratedCapacityMah, safeInput.loadCurrentA, peukertK)
    : null

  const peukertFlightTime = result && peukertK
    ? peukertFlightTimeMin(ratedCapacityMah, safeInput.loadCurrentA, peukertK)
    : null

  return (
    <div className="space-y-3">
      <BatterySelectorView
        batteryType={state.batteryType}
        formFactor={state.formFactor}
        cellId={state.cellId}
        lipoId={state.lipoId}
        s={state.s}
        p={state.p}
        loadCurrentA={state.loadCurrentA}
        customCapacityMah={state.customCapacityMah}
        customNominalV={state.customNominalV}
        customMaxA={state.customMaxA}
        customRiMOhms={state.customRiMOhms}
        customWeightG={state.customWeightG}
        maxPackCurrentA={maxPackCurrentA}
        selectedCellNotes={selectedCell?.notes}
        selectedLipoNotes={selectedLipo?.notes}
        visibleCells={visibleCells}
        lipoPacks={LIPO_DB}
        onBatteryTypeChange={onBatteryTypeChange}
        onFormFactorChange={(next) => setState((prev) => ({ ...prev, formFactor: next }))}
        onCellIdChange={(id) => setState((prev) => ({ ...prev, cellId: id }))}
        onLipoIdChange={onLipoIdChange}
        onNumberChange={onNumberChange}
        onCalculate={calculate}
      />

      {!result && <CalcEmptyState />}
      {result && (
        <PowerStatsView
          result={result}
          loadCurrentA={safeInput.loadCurrentA}
          selectedCellMaxContinuousA={state.batteryType === 'lipo-pack' && selectedLipo
            ? safeInput.maxContinuousCurrentA / Math.max(1, safeInput.pCount)
            : selectedCell?.maxContinuousA}
          selectedPeukertK={peukertK}
          peukertCorrectedMah={peukertCorrectedMah}
          peukertFlightTimeMin={peukertFlightTime}
        />
      )}
    </div>
  )
}
