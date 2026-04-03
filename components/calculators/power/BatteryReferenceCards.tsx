'use client'

import { useState } from 'react'
import { Battery, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatToolNumber } from '@/components/calculators/CalculatorToolPrimitives'
import { CELL_DB, LIPO_DB, type CellFormFactor, type LiPoPackSpec } from '@/lib/battery-db'

export function CellReferenceCard() {
  const [ff, setFf] = useState<CellFormFactor | 'all'>('all')
  const cells = CELL_DB.filter((c) => c.id !== 'custom' && (ff === 'all' || c.formFactor === ff))

  return (
    <Card className="calc-surface overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-[15px]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange ring-1 ring-ecalc-orange/15">
            <Zap className="h-4 w-4" />
          </span>
          <span className="leading-snug font-semibold text-ecalc-navy">Довідник Li-Ion комірок</span>
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">
          Параметри з даташитів виробників при кімнатній температурі. K - показник Пекерта.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-1.5">
          {(['all', '18650', '21700'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFf(v)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                ff === v ? 'bg-ecalc-orange text-white' : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
              }`}
            >
              {v === 'all' ? 'Всі' : v}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ecalc-border">
                <th className="pb-2 pr-3 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Модель</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">мАч</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Макс. А</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Ri мОм</th>
                <th className="pb-2 pr-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">K</th>
                <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Вага</th>
              </tr>
            </thead>
            <tbody>
              {cells.map((cell) => (
                <tr key={cell.id} className="border-b border-ecalc-border/50 last:border-0">
                  <td className="py-2 pr-3 font-medium text-ecalc-navy">{cell.label}</td>
                  <td className="tabular-nums py-2 pr-3 text-right">{cell.capacityMah}</td>
                  <td className="tabular-nums py-2 pr-3 text-right">{cell.maxContinuousA}</td>
                  <td className="tabular-nums py-2 pr-3 text-right">{cell.riMOhms}</td>
                  <td className="tabular-nums py-2 pr-3 text-right text-ecalc-muted">{cell.peukertK}</td>
                  <td className="tabular-nums py-2 text-right">{cell.weightG} г</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function LiPoReferenceCard({ onPackSelected }: { onPackSelected: (capacityAh: number, voltageV: number) => void }) {
  const [selected, setSelected] = useState<LiPoPackSpec | null>(null)
  const nomV = selected ? selected.sCells * 3.7 : 0
  const maxA = selected ? (selected.capacityMah / 1000) * selected.continuousC : 0

  return (
    <Card className="calc-surface overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-[15px]">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-ecalc-orange/10 text-ecalc-orange ring-1 ring-ecalc-orange/15">
            <Battery className="h-4 w-4" />
          </span>
          <span className="leading-snug font-semibold text-ecalc-navy">Готові LiPo паки</span>
        </CardTitle>
        <CardDescription className="text-[11px] leading-relaxed">
          Виберіть готовий LiPo пак - параметри передаються у калькулятор часу висіння.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-ecalc-border">
                <th className="pb-2 pr-2 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Пак</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">S</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">мАч</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">C cont.</th>
                <th className="pb-2 pr-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">Ri мОм</th>
                <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-ecalc-muted">г</th>
              </tr>
            </thead>
            <tbody>
              {LIPO_DB.map((pack) => (
                <tr
                  key={pack.id}
                  onClick={() => setSelected(pack)}
                  className={`cursor-pointer border-b border-ecalc-border/50 transition-colors last:border-0 ${
                    selected?.id === pack.id ? 'bg-ecalc-orange/10' : 'hover:bg-ecalc-orange/5'
                  }`}
                >
                  <td className="py-1.5 pr-2 font-medium leading-tight text-ecalc-navy">{pack.label}</td>
                  <td className="tabular-nums py-1.5 pr-2 text-right">{pack.sCells}</td>
                  <td className="tabular-nums py-1.5 pr-2 text-right">{pack.capacityMah}</td>
                  <td className="tabular-nums py-1.5 pr-2 text-right">{pack.continuousC}C</td>
                  <td className="tabular-nums py-1.5 pr-2 text-right">{pack.riMOhmsTotal}</td>
                  <td className="tabular-nums py-1.5 text-right">{pack.weightG}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="space-y-1 rounded-xl border border-ecalc-orange/20 bg-ecalc-orange/8 px-3.5 py-2.5 text-xs">
            <div className="font-semibold text-ecalc-orange">{selected.label}</div>
            <div className="text-ecalc-muted">{selected.notes}</div>
            <div className="mt-1 flex gap-4 text-ecalc-text">
              <span>Напруга: <span className="font-semibold">{formatToolNumber(nomV, 1)} В</span></span>
              <span>Макс. струм: <span className="font-semibold">{formatToolNumber(maxA, 0)} А</span></span>
              <span>K: <span className="font-semibold">{selected.peukertK}</span></span>
            </div>
            <button
              type="button"
              onClick={() => onPackSelected(selected.capacityMah / 1000, nomV)}
              className="mt-1.5 w-full rounded-lg bg-ecalc-orange/20 px-3 py-1.5 text-xs font-semibold text-ecalc-orange transition-colors hover:bg-ecalc-orange/30"
            >
              Передати у калькулятор висіння -&gt;
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
