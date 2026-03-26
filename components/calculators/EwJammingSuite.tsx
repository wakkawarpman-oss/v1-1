'use client'

import { useMemo } from 'react'
import { usePersistedState } from '@/hooks/usePersistedState'
import { calculateJammingMargin, jammingRangeM, type JammingInput } from '@/lib/ew-jamming'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DEFAULTS: JammingInput = {
  txPowerDbm:        30,    // 1 W GCS
  txGainDbi:          2,
  txDistanceM:      5000,
  txBandwidthMhz:    0.5,   // ELRS LoRa
  processingGainDb:  12,    // LoRa SF6 coding gain
  jammerPowerDbm:    47,    // 50 W jammer
  jammerGainDbi:      5,
  jammerDistanceM:  3000,
  jammerBandwidthMhz: 100,  // barrage 100 MHz
}

function Field({ id, label, hint, value, step, onChange }: {
  id: string; label: string; hint?: string
  value: number | undefined; step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="text-[11px] text-ecalc-muted">{hint}</p>}
    </div>
  )
}

export function EwJammingSuite() {
  const [inp, setInp] = usePersistedState<JammingInput>('ew-jamming.v1', DEFAULTS)

  function set<K extends keyof JammingInput>(key: K, val: number) {
    setInp((prev) => ({ ...prev, [key]: val }))
  }

  const result = useMemo(() => calculateJammingMargin(inp, 6), [inp])
  const rangeM  = useMemo(() => jammingRangeM(inp, 6), [inp])

  const jammed = result.isJammed
  const statusColor = jammed
    ? 'border-red-500/40 bg-red-500/8'
    : 'border-green-500/40 bg-green-500/8'
  const labelColor  = jammed ? 'text-red-400' : 'text-green-400'

  return (
    <section className="space-y-6">
      {/* Hero */}
      <div className="calc-hero">
        <div className="relative z-10 px-5 py-6 sm:px-6 sm:py-7">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            Радіоелектронна боротьба
          </div>
          <h3 className="display-font mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            РЕБ — Стійкість лінку зв&apos;язку
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/72">
            Розраховує відношення Завада/Сигнал (J/S) на вході приймача БПЛА. Враховує загороджувальну заваду (bandwidth penalty) та виграш від кодування (processing gain) для ELRS/LoRa і аналогових систем.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* GCS side */}
        <Card>
          <CardHeader>
            <CardTitle>Наземна станція (GCS)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="txPower" label="Потужність TX, dBm" hint="30=1W · 33=2W · 40=10W"
                value={inp.txPowerDbm} step={1} onChange={(v) => set('txPowerDbm', v)} />
              <Field id="txGain" label="Підсилення антени, dBi"
                value={inp.txGainDbi} step={0.5} onChange={(v) => set('txGainDbi', v)} />
              <Field id="txDist" label="Відстань до БПЛА, м"
                value={inp.txDistanceM} step={100} onChange={(v) => set('txDistanceM', v)} />
              <Field id="txBw" label="Смуга приймача, МГц" hint="ELRS: 0.5 · аналог FPV: 18"
                value={inp.txBandwidthMhz} step={0.1} onChange={(v) => set('txBandwidthMhz', v)} />
            </div>
            <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-ecalc-navy">Processing Gain (кодування)</div>
              <Field id="pg" label="PG, dB" hint="LoRa SF6: 12 · LoRa SF9: 21 · Аналог: 0"
                value={inp.processingGainDb} step={1} onChange={(v) => set('processingGainDb', v)} />
            </div>
          </CardContent>
        </Card>

        {/* Jammer side */}
        <Card>
          <CardHeader>
            <CardTitle>Ворожий РЕБ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="jPower" label="Потужність РЕБ, dBm" hint="40=10W · 47=50W · 50=100W"
                value={inp.jammerPowerDbm} step={1} onChange={(v) => set('jammerPowerDbm', v)} />
              <Field id="jGain" label="Підсилення антени, dBi"
                value={inp.jammerGainDbi} step={0.5} onChange={(v) => set('jammerGainDbi', v)} />
              <Field id="jDist" label="Відстань до БПЛА, м"
                value={inp.jammerDistanceM} step={100} onChange={(v) => set('jammerDistanceM', v)} />
              <Field id="jBw" label="Смуга завади, МГц" hint="Загороджувальна: 50–200 · Прицільна: = смузі прийому"
                value={inp.jammerBandwidthMhz} step={10} onChange={(v) => set('jammerBandwidthMhz', v)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className={statusColor}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className={`text-lg font-bold ${labelColor}`}>
              {jammed ? '● Зв\u2019язок придушено' : '● Зв\u2019язок стабільний'}
            </span>
            <span className="rounded-full border border-current/30 bg-current/10 px-2.5 py-0.5 text-xs font-semibold font-mono">
              J/S = {result.jsRatioDb} dB
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="metric-tile">
              <div className="text-xs uppercase tracking-wide text-ecalc-muted">Сигнал на БПЛА</div>
              <div className="mt-2 font-mono text-sm font-semibold text-ecalc-navy">{result.signalRssiDbm} dBm</div>
            </div>
            <div className="metric-tile">
              <div className="text-xs uppercase tracking-wide text-ecalc-muted">Завада (raw)</div>
              <div className="mt-2 font-mono text-sm font-semibold text-ecalc-navy">{result.jammerRssiDbm} dBm</div>
            </div>
            <div className="metric-tile">
              <div className="text-xs uppercase tracking-wide text-ecalc-muted">BW-штраф РЕБ</div>
              <div className="mt-2 font-mono text-sm font-semibold text-green-600">−{result.bandwidthPenaltyDb} dB</div>
            </div>
            <div className="metric-tile">
              <div className="text-xs uppercase tracking-wide text-ecalc-muted">Запас / дефіцит</div>
              <div className={`mt-2 font-mono text-sm font-semibold ${result.marginDb >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {result.marginDb > 0 ? '+' : ''}{result.marginDb} dB
              </div>
            </div>
          </div>

          <div className="metric-tile">
            <div className="text-xs uppercase tracking-wide text-ecalc-muted">Макс. дальність дії РЕБ</div>
            <div className="mt-2 text-sm text-ecalc-text">
              {Number.isFinite(rangeM)
                ? <><span className="font-semibold text-ecalc-navy">{rangeM < 10_000 ? Math.round(rangeM) + ' м' : (rangeM / 1000).toFixed(1) + ' км'}</span> — за цієї відстані РЕБ ще придушує зв&apos;язок</>
                : <span className="text-green-600">РЕБ не може придушити лінк за жодної відстані</span>
              }
            </div>
          </div>

          {result.bandwidthPenaltyDb > 10 && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2 text-[12px] text-ecalc-text leading-relaxed">
              <span className="font-semibold text-green-600">Bandwidth defense:</span> РЕБ втрачає {result.bandwidthPenaltyDb} dB через широку смугу ({inp.jammerBandwidthMhz} МГц проти {inp.txBandwidthMhz} МГц приймача). Вузькосмугові протоколи (ELRS, Crossfire) стійкіші до загороджувального РЕБ.
            </div>
          )}

          <p className="text-[11px] text-ecalc-muted">
            Модель вільного простору. Не враховує рельєф, багатопроменеве поширення та поляризаційні втрати.
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
