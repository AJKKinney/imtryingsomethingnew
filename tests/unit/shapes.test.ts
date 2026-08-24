/**
 * A-043 · §15, §46.2 — the faction is the form, and that is what survives.
 *
 * §46.2 puts friend/foe on two channels deliberately: hue (cyan-to-white against
 * amber-to-red, which protanopia and deuteranopia preserve) and FORM (symmetric and
 * closed against broken and open, which carries the whole read where hue fails).
 * §85.4 later ran the same audit over the board's seven channels and found none of
 * them depending on hue alone. This is the field's version of that check, and it is
 * pointed at the generator rather than at a frame, because the property is a
 * constraint on one shape grammar rather than a fact about a screenshot.
 */
import { describe, expect, it } from 'vitest'
import { MAX_RADIUS, MIN_RADIUS, SYMMETRY_ORDERS, VERTICES_PER_WEDGE, silhouette } from '../../src/gen/shapes.ts'
import { CORE_HUES, CORRUPTION } from '../../src/gen/palette.ts'

/** Rotational symmetry: does the vertex set map onto itself under a wedge rotation? */
const symmetryError = (points: Float64Array, order: number): number => {
  const n = points.length / 2
  const per = n / order
  let worst = 0
  for (let i = 0; i < n; i++) {
    const j = (i + per) % n
    const ri = Math.sqrt((points[i * 2] ?? 0) * (points[i * 2] ?? 0) + (points[i * 2 + 1] ?? 0) * (points[i * 2 + 1] ?? 0))
    const rj = Math.sqrt((points[j * 2] ?? 0) * (points[j * 2] ?? 0) + (points[j * 2 + 1] ?? 0) * (points[j * 2 + 1] ?? 0))
    const d = Math.abs(ri - rj)
    if (d > worst) worst = d
  }
  return worst
}

describe('A-043 · §46.2 friend and foe are separable by form alone', () => {
  it('gives every friendly silhouette exact rotational symmetry', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = silhouette(seed, true)
      const order = s.points.length / 2 / VERTICES_PER_WEDGE
      expect(SYMMETRY_ORDERS).toContain(order)
      // Exact to the resolution of §14's baked sine table, and not exact in the
      // arithmetic sense — the radii ARE identical wedge to wedge, and recovering a
      // radius from a point costs one table lookup and one interpolation each way.
      // Measured across 200 seeds: worst case 1.9e-7. Banded at 1e-5, which is two
      // orders of headroom and still a hundred times tighter than the separator
      // below, so the two classes cannot be confused by a tighter table or a looser
      // one. (§14's atan2 was banded twice on a claimed figure and measured worse
      // both times; the rule that came out of it is to state the measurement.)
      expect(symmetryError(s.points, order)).toBeLessThan(1e-5)
    }
  })

  it('breaks symmetry on every hostile silhouette', () => {
    let broken = 0
    for (let seed = 1; seed <= 200; seed++) {
      const s = silhouette(seed, false)
      const order = s.points.length / 2 / VERTICES_PER_WEDGE
      // 1e-3 against the friendly band's 1e-5: the hostile branch perturbs each
      // vertex by up to +/-0.175, so the gap between the two classes is four orders
      // of magnitude and the test is measuring a kind rather than a tolerance.
      if (symmetryError(s.points, order) > 1e-3) broken++
    }
    // Every one, not most. A hostile silhouette that happened to come out symmetric
    // would read as the player's machine in the one frame it mattered.
    expect(broken).toBe(200)
  })

  it('closes the friendly outline and leaves the hostile one open', () => {
    expect(silhouette(1, true).closed).toBe(true)
    expect(silhouette(1, false).closed).toBe(false)
  })

  it('keeps every radius inside the stated bounds, so nothing degenerates', () => {
    for (let seed = 1; seed <= 200; seed++) {
      for (const friendly of [true, false]) {
        const s = silhouette(seed, friendly)
        for (let i = 0; i < s.points.length / 2; i++) {
          const r = Math.sqrt(
            (s.points[i * 2] ?? 0) * (s.points[i * 2] ?? 0) +
            (s.points[i * 2 + 1] ?? 0) * (s.points[i * 2 + 1] ?? 0),
          )
          // The hostile branch perturbs by up to +/-0.175 on top of the band, which
          // is what jagged means; nothing may collapse to a point or invert.
          expect(r).toBeGreaterThan(MIN_RADIUS - 0.2)
          expect(r).toBeLessThan(MAX_RADIUS + 0.2)
        }
      }
    }
  })

  it('is a pure function of the seed, so a silhouette is regenerated and never stored', () => {
    // §104.4's wreck payload is 39 bytes of which 33 are the board. A machine that
    // had to carry its own picture would not fit in a leaderboard entry at all.
    const a = silhouette(4242, true)
    const b = silhouette(4242, true)
    expect([...a.points]).toEqual([...b.points])
  })

  it('keeps the two palettes on opposite sides of the warm/cool axis', () => {
    // Hue is the SECOND channel, and it is redundant on purpose. §104.5 lets the
    // player choose their core's hue from eight options and every one is cool, so
    // expression costs the faction read nothing.
    const warmth = (hex: string): number => {
      const r = Number.parseInt(hex.slice(1, 3), 16)
      const b = Number.parseInt(hex.slice(5, 7), 16)
      return r - b
    }
    for (const hue of CORE_HUES) expect(warmth(hue)).toBeLessThanOrEqual(0)
    for (const hue of CORRUPTION) expect(warmth(hue)).toBeGreaterThan(0)
  })
})
