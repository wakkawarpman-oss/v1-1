'use client'

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import { round, type PerfCalcInput, type PerfCurvePoint } from '@/lib/aero'

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 400 },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 700 },
  ],
})

// ── Styles ────────────────────────────────────────────────────────────────────

const C = {
  navy:   '#0f1b2d',
  dark:   '#1a2035',
  orange: '#f97316',
  muted:  '#64748b',
  border: '#e2e8f0',
  light:  '#f8fafc',
  green:  '#16a34a',
  blue:   '#2563eb',
  purple: '#7c3aed',
  teal:   '#0d9488',
  white:  '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 8,
    color: C.navy,
    backgroundColor: C.white,
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
  },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.orange },
  headerLeft: { flex: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.orange },
  brandName: { fontSize: 14, fontFamily: 'NotoSans', fontWeight: 700, color: C.navy },
  reportTitle: { fontSize: 10, color: C.muted, marginTop: 2 },
  headerRight: { alignItems: 'flex-end' },
  dateText: { fontSize: 7, color: C.muted },
  versionText: { fontSize: 7, color: C.muted, marginTop: 2 },

  // Model badges
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 14 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, flexDirection: 'row', gap: 3 },
  badgeText: { fontSize: 6.5, fontFamily: 'NotoSans', fontWeight: 700, letterSpacing: 0.3 },

  // Section title
  sectionTitle: { fontSize: 7.5, fontFamily: 'NotoSans', fontWeight: 700, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6, marginTop: 14 },

  // Two-column layout
  row2: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  // Table
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border },
  tableRowLast: { flexDirection: 'row' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.light },
  tableHead: { flexDirection: 'row', backgroundColor: C.navy },
  thCell: { flex: 1, paddingHorizontal: 6, paddingVertical: 4 },
  thText: { fontSize: 6.5, fontFamily: 'NotoSans', fontWeight: 700, color: C.white, letterSpacing: 0.5 },
  tdLabel: { flex: 2, paddingHorizontal: 6, paddingVertical: 4 },
  tdValue: { flex: 1.2, paddingHorizontal: 6, paddingVertical: 4 },
  tdLabelText: { fontSize: 7.5, color: C.muted },
  tdValueText: { fontSize: 7.5, fontFamily: 'NotoSans', fontWeight: 700, color: C.navy },

  // Key metrics grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metricTile: { width: '31.5%', borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 6, backgroundColor: C.light },
  metricLabel: { fontSize: 6, color: C.muted, letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 3 },
  metricValue: { fontSize: 11, fontFamily: 'NotoSans', fontWeight: 700, color: C.navy },
  metricUnit: { fontSize: 6.5, color: C.muted, marginTop: 1 },

  // Curve table
  curveTable: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  curveHead: { flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 3 },
  curveHeadCell: { flex: 1, paddingHorizontal: 4 },
  curveHeadText: { fontSize: 6, fontFamily: 'NotoSans', fontWeight: 700, color: C.white, letterSpacing: 0.3, textAlign: 'center' },
  curveRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 2.5 },
  curveRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 2.5, backgroundColor: C.light },
  curveCell: { flex: 1, paddingHorizontal: 4 },
  curveCellText: { fontSize: 6.5, color: C.navy, textAlign: 'center' },

  // Warning box
  warnBox: { borderWidth: 1, borderColor: '#fbbf24', borderRadius: 4, padding: 7, backgroundColor: '#fffbeb', marginTop: 8 },
  warnTitle: { fontSize: 7, fontFamily: 'NotoSans', fontWeight: 700, color: '#92400e', marginBottom: 3 },
  warnText: { fontSize: 7, color: '#92400e', lineHeight: 1.4 },

  // Footer
  footer: { position: 'absolute', bottom: 16, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: C.border, paddingTop: 5 },
  footerText: { fontSize: 6.5, color: C.muted },
})

// ── Types ─────────────────────────────────────────────────────────────────────

type Summary = ReturnType<typeof import('@/lib/aero').perfSummary>

type ReportProps = {
  input: PerfCalcInput
  summary: Summary
  generatedAt?: Date
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date) {
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
}

function InputRow({ label, value, alt }: { label: string; value: string; alt?: boolean }) {
  const RowComp = alt ? styles.tableRowAlt : styles.tableRow
  return (
    <View style={RowComp}>
      <View style={styles.tdLabel}><Text style={styles.tdLabelText}>{label}</Text></View>
      <View style={styles.tdValue}><Text style={styles.tdValueText}>{value}</Text></View>
    </View>
  )
}

// ── Document ──────────────────────────────────────────────────────────────────

export function PerfCalcPDFDocument({ input, summary, generatedAt }: ReportProps) {
  const date = generatedAt ?? new Date()
  const battV = input.batteryCells * input.batteryVoltagePerCell

  const useAltmann = !!(input.motorKv && input.motorRi && input.motorI0)
  const usePeukert = (input.batteryRiMohm ?? 0) > 0 && (input.peukertK ?? 0) > 0
  const usePropDb  = (input.ctStaticOverride ?? 0) > 0

  const warnings: string[] = []
  if (summary.pitchSpeed < summary.stallSpeedKmh * 1.9)
    warnings.push('Крокова швидкість пропелера замала (запас < 1.9× над зривом).')
  if (summary.thrustToWeight < 0.5)
    warnings.push('Низьке T/W: слабкий набір висоти.')
  if (summary.thrustToWeight > 1.15)
    warnings.push('T/W > 1.15: можливий 3D-режим.')

  // Sparse curve — every 4th point (~12 rows)
  const curvePoints: PerfCurvePoint[] = summary.points.filter((_, i) => i % 4 === 0).slice(0, 14)

  return (
    <Document title="droneCalc — perfCalc Engineering Report" author="dronecalc.pp.ua">
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.brandRow}>
              <View style={styles.brandDot} />
              <Text style={styles.brandName}>droneCalc</Text>
            </View>
            <Text style={styles.reportTitle}>perfCalc — Engineering Report</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>{fmt(date)}</Text>
            <Text style={styles.versionText}>dronecalc.pp.ua</Text>
          </View>
        </View>

        {/* ── Active models ── */}
        <View style={styles.badgesRow}>
          <View style={[styles.badge, { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' }]}>
            <Text style={[styles.badgeText, { color: C.orange }]}>ALTMANN MOTOR{useAltmann ? ' ● ACTIVE' : ' ○ STANDARD'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }]}>
            <Text style={[styles.badgeText, { color: C.blue }]}>PEUKERT + VSAG{usePeukert ? ' ● ACTIVE' : ' ○ STANDARD'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#ddd6fe' }]}>
            <Text style={[styles.badgeText, { color: C.purple }]}>REYNOLDS POLARS ● ALWAYS ON</Text>
          </View>
          {usePropDb && (
            <View style={[styles.badge, { backgroundColor: '#f0fdfa', borderWidth: 1, borderColor: '#99f6e4' }]}>
              <Text style={[styles.badgeText, { color: C.teal }]}>UIUC PROP DB ● Ct={input.ctStaticOverride?.toFixed(4)} Cp={input.cpStaticOverride?.toFixed(4)}</Text>
            </View>
          )}
        </View>

        {/* ── Key metrics ── */}
        <Text style={styles.sectionTitle}>Ключові результати</Text>
        <View style={styles.metricsGrid}>
          {[
            ['Vstall', `${round(summary.stallSpeedKmh, 1)}`, 'км/год'],
            ['Vmax', `${round(summary.levelMaxSpeedKmh, 1)}`, 'км/год'],
            ['Carson', `${round(summary.bestRangeKmh, 1)}`, 'км/год'],
            ['ROC max', `${round(summary.maxRocMs, 2)}`, 'м/с'],
            ['T/W', `${round(summary.thrustToWeight, 2)}`, ': 1'],
            ['Pmin', `${round(summary.minPowerW, 1)}`, 'W'],
            ['Час польоту', `${round(summary.estimatedFlightTimeMin, 1)}`, 'хв'],
            ['ROC швидкість', `${round(summary.maxRocSpeedKmh, 0)}`, 'км/год'],
            ['Кут набору', `${round(summary.maxAngleDeg, 1)}`, '°'],
          ].map(([label, value, unit]) => (
            <View key={label} style={styles.metricTile}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricUnit}>{unit}</Text>
            </View>
          ))}
        </View>

        {/* ── Warnings ── */}
        {warnings.length > 0 && (
          <View style={styles.warnBox}>
            <Text style={styles.warnTitle}>⚠ Перевірка конфігурації</Text>
            {warnings.map((w) => <Text key={w} style={styles.warnText}>• {w}</Text>)}
          </View>
        )}

        {/* ── Input parameters ── */}
        <Text style={styles.sectionTitle}>Вхідні параметри</Text>
        <View style={styles.row2}>
          <View style={styles.col}>
            <View style={styles.table}>
              {[
                ['Висота, м', String(input.elevationM)],
                ['Температура, °C', String(input.temperatureC)],
                ['Маса, кг', String(input.weightKg)],
                ['Площа крила, дм²', String(input.wingAreaDm2)],
                ['Розмах, мм', String(input.wingSpanMm)],
                ['CD0', String(input.cd0)],
                ['Oswald e', String(input.oswald)],
                ['CLmax', String(input.clMax)],
                ['Хорда (авто), м', round(summary.chordM, 3).toFixed(3)],
                ['Re (крейсер)', Math.round(summary.reAtCruise).toLocaleString()],
                ['Густина ρ, кг/м³', round(summary.density, 4).toFixed(4)],
              ].map(([l, v], i) => <InputRow key={l} label={l} value={v} alt={i % 2 === 1} />)}
            </View>
          </View>
          <View style={styles.col}>
            <View style={styles.table}>
              {[
                ['Моторів', String(input.motorCount)],
                ['Пропелер, inch', `${input.propDiameterIn}×${input.propPitchIn}`],
                ['Лопатей', String(input.bladeCount)],
                ['RPM (вхід)', input.rpm.toLocaleString()],
                ['Потужність, W', String(input.drivePowerW)],
                ['АКБ, S', String(input.batteryCells)],
                ['V/cell, В', String(input.batteryVoltagePerCell)],
                ['Ємність, mAh', String(input.batteryCapacityMah)],
                ['Струм, А', String(input.averageCurrentA)],
                ['Напруга (номінал), В', battV.toFixed(2)],
                ['Напруга (ефективна), В', round(summary.batteryVoltage, 2).toFixed(2)],
              ].map(([l, v], i) => <InputRow key={l} label={l} value={v} alt={i % 2 === 1} />)}
            </View>
          </View>
        </View>

        {/* ── Altmann / Peukert params ── */}
        {(useAltmann || usePeukert) && (
          <>
            <Text style={styles.sectionTitle}>Параметри фізичних моделей</Text>
            <View style={styles.table}>
              {useAltmann && [
                ['Kv мотора, об/хв/В', String(input.motorKv)],
                ['Rᵢ мотора, Ом', String(input.motorRi)],
                ['I₀, А', String(input.motorI0)],
              ].map(([l, v], i) => <InputRow key={l} label={l} value={v} alt={i % 2 === 1} />)}
              {usePeukert && [
                ['Rᵢ акб, мОм', String(input.batteryRiMohm)],
                ['k Пейкерта', String(input.peukertK)],
                ['Ємність ефективна, mAh', round(summary.effectiveCapacityMah, 0).toFixed(0)],
              ].map(([l, v], i) => <InputRow key={l} label={l} value={v} alt={(i + (useAltmann ? 3 : 0)) % 2 === 1} />)}
            </View>
          </>
        )}

        {/* ── Performance curve ── */}
        <Text style={styles.sectionTitle}>Крива продуктивності</Text>
        <View style={styles.curveTable}>
          <View style={styles.curveHead}>
            {['V, км/год', 'Ppar, W', 'Pind, W', 'Preq, W', 'Pavail, W', 'Тяга, г', 'ROC, м/с', 'η, Wh/км'].map((h) => (
              <View key={h} style={styles.curveHeadCell}>
                <Text style={styles.curveHeadText}>{h}</Text>
              </View>
            ))}
          </View>
          {curvePoints.map((pt, i) => (
            <View key={pt.speedKmh} style={i % 2 === 0 ? styles.curveRow : styles.curveRowAlt}>
              {[
                round(pt.speedKmh, 0),
                round(pt.parasitePower, 1),
                round(pt.inducedPower, 1),
                round(pt.reqPower, 1),
                round(pt.availablePower, 1),
                round(pt.thrustDynamicG, 0),
                round(pt.roc, 2),
                round(pt.efficiencyWhKm, 2),
              ].map((val, j) => (
                <View key={j} style={styles.curveCell}>
                  <Text style={styles.curveCellText}>{String(val)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>droneCalc perfCalc Report · dronecalc.pp.ua</Text>
          <Text style={styles.footerText}>Інженерне наближення. Валідуйте на реальних вимірах.</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
