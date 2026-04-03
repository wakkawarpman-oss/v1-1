import { describe, expect, test } from 'vitest'
import { dashboardTabs } from '@/components/calculators/dashboard/dashboard.registry'
import { SUITE_COMPONENT_KEYS } from '@/components/calculators/dashboard/suite-map'

describe('dashboard registry contract', () => {
  test('all tabs have required metadata', () => {
    for (const tab of dashboardTabs) {
      expect(tab.value.length).toBeGreaterThan(0)
      expect(tab.label.length).toBeGreaterThan(0)
      expect(tab.shortLabel.length).toBeGreaterThan(0)
      expect(tab.icon).toBeTruthy()
    }
  })

  test('each non-dashboard tab has a mapped suite component key', () => {
    const tabValues = new Set(
      dashboardTabs
        .map((tab) => tab.value)
        .filter((value) => value !== 'dashboard'),
    )
    const suiteKeys = new Set(SUITE_COMPONENT_KEYS)

    for (const value of tabValues) {
      expect(suiteKeys.has(value)).toBe(true)
    }
  })

  test('suite map has no orphan keys absent from registry', () => {
    const tabValues = new Set(
      dashboardTabs
        .map((tab) => tab.value)
        .filter((value) => value !== 'dashboard'),
    )

    for (const key of SUITE_COMPONENT_KEYS) {
      expect(tabValues.has(key)).toBe(true)
    }
  })
})
