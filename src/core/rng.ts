/**
 * The seeded random number generator — mulberry32.
 *
 * §14: `Math.random` appears nowhere in this project. Every random draw routes
 * through here, because the entire value of §14's determinism rests on the world
 * being a pure function of (seed, input log). Replays, crash reports (§16), balance
 * sweeps (§13), leaderboard verification (§66.4), PAR (§124.5), §119.8's fairness
 * hash and §80.2's identical daily are all the same property, seen from six sides.
 *
 * The state is a single int32 on purpose: §30's `Snapshot` carries `rngState: number`,
 * so the generator has to fit in one word or the snapshot round-trip (A-010) cannot
 * be exact. mulberry32 does; most alternatives do not.
 */

/** One word of state, so §30's snapshot can carry it. */
export interface Rng {
  state: number
}

export const rng = (seed: number): Rng => ({ state: seed | 0 })

/** A copy, for the cheap surrogate lookaheads §15's lookahead-1 policy runs. */
export const fork = (r: Rng): Rng => ({ state: r.state })

/**
 * The core step. Uses `Math.imul` — which is NOT a transcendental and is exactly
 * specified for all int32 inputs by the language, unlike `Math.sin` (§14). A plain
 * `*` here would silently lose precision above 2^53 and produce a different sequence
 * on a different engine, which is the exact failure §14 exists to prevent. The lint
 * rule allows `imul` by name and for this reason.
 */
export const nextU32 = (r: Rng): number => {
  r.state = (r.state + 0x6d2b79f5) | 0
  let t = Math.imul(r.state ^ (r.state >>> 15), 1 | r.state)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return (t ^ (t >>> 14)) >>> 0
}

/** [0, 1). Exact division by 2^32, so no rounding mode is involved. */
export const nextFloat = (r: Rng): number => nextU32(r) / 4294967296

/** [0, n). Multiply-and-shift rather than modulo: no division, no modulo bias worth the branch. */
export const nextInt = (r: Rng, n: number): number => (nextU32(r) * n) / 4294967296 | 0

/** [lo, hi]. */
export const nextRange = (r: Rng, lo: number, hi: number): number => lo + nextInt(r, hi - lo + 1)

/**
 * A uniform pick. Returns the first element for an empty array's sake only in the
 * type system; callers pass non-empty arrays and `noUncheckedIndexedAccess` makes
 * the assertion explicit rather than implicit.
 */
export const pick = <T>(r: Rng, xs: readonly T[]): T => {
  const x = xs[nextInt(r, xs.length)]
  if (x === undefined) throw new Error('pick from an empty array')
  return x
}

/**
 * A weighted draw over §118.5's distribution objects — weights summing to 1, never a
 * range literal, because a range is a summary of a distribution and this game shipped
 * three of those before anyone noticed (the wave mix alone spanned 3.4x in total
 * spawned HP across three honest readings of one sentence).
 */
export const weighted = <T>(r: Rng, entries: readonly { value: T; weight: number }[]): T => {
  let roll = nextFloat(r)
  for (const entry of entries) {
    roll -= entry.weight
    if (roll < 0) return entry.value
  }
  // Floating-point slack at the very top of the range. The last entry is the answer;
  // it is not an error, and it must not be a different answer on a different machine.
  const last = entries[entries.length - 1]
  if (last === undefined) throw new Error('weighted draw over an empty distribution')
  return last.value
}
