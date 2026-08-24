/**
 * A-007 · §14 — the seeded RNG reproduces a fixed golden sequence.
 */
import { describe, expect, it } from 'vitest'
import { fork, nextFloat, nextInt, nextU32, pick, rng, weighted } from '../../src/core/rng.ts'
import { hashOf } from '../golden.ts'

describe('A-007 · §14 the seeded generator', () => {
  it('agrees with the published algorithm, transcribed independently', () => {
    // The golden values below come from THIS reference, not from src/core/rng.ts.
    // A golden number derived from the implementation it is checking agrees with
    // every change to that implementation, which is no test at all (§142.6 — the
    // thing being tested may not define the test).
    const reference = (seed: number): (() => number) => {
      let a = seed | 0
      return () => {
        a = (a + 0x6d2b79f5) | 0
        let t = Math.imul(a ^ (a >>> 15), 1 | a)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return (t ^ (t >>> 14)) >>> 0
      }
    }

    const f = reference(0x4d454c54)
    expect([f(), f(), f(), f()]).toEqual([2816090093, 479579504, 1064116431, 1274300326])

    const r = rng(0x4d454c54)
    const g = reference(0x4d454c54)
    for (let i = 0; i < 10_000; i++) expect(nextU32(r)).toBe(g())
  })

  it('is a pure function of its seed across a long run', () => {
    const stream = (seed: number): number[] => {
      const r = rng(seed)
      const out: number[] = []
      for (let i = 0; i < 10_000; i++) out.push(nextU32(r))
      return out
    }
    expect(hashOf(stream(1))).toBe(hashOf(stream(1)))
    expect(hashOf(stream(1))).not.toBe(hashOf(stream(2)))
  })

  it('carries all of its state in one word, so §30\'s snapshot can hold it', () => {
    // If the generator needed more than `rngState: number`, a snapshot round-trip
    // could not be exact and A-010 would be unsatisfiable.
    const r = rng(99)
    for (let i = 0; i < 50; i++) nextU32(r)
    const resumed = { state: r.state }
    expect(nextU32(resumed)).toBe(nextU32(fork(r)))
    expect(Object.keys(r)).toEqual(['state'])
  })

  it('stays inside its stated ranges over a long run', () => {
    const r = rng(7)
    for (let i = 0; i < 20_000; i++) {
      const f = nextFloat(r)
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
      const n = nextInt(r, 13)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(13)
    }
  })

  it('draws from a §118.5 distribution rather than a range literal', () => {
    // A range is a summary of a distribution, and three unspecified shapes shipped
    // in this design before anyone noticed — the wave mix alone spanned 3.4x in
    // total spawned HP across three honest readings of one sentence.
    const dist = [
      { value: 'swarmer', weight: 0.7 },
      { value: 'brute', weight: 0.16 },
      { value: 'shooter', weight: 0.14 },
    ]
    const r = rng(3)
    const counts = { swarmer: 0, brute: 0, shooter: 0 }
    for (let i = 0; i < 100_000; i++) counts[weighted(r, dist) as keyof typeof counts]++
    expect(counts.swarmer / 100_000).toBeCloseTo(0.7, 2)
    expect(counts.brute / 100_000).toBeCloseTo(0.16, 2)
    expect(counts.shooter / 100_000).toBeCloseTo(0.14, 2)
  })

  it('picks deterministically and never off the end', () => {
    const r = rng(11)
    const xs = ['a', 'b', 'c'] as const
    for (let i = 0; i < 1000; i++) expect(xs).toContain(pick(r, xs))
    expect(() => pick(rng(1), [])).toThrow()
  })
})
