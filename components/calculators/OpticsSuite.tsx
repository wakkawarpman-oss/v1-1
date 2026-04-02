'use client'

import { useState } from 'react'
import { Camera, Radio, Wifi, Crosshair, Antenna } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CalcEmptyState, Field, formatToolNumber, ResultBox, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { usePersistedState } from '@/hooks/usePersistedState'
import {
  gsd, fovDeg, cameraFootprint, SENSOR_PRESETS,
  fresnelZone, antennaLengths,
  imdConflictMatrix, linkBudget, maxLinkDistanceKm,
  detailedLinkBudget,
  type FootprintResult, type LinkBudgetResult,
} from '@/lib/optics'
import { calculateJohnsonCriteria } from '@/lib/optics-dri'

// ── GSD & FOV Calculator ──────────────────────────────────────────────────────

type GSDState = {
  sensorId: string
  customWidthMm: number
  customHeightMm: number
  focalLengthMm: number
  imageWidthPx: number
  imageHeightPx: number
  altitudeM: number
}

const GSD_DEFAULTS: GSDState = {
  sensorId: '1-2.3',
  customWidthMm: 6.17,
  customHeightMm: 4.56,
  focalLengthMm: 4.5,
  imageWidthPx: 4056,
  imageHeightPx: 3040,
  altitudeM: 100,
}

type GSDResult = { gsdCmPx: number; hFovDeg: number; vFovDeg: number; dFovDeg: number; footprint: FootprintResult }

function GSDCard() {
  const [state, setState] = usePersistedState('optics.gsd', GSD_DEFAULTS)
  const [result, setResult] = useState<GSDResult | null>(null)

  const activeSensor = SENSOR_PRESETS.find((s) => s.id === state.sensorId) ?? SENSOR_PRESETS[0]
  const sensorW = state.sensorId === 'custom' ? state.customWidthMm : activeSensor.widthMm
  const sensorH = state.sensorId === 'custom' ? state.customHeightMm : activeSensor.heightMm

  function calculate() {
    const hFovDeg = fovDeg(sensorW, state.focalLengthMm)
    const vFovDeg = fovDeg(sensorH, state.focalLengthMm)
    setResult({
      gsdCmPx: gsd({ altitudeM: state.altitudeM, sensorWidthMm: sensorW, focalLengthMm: state.focalLengthMm, imageWidthPx: state.imageWidthPx }),
      hFovDeg,
      vFovDeg,
      dFovDeg: fovDeg(Math.hypot(sensorW, sensorH), state.focalLengthMm),
      footprint: cameraFootprint({ altitudeM: state.altitudeM, hFovDeg, vFovDeg }),
    })
  }

  return (
    <ToolCard
      icon={<Camera className="h-4 w-4" />}
      title="GSD та охоплення кадру"
      description="Ground Sample Distance (см/піксель), поле зору та площа знімка на висоті польоту."
    >
      <Field label="Сенсор">
        <Select title="Сенсор" aria-label="Сенсор" value={state.sensorId} onChange={(e) => setState((s) => ({ ...s, sensorId: e.target.value }))}>
          {SENSOR_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </Select>
        {state.sensorId !== 'custom' && (
          <div className="mt-1 text-[10px] text-ecalc-muted">{activeSensor.widthMm} × {activeSensor.heightMm} мм</div>
        )}
      </Field>
      {state.sensorId === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ширина сенсора, мм">
            <Input type="number" step="0.01" value={state.customWidthMm} onChange={(e) => setState((s) => ({ ...s, customWidthMm: Number(e.target.value) }))} />
          </Field>
          <Field label="Висота сенсора, мм">
            <Input type="number" step="0.01" value={state.customHeightMm} onChange={(e) => setState((s) => ({ ...s, customHeightMm: Number(e.target.value) }))} />
          </Field>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Фокусна відстань, мм">
          <Input type="number" step="0.1" min="0.1" value={state.focalLengthMm} onChange={(e) => setState((s) => ({ ...s, focalLengthMm: Number(e.target.value) }))} />
        </Field>
        <Field label="Висота польоту, м">
          <Input type="number" min="0" value={state.altitudeM} onChange={(e) => setState((s) => ({ ...s, altitudeM: Number(e.target.value) }))} />
        </Field>
        <Field label="Ширина знімка, пкс">
          <Input type="number" min="1" value={state.imageWidthPx} onChange={(e) => setState((s) => ({ ...s, imageWidthPx: Number(e.target.value) }))} />
        </Field>
        <Field label="Висота знімка, пкс">
          <Input type="number" min="1" value={state.imageHeightPx} onChange={(e) => setState((s) => ({ ...s, imageHeightPx: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <>
          <ResultBox copyValue={formatToolNumber(result.gsdCmPx, 2)}>
            GSD: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.gsdCmPx, 2)} см/піксель</span>
          </ResultBox>
          <ResultBox>
            Поле зору: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.hFovDeg, 1)}°</span> × <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.vFovDeg, 1)}°</span> (Г × В)
            <span className="ml-2 text-xs text-ecalc-muted">діаг. {formatToolNumber(result.dFovDeg, 1)}°</span>
          </ResultBox>
          <ResultBox copyValue={`${formatToolNumber(result.footprint.widthM, 1)} × ${formatToolNumber(result.footprint.heightM, 1)}`}>
            Охоплення: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.footprint.widthM, 1)} × {formatToolNumber(result.footprint.heightM, 1)} м</span>
            <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(result.footprint.areaM2 / 10000, 3)} га)</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}

// ── Fresnel Zone ──────────────────────────────────────────────────────────────

type FresnelState = { distanceKm: number; frequencyGHz: number }
const FRESNEL_DEFAULTS: FresnelState = { distanceKm: 5, frequencyGHz: 2.4 }

function FresnelCard() {
  const [state, setState] = usePersistedState('optics.fresnel', FRESNEL_DEFAULTS)
  const result = fresnelZone(state)

  return (
    <ToolCard
      icon={<Wifi className="h-4 w-4" />}
      title="Зона Френеля"
      description="Радіус першої зони Френеля на середині маршруту. Перешкоди в межах 60% радіуса призводять до помітних втрат сигналу."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Відстань, км">
          <Input type="number" step="0.1" min="0.01" value={state.distanceKm} onChange={(e) => setState((s) => ({ ...s, distanceKm: Number(e.target.value) }))} />
        </Field>
        <Field label="Частота, ГГц">
          <Input type="number" step="0.1" min="0.001" value={state.frequencyGHz} onChange={(e) => setState((s) => ({ ...s, frequencyGHz: Number(e.target.value) }))} />
        </Field>
      </div>
      <ResultBox copyValue={formatToolNumber(result.radiusM, 2)}>
        Радіус R₁: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.radiusM, 2)} м</span>
      </ResultBox>
      <ResultBox copyValue={formatToolNumber(result.minClearanceM, 2)}>
        Мін. зазор (60%): <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.minClearanceM, 2)} м</span>
      </ResultBox>
    </ToolCard>
  )
}

// ── Antenna Lengths ───────────────────────────────────────────────────────────

type AntennaState = { frequencyMHz: number; velocityFactor: number }
const ANTENNA_DEFAULTS: AntennaState = { frequencyMHz: 433, velocityFactor: 0.95 }

function AntennaCard() {
  const [state, setState] = usePersistedState('optics.antenna', ANTENNA_DEFAULTS)
  const lengths = antennaLengths(state.frequencyMHz, state.velocityFactor)

  return (
    <ToolCard
      icon={<Antenna className="h-4 w-4" />}
      title="Довжина антени (диполь)"
      description="Фізична довжина провідника з урахуванням коефіцієнта вкорочення (vf ≈ 0.95 для мідного дроту)."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Частота, МГц">
          <Input type="number" step="0.1" min="0.1" value={state.frequencyMHz} onChange={(e) => setState((s) => ({ ...s, frequencyMHz: Number(e.target.value) }))} />
        </Field>
        <Field label="Коефіцієнт вкорочення (vf)" hint="Мідь: 0.95, коаксіал RG-58: 0.66">
          <Input type="number" step="0.01" min={0.5} max={1} value={state.velocityFactor} onChange={(e) => setState((s) => ({ ...s, velocityFactor: Number(e.target.value) }))} />
        </Field>
      </div>
      <ResultBox copyValue={formatToolNumber(lengths.halfWaveMm, 0)}>
        λ/2 (диполь): <span className="font-semibold text-ecalc-navy">{formatToolNumber(lengths.halfWaveMm, 0)} мм</span>
        <span className="ml-2 text-xs text-ecalc-muted">({formatToolNumber(lengths.halfWaveMm / 2, 0)} мм на плече)</span>
      </ResultBox>
      <ResultBox copyValue={formatToolNumber(lengths.quarterWaveMm, 0)}>
        λ/4 (монополь): <span className="font-semibold text-ecalc-navy">{formatToolNumber(lengths.quarterWaveMm, 0)} мм</span>
      </ResultBox>
      <ResultBox copyValue={formatToolNumber(lengths.fullWaveMm, 0)}>
        λ (повна хвиля): <span className="font-semibold text-ecalc-navy">{formatToolNumber(lengths.fullWaveMm, 0)} мм</span>
      </ResultBox>
    </ToolCard>
  )
}

// ── Link Budget ───────────────────────────────────────────────────────────────

type LinkState = {
  txPowerDbm: number
  txGainDbi: number
  rxGainDbi: number
  rxSensitivityDbm: number
  distanceKm: number
  frequencyMHz: number
  systemMarginDb: number
}

const LINK_DEFAULTS: LinkState = {
  txPowerDbm: 27,      // 500 mW
  txGainDbi: 2,
  rxGainDbi: 2,
  rxSensitivityDbm: -90,
  distanceKm: 5,
  frequencyMHz: 868,
  systemMarginDb: 10,
}

function LinkBudgetCard() {
  const [state, setState] = usePersistedState('optics.link', LINK_DEFAULTS)
  const [result, setResult] = useState<LinkBudgetResult | null>(null)
  const [maxDist, setMaxDist] = useState<number | null>(null)

  function calculate() {
    setResult(linkBudget(state))
    setMaxDist(maxLinkDistanceKm(state))
  }

  return (
    <ToolCard
      icon={<Radio className="h-4 w-4" />}
      title="Бюджет лінії зв'язку (Link Budget)"
      description="FSPL-модель: Ptx + Gtx + Grx – FSPL (дБ). Запас лінії = Prx – Prx_min – запас на завмирання."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Потужність TX, дБм" hint="30 дБм = 1 Вт">
          <Input type="number" step="0.5" value={state.txPowerDbm} onChange={(e) => setState((s) => ({ ...s, txPowerDbm: Number(e.target.value) }))} />
        </Field>
        <Field label="Частота, МГц">
          <Input type="number" min="0.1" value={state.frequencyMHz} onChange={(e) => setState((s) => ({ ...s, frequencyMHz: Number(e.target.value) }))} />
        </Field>
        <Field label="Підсилення TX, дБі">
          <Input type="number" step="0.5" value={state.txGainDbi} onChange={(e) => setState((s) => ({ ...s, txGainDbi: Number(e.target.value) }))} />
        </Field>
        <Field label="Підсилення RX, дБі">
          <Input type="number" step="0.5" value={state.rxGainDbi} onChange={(e) => setState((s) => ({ ...s, rxGainDbi: Number(e.target.value) }))} />
        </Field>
        <Field label="Чутливість RX, дБм">
          <Input type="number" step="1" value={state.rxSensitivityDbm} onChange={(e) => setState((s) => ({ ...s, rxSensitivityDbm: Number(e.target.value) }))} />
        </Field>
        <Field label="Відстань, км">
          <Input type="number" step="0.1" min="0.01" value={state.distanceKm} onChange={(e) => setState((s) => ({ ...s, distanceKm: Number(e.target.value) }))} />
        </Field>
        <Field label="Системний запас, дБ" hint="Рек. 10–12 дБ для LOS">
          <Input type="number" step="1" value={state.systemMarginDb} onChange={(e) => setState((s) => ({ ...s, systemMarginDb: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <>
          <ResultBox copyValue={formatToolNumber(result.fsplDb, 1)}>
            FSPL: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.fsplDb, 1)} дБ</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.receivedPowerDbm, 1)}>
            Prx: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.receivedPowerDbm, 1)} дБм</span>
          </ResultBox>
          {!Number.isFinite(result.linkMarginDb) ? (
            <div className="rounded-xl border border-ecalc-border bg-white/5 px-3.5 py-2.5 text-sm text-ecalc-muted">
              Запас лінії: — (перевірте вхідні дані)
            </div>
          ) : (
            <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${result.viable ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              Запас лінії: {formatToolNumber(result.linkMarginDb, 1)} дБ — {result.viable ? '✓ Лінк стабільний' : '✗ Недостатній запас'}
            </div>
          )}
          {maxDist !== null && (
            <ResultBox copyValue={formatToolNumber(maxDist, 2)}>
              Макс. дальність: <span className="font-semibold text-ecalc-navy">{formatToolNumber(maxDist, 2)} км</span>
            </ResultBox>
          )}
        </>
      )}
    </ToolCard>
  )
}

// ── IMD Matrix ────────────────────────────────────────────────────────────────

type IMDState = { freqInput: string }
const IMD_DEFAULTS: IMDState = { freqInput: '433, 868, 915' }

function IMDCard() {
  const [state, setState] = usePersistedState('optics.imd', IMD_DEFAULTS)
  const [conflicts, setConflicts] = useState<ReturnType<typeof imdConflictMatrix> | null>(null)

  function calculate() {
    const freqs = state.freqInput
      .split(/[,;\s]+/)
      .map(Number)
      .filter((f) => Number.isFinite(f) && f > 0)
    setConflicts(imdConflictMatrix(freqs))
  }

  return (
    <ToolCard
      icon={<Crosshair className="h-4 w-4" />}
      title="Матриця ІМД 3-го порядку"
      description="Інтермодуляція між активними частотами: 2×F1 – F2. Виявляє частоти, що пригнічують канали зв'язку."
    >
      <Field label="Активні частоти, МГц" hint="Розділяйте комою або пробілом">
        <Input
          type="text"
          placeholder="433, 868, 915"
          value={state.freqInput}
          onChange={(e) => setState((s) => ({ ...s, freqInput: e.target.value }))}
        />
      </Field>
      <Button onClick={calculate}>Перевірити конфлікти</Button>
      {conflicts !== null && (
        conflicts.length === 0 ? (
          <div className="rounded-xl border border-ecalc-green/30 bg-ecalc-green/10 px-3.5 py-2.5 text-sm font-medium text-ecalc-green">
            ✓ Конфліктів ІМД 3-го порядку не виявлено
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-400">
              Виявлено {conflicts.length} конфліктів
            </div>
            {conflicts.map((c) => (
              <div key={`${c.f1MHz}-${c.f2MHz}-${c.product3rdMHz}`} className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                2×{c.f1MHz} – {c.f2MHz} = <strong>{c.product3rdMHz} МГц</strong> → заважає каналу {c.conflictsWith} МГц
              </div>
            ))}
          </div>
        )
      )}
    </ToolCard>
  )
}

// ── Detailed Link Budget ──────────────────────────────────────────────────────

type DetailedLinkState = {
  txPowerDbm: number
  txGainDbi: number
  txLossDb: number
  rxGainDbi: number
  rxLossDb: number
  rxSensitivityDbm: number
  systemNoiseFigureDb: number
  distanceKm: number
  frequencyMHz: number
  additionalLossDb: number
}

const DETAILED_LINK_DEFAULTS: DetailedLinkState = {
  txPowerDbm: 27,
  txGainDbi: 5,
  txLossDb: 1,
  rxGainDbi: 5,
  rxLossDb: 1,
  rxSensitivityDbm: -95,
  systemNoiseFigureDb: 6,
  distanceKm: 10,
  frequencyMHz: 868,
  additionalLossDb: 0,
}

function DetailedLinkBudgetCard() {
  const [state, setState] = usePersistedState('optics.detailedlink', DETAILED_LINK_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof detailedLinkBudget> | null>(null)

  function calculate() {
    setResult(detailedLinkBudget(state))
  }

  return (
    <ToolCard
      icon={<Radio className="h-4 w-4" />}
      title="Детальний бюджет лінії (EIRP + втрати)"
      description="Враховує втрати кабелів TX/RX, шум-фігуру, додаткові втрати (дощ, рослинність). EIRP = Ptx + Gtx – Ltx."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ptx, дБм" hint="27 = 500 мВт, 30 = 1 Вт">
          <Input type="number" step="0.5" value={state.txPowerDbm} onChange={(e) => setState((s) => ({ ...s, txPowerDbm: Number(e.target.value) }))} />
        </Field>
        <Field label="Частота, МГц">
          <Input type="number" min="0.1" value={state.frequencyMHz} onChange={(e) => setState((s) => ({ ...s, frequencyMHz: Number(e.target.value) }))} />
        </Field>
        <Field label="Gtx, дБі">
          <Input type="number" step="0.5" value={state.txGainDbi} onChange={(e) => setState((s) => ({ ...s, txGainDbi: Number(e.target.value) }))} />
        </Field>
        <Field label="Ltx (втрати кабелю TX), дБ">
          <Input type="number" step="0.1" min="0" value={state.txLossDb} onChange={(e) => setState((s) => ({ ...s, txLossDb: Number(e.target.value) }))} />
        </Field>
        <Field label="Grx, дБі">
          <Input type="number" step="0.5" value={state.rxGainDbi} onChange={(e) => setState((s) => ({ ...s, rxGainDbi: Number(e.target.value) }))} />
        </Field>
        <Field label="Lrx (втрати кабелю RX), дБ">
          <Input type="number" step="0.1" min="0" value={state.rxLossDb} onChange={(e) => setState((s) => ({ ...s, rxLossDb: Number(e.target.value) }))} />
        </Field>
        <Field label="Чутливість RX, дБм">
          <Input type="number" step="1" value={state.rxSensitivityDbm} onChange={(e) => setState((s) => ({ ...s, rxSensitivityDbm: Number(e.target.value) }))} />
        </Field>
        <Field label="Шум-фігура системи, дБ">
          <Input type="number" step="0.5" min="0" value={state.systemNoiseFigureDb} onChange={(e) => setState((s) => ({ ...s, systemNoiseFigureDb: Number(e.target.value) }))} />
        </Field>
        <Field label="Відстань, км">
          <Input type="number" step="0.1" min="0.01" value={state.distanceKm} onChange={(e) => setState((s) => ({ ...s, distanceKm: Number(e.target.value) }))} />
        </Field>
        <Field label="Додаткові втрати, дБ" hint="Дощ, рослинність, тощо">
          <Input type="number" step="0.5" min="0" value={state.additionalLossDb} onChange={(e) => setState((s) => ({ ...s, additionalLossDb: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <>
          <ResultBox copyValue={formatToolNumber(result.eirpDbm, 1)}>
            EIRP: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.eirpDbm, 1)} дБм</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.fsplDb, 1)}>
            FSPL: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.fsplDb, 1)} дБ</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.rxPowerDbm, 1)}>
            Prx: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.rxPowerDbm, 1)} дБм</span>
          </ResultBox>
          <ResultBox copyValue={formatToolNumber(result.snrDb, 1)}>
            SNR: <span className="font-semibold text-ecalc-navy">{formatToolNumber(result.snrDb, 1)} дБ</span>
          </ResultBox>
          {!Number.isFinite(result.marginDb) ? (
            <div className="rounded-xl border border-ecalc-border bg-white/5 px-3.5 py-2.5 text-sm text-ecalc-muted">
              Запас: — (перевірте вхідні дані)
            </div>
          ) : (
            <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${result.linkOk ? 'border-ecalc-green/30 bg-ecalc-green/10 text-ecalc-green' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
              Запас: {formatToolNumber(result.marginDb, 1)} дБ — {result.linkOk ? '✓ Лінк стабільний' : '✗ Недостатній запас'}
            </div>
          )}
        </>
      )}
    </ToolCard>
  )
}

// ── DRI — Johnson Criteria ────────────────────────────────────────────────────

type DRIState = {
  sensorWidthMm: number
  focalLengthMm: number
  imageWidthPixels: number
  targetCriticalDimensionM: number
}

const DRI_DEFAULTS: DRIState = {
  sensorWidthMm: 6.17,
  focalLengthMm: 4.5,
  imageWidthPixels: 4056,
  targetCriticalDimensionM: 0.5,
}

function DRICard() {
  const [state, setState] = usePersistedState('optics.dri', DRI_DEFAULTS)
  const [result, setResult] = useState<ReturnType<typeof calculateJohnsonCriteria> | null>(null)

  function calculate() {
    setResult(calculateJohnsonCriteria(state))
  }

  return (
    <ToolCard
      icon={<Crosshair className="h-4 w-4" />}
      title="DRI — критерії Джонсона"
      description="Максимальна дальність виявлення / розпізнавання / ідентифікації цілі (Johnson 1958, NATO STANAG 4586)."
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ширина сенсора, мм">
          <Input type="number" step="0.01" min="0.1" value={state.sensorWidthMm}
            onChange={(e) => setState((s) => ({ ...s, sensorWidthMm: Number(e.target.value) }))} />
        </Field>
        <Field label="Фокусна відстань, мм">
          <Input type="number" step="0.1" min="0.1" value={state.focalLengthMm}
            onChange={(e) => setState((s) => ({ ...s, focalLengthMm: Number(e.target.value) }))} />
        </Field>
        <Field label="Ширина знімка, пкс">
          <Input type="number" min="1" value={state.imageWidthPixels}
            onChange={(e) => setState((s) => ({ ...s, imageWidthPixels: Number(e.target.value) }))} />
        </Field>
        <Field label="Критичний розмір цілі, м">
          <Input type="number" step="0.1" min="0.1" value={state.targetCriticalDimensionM}
            onChange={(e) => setState((s) => ({ ...s, targetCriticalDimensionM: Number(e.target.value) }))} />
        </Field>
      </div>
      <Button onClick={calculate}>Розрахувати</Button>
      {!result && <CalcEmptyState />}
      {result && (
        <>
          <ResultBox copyValue={String(result.detectionMaxDistanceM)}>
            Виявлення (≥1.5 пкс): <span className="font-semibold text-ecalc-navy">{(result.detectionMaxDistanceM / 1000).toFixed(2)} км</span>
          </ResultBox>
          <ResultBox copyValue={String(result.recognitionMaxDistanceM)}>
            Розпізнавання (≥6 пкс): <span className="font-semibold text-ecalc-navy">{(result.recognitionMaxDistanceM / 1000).toFixed(2)} км</span>
          </ResultBox>
          <ResultBox copyValue={String(result.identificationMaxDistanceM)}>
            Ідентифікація (≥12 пкс): <span className="font-semibold text-ecalc-navy">{(result.identificationMaxDistanceM / 1000).toFixed(2)} км</span>
          </ResultBox>
          <ResultBox copyValue={String(result.gsdDetectionM)}>
            GSD (виявл.): <span className="font-semibold text-ecalc-navy">{(result.gsdDetectionM * 100).toFixed(1)} см/пкс</span>
          </ResultBox>
        </>
      )}
    </ToolCard>
  )
}

export function OpticsSuite() {
  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Оптика та РЕБ / Радіо</CardTitle>
          <CardDescription>
            Розвідувальна оптика (GSD, FOV, охоплення), DRI-дальність (критерії Джонсона),
            бюджет лінії зв&apos;язку (FSPL), зони Френеля, довжини антен, матриця ІМД.
            Усі моделі — аналітичні, в умовах відкритого горизонту LOS.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <GSDCard />
        <DRICard />
        <LinkBudgetCard />
        <DetailedLinkBudgetCard />
        <FresnelCard />
        <AntennaCard />
        <IMDCard />
      </div>
    </section>
  )
}
