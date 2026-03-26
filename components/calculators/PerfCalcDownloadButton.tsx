'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PerfCalcPDFDocument } from '@/components/calculators/PerfCalcReport'
import type { PerfCalcInput } from '@/lib/aero'

type Props = {
  input: PerfCalcInput
  summary: ReturnType<typeof import('@/lib/aero').perfSummary>
}

export function PerfCalcDownloadButton({ input, summary }: Props) {
  const fileName = `dronecalc-perfcalc-${new Date().toISOString().slice(0, 10)}.pdf`

  return (
    <PDFDownloadLink
      document={<PerfCalcPDFDocument input={input} summary={summary} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          className="border-ecalc-orange/40 bg-ecalc-orange/10 text-ecalc-orange hover:bg-ecalc-orange/20 hover:text-ecalc-orange"
          disabled={loading}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? 'Генерація…' : 'PDF звіт'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
