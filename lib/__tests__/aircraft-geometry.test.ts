import { describe, it, expect } from 'vitest'
import {
  aspectRatio,
  taperRatio,
  sweepAngle,
  meanAerodynamicChord,
  macSpanPosition,
  horizontalTailVolume,
  verticalTailVolume,
  fuselageDiameter,
  relativeThickness,
  washout,
} from '../aircraft-geometry'

describe('aspectRatio', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(aspectRatio(0, 1)).toBe(0)
    expect(aspectRatio(5, 0)).toBe(0)
  })

  it('AR = span² / area', () => {
    // span 10 m, area 5 m² → AR = 100/5 = 20
    expect(aspectRatio(10, 5)).toBeCloseTo(20, 6)
  })
})

describe('taperRatio', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(taperRatio(0, 1)).toBe(0)
    expect(taperRatio(1, 0)).toBe(0)
  })

  it('λ = tip / root', () => {
    expect(taperRatio(0.5, 1)).toBeCloseTo(0.5, 6)
  })

  it('elliptical approximation → ratio ≈ 0.4', () => {
    expect(taperRatio(0.4, 1.0)).toBeCloseTo(0.4, 6)
  })
})

describe('sweepAngle', () => {
  it('returns 0 for non-positive semiSpan', () => {
    expect(sweepAngle(1, 0)).toBe(0)
  })

  it('zero delta → 0° sweep', () => {
    expect(sweepAngle(0, 5)).toBeCloseTo(0, 6)
  })

  it('equal delta and semiSpan → 45° sweep', () => {
    expect(sweepAngle(5, 5)).toBeCloseTo(45, 3)
  })
})

describe('meanAerodynamicChord', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(meanAerodynamicChord(0, 0.5)).toBe(0)
    expect(meanAerodynamicChord(1, 0)).toBe(0)
  })

  it('rectangular wing (λ=1) → MAC = root chord', () => {
    expect(meanAerodynamicChord(1.5, 1.5)).toBeCloseTo(1.5, 3)
  })
})

describe('macSpanPosition', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(macSpanPosition(0, 0.5, 1)).toBe(0)
    expect(macSpanPosition(10, 0, 1)).toBe(0)
    expect(macSpanPosition(10, 0.5, 0)).toBe(0)
  })

  it('returns positive position for valid inputs', () => {
    expect(macSpanPosition(10, 0.5, 1)).toBeGreaterThan(0)
  })
})

describe('horizontalTailVolume', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(horizontalTailVolume(0, 0.5, 1, 0.3)).toBe(0)
    expect(horizontalTailVolume(0.3, 0.5, 0, 0.3)).toBe(0)
  })

  it('Vt = St × Lt / (Sw × MAC)', () => {
    expect(horizontalTailVolume(0.3, 0.5, 1, 0.3)).toBeCloseTo((0.3 * 0.5) / (1 * 0.3), 4)
  })
})

describe('verticalTailVolume', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(verticalTailVolume(0, 0.5, 1, 5)).toBe(0)
  })

  it('Vv = Sf × Lf / (Sw × b)', () => {
    expect(verticalTailVolume(0.2, 0.5, 1, 5)).toBeCloseTo((0.2 * 0.5) / (1 * 5), 4)
  })
})

describe('fuselageDiameter', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(fuselageDiameter(0, 1)).toBe(0)
    expect(fuselageDiameter(1, 0)).toBe(0)
  })

  it('d = √(4V / πL)', () => {
    const vol = 0.5, len = 2
    const expected = Math.sqrt((4 * vol) / (Math.PI * len))
    expect(fuselageDiameter(vol, len)).toBeCloseTo(expected, 6)
  })
})

describe('relativeThickness', () => {
  it('returns 0 for non-positive inputs', () => {
    expect(relativeThickness(0, 0.3)).toBe(0)
    expect(relativeThickness(0.03, 0)).toBe(0)
  })

  it('t/c = thickness / chord', () => {
    expect(relativeThickness(0.03, 0.3)).toBeCloseTo(0.1, 6)
  })
})

describe('washout', () => {
  it('positive washout when root > tip incidence', () => {
    expect(washout(0, 3)).toBe(3)
  })

  it('zero washout for equal incidence', () => {
    expect(washout(2, 2)).toBe(0)
  })

  it('handles NaN input returning 0', () => {
    expect(washout(NaN, 2)).toBe(0)
  })
})
