/**
 * The spatial hash (§17) — cell size 64 units.
 *
 * §40.1 measures enemy separation as the single largest cost in the simulation:
 * 570 enemies x 8 neighbour checks, every tick. A hash makes that local instead of
 * quadratic, and §31.3's headroom — the thing that pays for the Steam Deck — is
 * measured against it existing.
 *
 * The field is UNBOUNDED (§12), so this cannot be a fixed grid over a known area.
 * It is a hash of the cell coordinate into a power-of-two bucket count, with the
 * buckets held as two typed arrays rather than a Map: §14 forbids iterating a Map in
 * an order-sensitive path, and an intrusive linked list over dense indices has no
 * iteration order to depend on in the first place.
 *
 * §108.4 checked the unbounded field against §14 and it holds: a 21-minute run
 * reaches at most ~189,000 units, where the double spacing is ~3e-11, and the cell
 * coordinate is a `Math.floor` — exact — so the hash is indifferent to how far the
 * player has walked.
 */

import type { World } from './world.ts'

/** §17. A Swarmer is 6 units and the largest combat query is Flak's 300. */
export const CELL_SIZE = 64

export interface SpatialHash {
  readonly cellSize: number
  readonly bucketMask: number
  /** First item index in each bucket, or -1. */
  readonly heads: Int32Array
  /** Intrusive list: the next item index in the same bucket, or -1. */
  readonly next: Int32Array
  readonly xs: Float64Array
  readonly ys: Float64Array
  count: number
}

export const spatialHash = (bucketBits: number, capacity: number): SpatialHash => {
  const buckets = 1 << bucketBits
  return {
    cellSize: CELL_SIZE,
    bucketMask: buckets - 1,
    heads: new Int32Array(buckets).fill(-1),
    next: new Int32Array(capacity).fill(-1),
    xs: new Float64Array(capacity),
    ys: new Float64Array(capacity),
    count: 0,
  }
}

/**
 * Integer hash of a cell coordinate. `Math.imul` throughout, so every intermediate
 * is an exact int32 on every engine — the same reason `core/rng` uses it.
 */
const bucketOf = (h: SpatialHash, cx: number, cy: number): number => {
  const a = Math.imul(cx, 0x9e3779b1)
  const b = Math.imul(cy, 0x85ebca6b)
  const mixed = a ^ (b + 0x9e3779b9 + (a << 6) + (a >>> 2))
  return (mixed ^ (mixed >>> 15)) & h.bucketMask
}

export const clearHash = (h: SpatialHash): void => {
  h.heads.fill(-1)
  h.count = 0
}

export const insert = (h: SpatialHash, index: number, x: number, y: number): void => {
  const cx = Math.floor(x / h.cellSize)
  const cy = Math.floor(y / h.cellSize)
  const bucket = bucketOf(h, cx, cy)
  h.xs[index] = x
  h.ys[index] = y
  // `heads[bucket]` is in range by construction; the mask guarantees it.
  h.next[index] = h.heads[bucket] ?? -1
  h.heads[bucket] = index
  h.count++
}

/**
 * Every inserted index within `radius` of (x, y), by EXACT distance.
 *
 * The contract is exactness rather than "candidates near the query", because A-008
 * bands this against a brute-force scan and a contract of "roughly" cannot be banded
 * at all. Callers get a set they can act on without a second filter; the cost is one
 * squared-distance comparison per candidate, which is two multiplies.
 *
 * Order is deterministic and is NOT brute-force order. Anything that needs a
 * canonical winner tiebreaks on entity id (§14), which is what ids are for.
 */
export const queryRadius = (
  h: SpatialHash,
  x: number,
  y: number,
  radius: number,
  out: number[],
): number => {
  out.length = 0
  const r2 = radius * radius
  const lo = h.cellSize
  const minX = Math.floor((x - radius) / lo)
  const maxX = Math.floor((x + radius) / lo)
  const minY = Math.floor((y - radius) / lo)
  const maxY = Math.floor((y + radius) / lo)
  // Two different cells can share a bucket, so a candidate is re-checked by distance
  // rather than trusted. That is also why a collision is a performance question and
  // never a correctness one.
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      let i = h.heads[bucketOf(h, cx, cy)] ?? -1
      while (i !== -1) {
        const ix = h.xs[i] ?? 0
        const iy = h.ys[i] ?? 0
        // Guard against a bucket collision handing us an item from a different cell.
        if (Math.floor(ix / lo) === cx && Math.floor(iy / lo) === cy) {
          const dx = ix - x
          const dy = iy - y
          if (dx * dx + dy * dy <= r2) out.push(i)
        }
        i = h.next[i] ?? -1
      }
    }
  }
  return out.length
}

/**
 * §17's separation pass, capped at 8 neighbours per enemy per tick.
 *
 * The cap is what keeps the largest cost in the simulation linear when a crowd
 * thickens, and it lives here rather than at the call site so that no caller can
 * forget it in the one frame where 624 enemies overlap.
 *
 * "Capped" and not "nearest": these are the first `limit` within the radius in the
 * hash's own deterministic order, not the closest ones. Separation does not need the
 * closest — it needs a bounded sample of the crowd — and a name that promised
 * distance ordering would cost a sort per enemy per tick to keep.
 */
export const queryCapped = (
  h: SpatialHash,
  x: number,
  y: number,
  radius: number,
  limit: number,
  out: number[],
): number => {
  queryRadius(h, x, y, radius, out)
  if (out.length > limit) out.length = limit
  return out.length
}

/**
 * §142.5 step 10 — rebuild.
 *
 * The declarations below are what `tools/emit.ts` reads to generate the loop and what
 * `tools/lintsteps.ts` checks: a simulation module that declares no step cannot be
 * wired, and one that writes a world attribute it does not own fails the build. §26
 * has said since pass 26 that "ordering IS the simulation's semantics", and §142
 * found fourteen behaviours with no step at all.
 *
 * The `World` import above is TYPE-ONLY and erases at compile time, so this module
 * remains the runtime leaf §145.4 requires: it imports nothing from the game.
 */
export const STEP = 'spatialhash'

/** The world attributes this step owns. Nothing else may write them. */
export const WRITES: readonly string[] = ['hash']

export const step = (world: World): void => {
  const { enemies, hash } = world
  clearHash(hash)
  for (let i = 0; i < enemies.count; i++) {
    const e = enemies.items[i]
    if (e !== undefined) insert(hash, i, e.x, e.y)
  }
}
