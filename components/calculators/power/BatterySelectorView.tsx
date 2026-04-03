import { Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Field, ToolCard } from '@/components/calculators/CalculatorToolPrimitives'
import { type CellSpec, type CellFormFactor, type LiPoPackSpec } from '@/lib/battery-db'

export type BatterySelectorViewProps = {
  readonly batteryType: 'liion-cell' | 'lipo-pack'
  readonly formFactor: CellFormFactor | 'all'
  readonly cellId: string
  readonly lipoId: string
  readonly s: number
  readonly p: number
  readonly loadCurrentA: number
  readonly customCapacityMah: number
  readonly customNominalV: number
  readonly customMaxA: number
  readonly customRiMOhms: number
  readonly customWeightG: number
  readonly maxPackCurrentA: number
  readonly selectedCellNotes?: string
  readonly selectedLipoNotes?: string
  readonly visibleCells: ReadonlyArray<CellSpec>
  readonly lipoPacks: ReadonlyArray<LiPoPackSpec>
  readonly onBatteryTypeChange: (next: 'liion-cell' | 'lipo-pack') => void
  readonly onFormFactorChange: (next: CellFormFactor | 'all') => void
  readonly onCellIdChange: (id: string) => void
  readonly onLipoIdChange: (id: string) => void
  readonly onNumberChange: (key: string, next: number) => void
  readonly onCalculate: () => void
}

const FF_TABS: ReadonlyArray<{ value: CellFormFactor | 'all'; label: string }> = [
  { value: 'all', label: 'Всі' },
  { value: '18650', label: '18650' },
  { value: '21700', label: '21700' },
]

export function BatterySelectorView(props: BatterySelectorViewProps) {
  const {
    batteryType,
    formFactor,
    cellId,
    lipoId,
    s,
    p,
    loadCurrentA,
    customCapacityMah,
    customNominalV,
    customMaxA,
    customRiMOhms,
    customWeightG,
    maxPackCurrentA,
    selectedCellNotes,
    selectedLipoNotes,
    visibleCells,
    lipoPacks,
    onBatteryTypeChange,
    onFormFactorChange,
    onCellIdChange,
    onLipoIdChange,
    onNumberChange,
    onCalculate,
  } = props

  return (
    <ToolCard
      icon={<Battery className="h-4 w-4" />}
      title="Конструктор акумуляторної збірки"
      description="Контрактний ввід параметрів батареї для стабільних енергорозрахунків."
    >
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onBatteryTypeChange('liion-cell')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            batteryType === 'liion-cell'
              ? 'bg-ecalc-orange text-white'
              : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
          }`}
        >
          Li-Ion комірки
        </button>
        <button
          type="button"
          onClick={() => onBatteryTypeChange('lipo-pack')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            batteryType === 'lipo-pack'
              ? 'bg-ecalc-orange text-white'
              : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
          }`}
        >
          LiPo пак
        </button>
      </div>

      {batteryType === 'liion-cell' && (
        <>
          <div className="flex gap-1.5">
            {FF_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => onFormFactorChange(tab.value)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  formFactor === tab.value
                    ? 'bg-ecalc-orange text-white'
                    : 'bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Field label="Комірка">
            <Select title="Комірка" aria-label="Комірка" value={cellId} onChange={(e) => onCellIdChange(e.target.value)}>
              {visibleCells.map((cell) => (
                <option key={cell.id} value={cell.id}>{cell.label}</option>
              ))}
            </Select>
            {selectedCellNotes && (
              <div className="mt-1 text-[10px] leading-relaxed text-ecalc-muted">{selectedCellNotes}</div>
            )}
          </Field>
        </>
      )}

      {batteryType === 'lipo-pack' && (
        <Field label="LiPo пресет">
          <Select title="LiPo пресет" aria-label="LiPo пресет" value={lipoId} onChange={(e) => onLipoIdChange(e.target.value)}>
            {lipoPacks.map((pack) => (
              <option key={pack.id} value={pack.id}>{pack.label}</option>
            ))}
          </Select>
          {selectedLipoNotes && (
            <div className="mt-1 text-[10px] leading-relaxed text-ecalc-muted">{selectedLipoNotes}</div>
          )}
        </Field>
      )}

      {batteryType === 'liion-cell' && cellId === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ємність, мАч">
            <Input type="number" value={customCapacityMah} onChange={(e) => onNumberChange('customCapacityMah', Number(e.target.value))} />
          </Field>
          <Field label="Номінал, В">
            <Input type="number" step="0.1" value={customNominalV} onChange={(e) => onNumberChange('customNominalV', Number(e.target.value))} />
          </Field>
          <Field label="Макс. струм, А">
            <Input type="number" value={customMaxA} onChange={(e) => onNumberChange('customMaxA', Number(e.target.value))} />
          </Field>
          <Field label="Ri, мОм">
            <Input type="number" step="0.5" value={customRiMOhms} onChange={(e) => onNumberChange('customRiMOhms', Number(e.target.value))} />
          </Field>
          <Field label="Вага, г">
            <Input type="number" value={customWeightG} onChange={(e) => onNumberChange('customWeightG', Number(e.target.value))} />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Секції (S)" hint="Послідовно">
          <Input type="number" min={1} max={14} value={s} onChange={(e) => onNumberChange('s', Number(e.target.value))} />
        </Field>
        <Field label="Паралелі (P)" hint="Паралельно">
          <Input type="number" min={1} max={12} value={p} onChange={(e) => onNumberChange('p', Number(e.target.value))} />
        </Field>
      </div>

      <Field label="Навантаження, А" hint={maxPackCurrentA > 0 ? `Макс. допустимий: ${maxPackCurrentA} А` : undefined}>
        <Input type="number" step="0.5" min="0" value={loadCurrentA} onChange={(e) => onNumberChange('loadCurrentA', Number(e.target.value))} />
      </Field>

      <Button onClick={onCalculate}>Розрахувати</Button>
    </ToolCard>
  )
}
