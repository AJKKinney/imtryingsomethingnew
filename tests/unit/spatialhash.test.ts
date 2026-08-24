/**
 * A-008 · §17 — the spatial hash returns exactly what a brute-force query returns.
 */
import { describe, expect, it } from 'vitest'
import { CELL_SIZE, clearHash, insert, queryCapped, queryRadius, spatialHash } from '../../src/core/spatialhash.ts'
import { nextFloat, rng } from '../../src/core/rng.ts'

interface Point { x: number; y: number }

const scatter = (seed: number, n: number, spread: number): Point[] => {
  const r = rng(seed)
  const points: Point[] = []
  for (let i = 0; i < n; i++) {
    points.push({ x: (nextFloat(r) - 0.5) * spread, y: (nextFloat(r) - 0.5) * spread })
  }
  return points
}

const brute = (points: readonly Point[], x: number, y: number, radius: number): number[] => {
  const out: number[] = []
  const r2 = radius * radius
  points.forEach((p, i) => {
    const dx = p.x - x
    const dy = p.y - y
    if (dx * dx + dy * dy <= r2) out.push(i)
  })
  return out
}

const load = (points: readonly Point[]) => {
  const h = spatialHash(10, points.length)
  clearHash(h)
  points.forEach((p, i) => insert(h, i, p.x, p.y))
  return h
}

describe('A-008 · §17 the spatial hash', () => {
  it('agrees with a brute-force scan on every seeded layout', () => {
    const out: number[] = []
    for (let seed = 1; seed <= 12; seed++) {
      const points = scatter(seed, 400, 2000)
      const h = load(points)
      const r = rng(seed * 977)
      for (let q = 0; q < 60; q++) {
        const x = (nextFloat(r) - 0.5) * 2200
        const y = (nextFloat(r) - 0.5) * 2200
        // Across the range the game actually queries: a Mine blast is 50, Arc's cone
        // is 90, Tesla and Pulse reach 120, and Flak targets to 300.
        const radius = 20 + nextFloat(r) * 300
        queryRadius(h, x, y, radius, out)
        expect([...out].sort((a, b) => a - b), `seed ${seed} query ${q}`)
          .toEqual(brute(points, x, y, radius))
      }
    }
  })

  it('agrees when everything sits in one cell, which is the crush', () => {
    // §61.3 puts 624 concurrent enemies on screen, and a boss arena constricts them.
    // The degenerate case is not exotic; it is minute twenty.
    const points = scatter(5, 600, CELL_SIZE * 0.5)
    const h = load(points)
    const out: number[] = []
    queryRadius(h, 0, 0, 500, out)
    expect(out.length).toBe(600)
    expect([...out].sort((a, b) => a - b)).toEqual(brute(points, 0, 0, 500))
  })

  it('agrees far from the origin, in an unbounded field', () => {
    // §12 leaves the field unbounded and §108.4 checked the arithmetic: a 21-minute
    // run reaches ~189,000 units, where the double spacing is ~3e-11.
    const far = 189_000
    const points = scatter(9, 300, 1500).map((p) => ({ x: p.x + far, y: p.y - far }))
    const h = load(points)
    const out: number[] = []
    queryRadius(h, far, -far, 250, out)
    expect([...out].sort((a, b) => a - b)).toEqual(brute(points, far, -far, 250))
  })

  it('agrees across negative coordinates, where a truncating floor would not', () => {
    const points: Point[] = []
    for (let x = -200; x <= 200; x += 7) for (let y = -200; y <= 200; y += 11) points.push({ x, y })
    const h = load(points)
    const out: number[] = []
    for (const [qx, qy] of [[-0.5, -0.5], [0, 0], [-64, 64], [-63.999, 0.001]] as const) {
      queryRadius(h, qx, qy, 90, out)
      expect([...out].sort((a, b) => a - b), `${qx},${qy}`).toEqual(brute(points, qx, qy, 90))
    }
  })

  it('is a pure function of what was inserted', () => {
    const points = scatter(3, 250, 900)
    const a: number[] = []
    const b: number[] = []
    queryRadius(load(points), 10, -20, 140, a)
    queryRadius(load(points), 10, -20, 140, b)
    expect(a).toEqual(b)
  })

  it('caps the separation query without pretending to sort it', () => {
    // §17 caps separation at 8 neighbours per enemy per tick. "Capped" and not
    // "nearest": separation needs a bounded sample of the crowd, and a name promising
    // distance order would cost a sort per enemy per tick to keep honest.
    const points = scatter(4, 300, CELL_SIZE)
    const h = load(points)
    const out: number[] = []
    expect(queryCapped(h, 0, 0, 400, 8, out)).toBe(8)
    expect(out).toHaveLength(8)
    expect(new Set(out).size).toBe(8)
  })
})
