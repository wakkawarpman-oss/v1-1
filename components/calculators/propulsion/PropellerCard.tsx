import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { PropSpec } from '@/lib/prop-db'
import type { PropDraft } from '@/lib/propulsion-contracts'

type PropellerCardProps = {
  readonly draft: PropDraft
  readonly propBrand: string
  readonly propList: ReadonlyArray<PropSpec>
  readonly brands: ReadonlyArray<string>
  readonly onDraftChange: <K extends keyof PropDraft>(key: K, value: number) => void
  readonly onBrandChange: (value: string) => void
  readonly onApplyProp: (id: string) => void
}

export function PropellerCard(props: PropellerCardProps) {
  const {
    draft,
    propBrand,
    propList,
    brands,
    onDraftChange,
    onBrandChange,
    onApplyProp,
  } = props

  return (
    <div className="rounded-lg border border-ecalc-border bg-ecalc-lightbg p-4 space-y-3">
      <h4 className="text-sm font-semibold text-ecalc-navy">Propeller Selector</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prop-brand">Бренд</Label>
          <Select id="prop-brand" title="Бренд" value={propBrand} onChange={(e) => onBrandChange(e.target.value)}>
            <option value="">Бренд…</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-model">Модель</Label>
          <Select id="prop-model" title="Модель" value="" onChange={(e) => onApplyProp(e.target.value)} disabled={!propBrand}>
            <option value="">Модель…</option>
            {propList.map((prop) => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="prop-diameter">Діаметр, inch</Label>
          <Input id="prop-diameter" type="number" step="0.1" value={draft.diameterIn} onChange={(e) => onDraftChange('diameterIn', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-pitch">Крок, inch</Label>
          <Input id="prop-pitch" type="number" step="0.1" value={draft.pitchIn} onChange={(e) => onDraftChange('pitchIn', Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-blades">Лопаті</Label>
          <Select id="prop-blades" title="Лопаті" value={String(draft.bladeCount)} onChange={(e) => onDraftChange('bladeCount', Number(e.target.value))}>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
