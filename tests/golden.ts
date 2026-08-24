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
 *
 * The hasher itself moved to `src/core/hash.ts` at commit 8, because §16's content
 * hash and §14's world hash are needed at RUNTIME — a replay refused for a content
 * mismatch is a player-facing message, not a test. Two implementations of one hash
 * is two things that can disagree, and the one that would disagree silently is the
 * one the test uses. What stays here is `fingerprint`, which is a test instrument.
 */
import { digest, feed, hasher } from '../src/core/hash.ts'

export { digest, feed, hashOf, hasher, type Hasher } from '../src/core/hash.ts'


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
