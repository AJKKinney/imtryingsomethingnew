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
