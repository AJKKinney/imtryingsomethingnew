/**
 * A-007 · §14 — the baked sine table matches Math.sin within 1e-6.
 *
 * `Math.sin` is the reference HERE and is forbidden in the simulation, which is the
 * whole point: the table is measured against the platform once, at authoring time,
 * and never consulted at runtime, so the platform's rounding can never enter a run.
 */
import { describe, expect, it } from 'vitest'
import { PI, TAU, atan2, clamp, cos, distanceSquared, length, lerp, sin } from '../../src/core/fixedmath.ts'
import { SIN_TABLE, SIN_TABLE_SIZE } from '../../src/gen/sintable.ts'

describe('A-007 · §14 deterministic mathematics', () => {
  it('bakes 4096 entries, which is the size the error budget demands', () => {
    // Lerp error on a sine is (step^2 / 8) * |sin''|. At 4096 that is 2.94e-7 and
    // inside the 1e-6 band; at 2048 it is 1.18e-6 and outside it. The constant is
    // derived rather than chosen, and this is where that stops being a claim.
    expect(SIN_TABLE_SIZE).toBe(4096)
    expect(SIN_TABLE).toHaveLength(4096)
    const step = TAU / SIN_TABLE_SIZE
    expect((step * step) / 8).toBeLessThan(1e-6)
  })

  it('matches Math.sin within 1e-6 across four full turns', () => {
    let worst = 0
    for (let i = 0; i < 40_000; i++) {
      const x = -TAU * 2 + (i / 40_000) * TAU * 4
      worst = Math.max(worst, Math.abs(sin(x) - Math.sin(x)))
    }
    expect(worst).toBeLessThan(1e-6)
  })

  it('matches Math.cos within 1e-6', () => {
    let worst = 0
    for (let i = 0; i < 40_000; i++) {
      const x = -TAU + (i / 40_000) * TAU * 2
      worst = Math.max(worst, Math.abs(cos(x) - Math.cos(x)))
    }
    expect(worst).toBeLessThan(1e-6)
  })

  it('reduces an angle that has been accumulating all run', () => {
    // A twenty-minute run is 72,000 ticks, and an orbiting component's angle is
    // never re-based. Large arguments have to behave, or the last minute of a run
    // is a different game from the first.
    for (const turns of [100, 1_000, 10_000]) {
      const x = TAU * turns + 0.7
      expect(Math.abs(sin(x) - Math.sin(0.7))).toBeLessThan(1e-6)
    }
  })

  it('approximates atan2 within 5e-6 radians in every quadrant', () => {
    let worst = 0
    for (let i = 0; i < 20_000; i++) {
      const a = -PI + (i / 20_000) * TAU
      const y = Math.sin(a) * (1 + (i % 7))
      const x = Math.cos(a) * (1 + (i % 5))
      let d = Math.abs(atan2(y, x) - Math.atan2(y, x))
      if (d > PI) d = TAU - d // the seam at +/-PI is the same angle, not an error
      worst = Math.max(worst, d)
    }
    // Measured at 1.66e-6; banded at 5e-6 so a regression that doubles it still fails.
    // The band is not the measurement — a band set flush against what it measures
    // catches nothing (§92.2, pointed at a tolerance rather than at a baseline).
    expect(worst).toBeLessThan(5e-6)
  })

  it('gives (0, 0) a written-down answer rather than a platform one', () => {
    expect(atan2(0, 0)).toBe(0)
  })

  it('is a pure function: the same input is the same bits, always', () => {
    for (const x of [0, 0.1, 1, PI, -PI, 123.456, -987.654]) {
      expect(sin(x)).toBe(sin(x))
      expect(atan2(x, 1.5)).toBe(atan2(x, 1.5))
    }
  })

  it('keeps the exact endpoints the simulation compares against', () => {
    expect(lerp(3, 9, 0)).toBe(3)
    expect(lerp(3, 9, 1)).toBe(9)
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(length(3, 4)).toBe(5)
    expect(distanceSquared(0, 0, 3, 4)).toBe(25)
  })
})
