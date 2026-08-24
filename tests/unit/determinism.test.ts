/**
 * A-007 · §14 — the golden-hash harness, over a stub loop.
 *
 * §14's whole payoff is that the world is a pure function of (seed, input log).
 * `core/loop` does not exist yet, so what is exercised here is the machinery and the
 * two leaves it rests on: the seeded generator and the baked mathematics, composed
 * and stepped ten thousand times.
 *
 * This file deliberately does NOT yet cite the assertion about ten thousand
 * SIMULATED ticks. A stub is not the simulation, and a manifest entry marked
 * implemented against a stand-in is exactly the lie the manifest exists to prevent
 * (§71.2). It claims that entry when the generated loop arrives.
 */
import { describe, expect, it } from 'vitest'
import { nextFloat, rng } from '../../src/core/rng.ts'
import { TAU, atan2, cos, length, sin } from '../../src/core/fixedmath.ts'
import { digest, feed, hasher } from '../golden.ts'

interface Stub {
  x: number
  y: number
  angle: number
}

/**
 * A stand-in with the shape the real loop will have: dense arrays, a fixed
 * iteration order, no wall clock, and every random draw from the seeded generator.
 */
const run = (seed: number, ticks: number): string => {
  const r = rng(seed)
  const bodies: Stub[] = []
  for (let i = 0; i < 32; i++) {
    bodies.push({ x: nextFloat(r) * 640, y: nextFloat(r) * 360, angle: nextFloat(r) * TAU })
  }
  const h = hasher()
  for (let tick = 0; tick < ticks; tick++) {
    for (const b of bodies) {
      b.angle += 0.01 + nextFloat(r) * 0.001
      b.x += cos(b.angle) * 2.5
      b.y += sin(b.angle) * 2.5
      // A quantity a real system would branch on, so a drift in `atan2` shows up
      // rather than being averaged away.
      if (atan2(b.y, b.x) < 0) b.x = -b.x
      if (length(b.x, b.y) > 5000) {
        b.x *= 0.5
        b.y *= 0.5
      }
    }
    if ((tick & 1023) === 0) for (const b of bodies) { feed(h, b.x); feed(h, b.y); feed(h, b.angle) }
  }
  for (const b of bodies) { feed(h, b.x); feed(h, b.y); feed(h, b.angle) }
  return digest(h)
}

describe('A-007 · §14 the golden hash', () => {
  it('reproduces exactly over ten thousand ticks', () => {
    expect(run(0x4d454c54, 10_000)).toBe(run(0x4d454c54, 10_000))
  })

  it('holds a committed value, so a silent drift fails the build', () => {
    // A regression baseline rather than a correctness oracle: it is taken from this
    // code, and its job is to notice when a change to `rng` or `fixedmath` quietly
    // moves every number in the game. Correctness is A-007's other tests, which
    // measure against `Math.sin` and against an independent transcription.
    expect(run(0x4d454c54, 10_000)).toBe('1158ea2c')
  })

  it('separates on the seed, so the hash is measuring the run and not the shape', () => {
    expect(run(1, 10_000)).not.toBe(run(2, 10_000))
  })

  it('separates on a single bit of a single double', () => {
    // FNV-1a over the exact bit pattern: a value differing in its last mantissa bit
    // — which is precisely how a transcendental desynchronises — is a different
    // hash, not a rounding difference nobody notices.
    const a = hasher(); feed(a, 0.1)
    const b = hasher(); feed(b, 0.1 + Number.EPSILON / 8)
    expect(digest(a)).not.toBe(digest(b))
  })
})
