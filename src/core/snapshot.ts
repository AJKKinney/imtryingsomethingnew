/**
 * §16, §30 — an exact structural copy of the world.
 *
 * §30's core types are plain data for this reason: no methods, no closures, no
 * `Date`, no `Map` in an order-sensitive path. A snapshot is therefore a copy rather
 * than a serialiser, which is what makes §9's suspend/resume EXACT rather than
 * approximate — and §3.B's venue closes its lid constantly, so "approximate" would
 * mean a player resuming into a crush that had moved.
 *
 * §106.2 costed what this is: ~220 KB, thirteen times everything else the game
 * persists combined, and rewritten on every suspend. It is **local only and never
 * synced**, because nobody resumes a mid-run on another device — a 93% cut in cloud
 * volume on the file most likely to be mid-write when a Deck suspends.
 */
import { spatialHash } from './spatialhash.ts'
import { ENEMY_POOL, HASH_BUCKET_BITS, type Entity, type World } from './world.ts'
import type { Pool } from './pool.ts'

/** §16 — the version and the content hash of the data tables travel with the copy. */
export interface Snapshot {
  readonly version: number
  readonly contentHash: string
  readonly world: World
}

export const SNAPSHOT_VERSION = 1

const copyEntity = (e: Entity): Entity => ({
  id: e.id, kind: e.kind, x: e.x, y: e.y, vx: e.vx, vy: e.vy, hp: e.hp, flags: e.flags,
})

const copyPool = (p: Pool<Entity>): Pool<Entity> => ({
  capacity: p.capacity,
  // Every slot, not just the live prefix: a pooled entity beyond `count` is dead
  // storage the next spawn overwrites, and copying only the prefix would make a
  // resumed world differ from a continued one the first time something spawned.
  items: p.items.map(copyEntity),
  count: p.count,
  nextId: p.nextId,
  refused: p.refused,
})

/** Deep, and deliberately explicit: a structural clone that walked the object graph
 *  would silently start copying anything a later field happened to hold. */
export const copyWorld = (w: World): World => ({
  tick: w.tick,
  rng: { state: w.rng.state },
  live: { moveX: w.live.moveX, moveY: w.live.moveY, dash: w.live.dash },
  input: { moveX: w.input.moveX, moveY: w.input.moveY, dash: w.input.dash },
  inputLog: w.inputLog.slice(),
  player: { ...w.player },
  enemies: copyPool(w.enemies),
  // Rebuilt rather than copied: the hash is a pure function of the entity positions
  // (§142.5 step 10), so carrying it would be storing a derived quantity — the exact
  // thing §111.5 forbids an effect from writing to.
  hash: spatialHash(HASH_BUCKET_BITS, ENEMY_POOL),
  arc: { cooldown: w.arc.cooldown },
  spawnDebt: w.spawnDebt,
  paused: w.paused,
  resumeGap: w.resumeGap,
  over: w.over,
  kills: w.kills,
  contactDamage: w.contactDamage,
})

export const snapshot = (w: World, contentHash: string): Snapshot => ({
  version: SNAPSHOT_VERSION,
  contentHash,
  world: copyWorld(w),
})

export type RestoreFailure =
  | { readonly ok: false; readonly reason: 'version'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'content'; readonly detail: string }

export type RestoreResult = { readonly ok: true; readonly world: World } | RestoreFailure

/**
 * §66.2's policy, applied to the one import that comes from the player's own disk:
 * **reject, never clamp.** The simulation is deterministic, so a silently-clamped
 * field does not throw — it produces a world that differs from the saved one,
 * deterministically, forever, and the player has no way to know. That reads as *the
 * game is broken*, which is the one emotion §2's watchlist singles out as
 * review-converting.
 */
export const restore = (s: Snapshot, contentHash: string): RestoreResult => {
  if (s.version !== SNAPSHOT_VERSION) {
    return { ok: false, reason: 'version', detail: `snapshot v${s.version}, build v${SNAPSHOT_VERSION}` }
  }
  if (s.contentHash !== contentHash) {
    // §16 — a replay recorded on v0.1 will not reproduce on v0.2 if balance changed,
    // and pretending otherwise is how a "watch this run" feature becomes a liar.
    return { ok: false, reason: 'content', detail: `recorded against ${s.contentHash}` }
  }
  return { ok: true, world: copyWorld(s.world) }
}
