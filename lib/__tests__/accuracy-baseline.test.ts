import { describe, expect, test } from 'vitest'
import {
  ACCURACY_BASELINE,
  GROUP_BOUNDS_PERCENT,
  isMetricWithinGroupBand,
} from '@/lib/accuracy-baseline'

describe('accuracy baseline contract', () => {
  test('has all four groups represented', () => {
    const groups = new Set(ACCURACY_BASELINE.map((item) => item.group))
    expect(groups.has('A')).toBe(true)
    expect(groups.has('B')).toBe(true)
    expect(groups.has('C')).toBe(true)
    expect(groups.has('D')).toBe(true)
  })

  test('all metrics include required metadata', () => {
    for (const metric of ACCURACY_BASELINE) {
      expect(metric.metric.length).toBeGreaterThan(0)
      expect(metric.accuracy.length).toBeGreaterThan(0)
      expect(metric.basis.length).toBeGreaterThan(0)
      expect(metric.upperBound).toBeGreaterThanOrEqual(metric.lowerBound)
    }
  })

  test('percent metrics stay inside their declared group bounds', () => {
    for (const metric of ACCURACY_BASELINE) {
      if (metric.unit !== 'percent') continue
      const bounds = GROUP_BOUNDS_PERCENT[metric.group]
      expect(metric.lowerBound).toBeGreaterThanOrEqual(bounds.min)
      expect(metric.upperBound).toBeLessThanOrEqual(bounds.max)
      expect(isMetricWithinGroupBand(metric)).toBe(true)
    }
  })
})
