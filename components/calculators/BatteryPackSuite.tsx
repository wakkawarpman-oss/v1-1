'use client'

import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BatteryBuilderContainer } from '@/components/calculators/power/BatteryBuilderContainer'
import { HoverEstimatorCard } from '@/components/calculators/power/HoverEstimatorCard'
import { CellReferenceCard, LiPoReferenceCard } from '@/components/calculators/power/BatteryReferenceCards'
import { AwgSelectorCard, ParallelChargeCard, StorageVoltageCard } from '@/components/calculators/power/PowerUtilityCards'

export function BatteryPackSuite() {
  const [packSuggestion, setPackSuggestion] = useState<{ capacityAh: number; voltageV: number } | null>(null)

  return (
    <section className="space-y-6">
      <Card className="calc-surface overflow-hidden">
        <CardHeader>
          <CardTitle>Акумуляторні збірки (S×P)</CardTitle>
          <CardDescription>
            Енергоблок Sprint-3: контрактна валідація PowerInput, атомарний reset за хімією та passive-view декомпозиція Battery UI.
            Допустимі відхилення: ±5% на Ri, ±3% на ємність (виробничий розкид).
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <BatteryBuilderContainer onPackBuilt={(capacityAh, voltageV) => setPackSuggestion({ capacityAh, voltageV })} />
        <HoverEstimatorCard packSuggestion={packSuggestion} />
        <StorageVoltageCard />
        <AwgSelectorCard />
        <ParallelChargeCard />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <CellReferenceCard />
        <LiPoReferenceCard onPackSelected={(capacityAh, voltageV) => setPackSuggestion({ capacityAh, voltageV })} />
      </div>
    </section>
  )
}
