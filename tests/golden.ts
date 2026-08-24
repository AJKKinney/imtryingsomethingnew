/**
 * The golden-hash harness (§14).
 *
 * §14's payoff is that the world is a pure function of (seed, input log), and the
 * only way to keep that true across twenty memoryless sessions is to hash it and
 * fail the build when the hash moves. A golden hash is also what makes §16's crash
 * codes reproducible, §66.4's leaderboard entries verifiable by any client, and
 * §124.5's PAR bit-identical on every machine.
 *
 * FNV-1a over the exact bit pattern of every double, so a value that differs in its
 * last mantissa bit — which is precisely how a transcendental desynchronises — is a
 * different hash rather than a rounding difference nobody notices.
 */

const view = new DataView(new ArrayBuffer(8))

export interface Hasher {
  h: number
}

export const hasher = (): Hasher => ({ h: 0x811c9dc5 | 0 })

const byte = (s: Hasher, b: number): void => {
  s.h = Math.imul(s.h ^ b, 0x01000193)
}

/** Every double, exactly — never a rounded or formatted view of one. */
export const feed = (s: Hasher, x: number): void => {
  view.setFloat64(0, x)
  for (let i = 0; i < 8; i++) byte(s, view.getUint8(i))
}

export const digest = (s: Hasher): string => (s.h >>> 0).toString(16).padStart(8, '0')

/** Convenience for the common case: hash a finite stream of numbers. */
export const hashOf = (xs: Iterable<number>): string => {
  const s = hasher()
  for (const x of xs) feed(s, x)
  return digest(s)
}

/**
 * A fingerprint of one top-level world attribute.
 *
 * This is what lets `tests/unit/loop.test.ts` enforce §142.6's third clause — that no
 * module writes a world attribute from outside the step that declares it — by
 * BEHAVIOUR rather than by declaration. A textual lint cannot see a mutation through
 * a reference (`const h = world.hash; h.count = 0`); a fingerprint taken around every
 * step sees it every time.
 */
export const fingerprint = (value: unknown): string => {
  const s = hasher()
  const walk = (v: unknown, depth: number): void => {
    if (depth > 6) return
    if (typeof v === 'number') return feed(s, v)
    if (typeof v === 'boolean') return feed(s, v ? 1 : 0)
    if (typeof v === 'string') {
      for (let i = 0; i < v.length; i++) feed(s, v.charCodeAt(i))
      return
    }
    if (v === null || v === undefined) return feed(s, -0.5)
    if (ArrayBuffer.isView(v)) {
      const a = v as unknown as ArrayLike<number>
      for (let i = 0; i < a.length; i++) feed(s, a[i] ?? 0)
      return
    }
    if (Array.isArray(v)) {
      feed(s, v.length)
      for (const x of v) walk(x, depth + 1)
      return
    }
    if (typeof v === 'object') {
      // Sorted, so the fingerprint does not depend on property insertion order —
      // the same reason `tools/gendocs.ts` sorts before it renders.
      for (const key of Object.keys(v as object).sort()) {
        for (let i = 0; i < key.length; i++) feed(s, key.charCodeAt(i))
        walk((v as Record<string, unknown>)[key], depth + 1)
      }
    }
  }
  walk(value, 0)
  return digest(s)
}
