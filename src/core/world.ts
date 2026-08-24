/**
 * The simulation's state — §30's core types, in one place.
 *
 * Everything here is plain data: dense arrays, numeric fields, no methods, no
 * closures, no `Date`, no `Map` in an order-sensitive path. That is what makes
 * §16's snapshot a structural copy rather than a serialiser, and what makes a
 * replay reproduce (§14).
 *
 * The generated loop (`src/gen/loop.ts`) is the only module permitted to cross
 * systems (§145.4), so `grid/` and `game/` never import each other: each declares
 * the step it runs at and the world attributes it owns, and the loop wires them.
 */
import { rng, type Rng } from './rng.ts'
import { pool, type Pool, type Pooled } from './pool.ts'
import { spatialHash, type SpatialHash } from './spatialhash.ts'
import { PLAYER_INTEGRITY } from '../data/player.ts'

/** §30 — pooled, dense, never object-keyed. `flags` is a bitfield, not a Set. */
export interface Entity extends Pooled {
  kind: number
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  flags: number
}

/** §9's constants live in `src/data/player.ts`; this is the state they act on. */
export interface PlayerState {
  x: number
  y: number
  vx: number
  vy: number
  integrity: number
  /** Ticks of invulnerability remaining. §37.2 makes them GLOBAL, not per enemy. */
  iframes: number
  dashCooldown: number
  /** Ticks of dash remaining. The dash is a MOVEMENT STATE, not an impulse: §9 gives
   *  it i-frames throughout, so its duration has to be something the sim carries. */
  dashTicks: number
  /**
   * Unit facing, which is where §8.2's cone points.
   *
   * §112.6 declines manual aim on the record — a third real-time verb would turn
   * pressure into execution, which is the genre §68 repositioned away from — so the
   * cone follows movement, and standing still keeps the last direction rather than
   * collapsing to zero. That is what makes §121.5's coverage a real property of a
   * weapon instead of a number in a table.
   */
  facingX: number
  facingY: number
}

/**
 * One emitter's firing state.
 *
 * At commit 7 there is exactly one — Arc — because there is no board yet to hold
 * components. Commit 10 replaces this with per-cell state on the grid; the shape is
 * kept deliberately small so that replacement is a deletion rather than a migration.
 */
export interface WeaponState {
  /** Seconds until the next shot. Counted down in seconds, not ticks, so §8.2's
   *  rates read as they are written and a rate change is a data change. */
  cooldown: number
}

/**
 * One tick of intent, and the whole of §14's second input.
 *
 * A run is a pure function of (seed, input log), so this is the only thing that
 * enters the simulation from outside it — and it is recorded, which is what makes a
 * replay, a crash report, a leaderboard entry and a daily reproduce.
 */
export interface InputFrame {
  /** Already normalised to a unit disc by the host; the simulation does not re-read a device. */
  moveX: number
  moveY: number
  dash: boolean
}

export interface World {
  /** Ticks since the run began. Never wall clock, which is an unrecorded input. */
  tick: number
  rng: Rng
  /** What the host is holding down right now. Sampled by step 2, never read directly. */
  live: InputFrame
  /** This tick's intent, as the simulation sees it. */
  input: InputFrame
  /**
   * The recorded log — three numbers a tick. §41.1 delta-encodes and RLEs it into a
   * ~2,500-character replay code; this is the uncompressed form it is built from.
   */
  inputLog: number[]
  player: PlayerState
  enemies: Pool<Entity>
  hash: SpatialHash
  /** §8.2's starting emitter, until commit 10's board holds components. */
  arc: WeaponState
  /** Fractional enemies owed by §10's spawn curve. Carried, never rounded away. */
  spawnDebt: number
  /**
   * §9's auto-pause, as SIMULATION state rather than host state.
   *
   * A pause driven from outside the world is an unrecorded input, and an unrecorded
   * input is a replay that does not reproduce — which is §26's silent desync arriving
   * through the event the player triggers most. The gate reads it (§142.4).
   */
  paused: boolean
  /** Ticks left of the one-tick window in which a resume is announced (§3.B). */
  resumeGap: number
  /** Set when integrity reaches zero. §9: banked salvage kept, no revives. */
  over: boolean
  kills: number
  /** Integrity lost to contact — §88.3's second fault-trace line, accumulated from tick one. */
  contactDamage: number
}

/** Seconds elapsed. Derived from the tick, so it cannot drift from the simulation. */
export const elapsed = (world: World): number => world.tick / 60

/** Minutes elapsed — the unit §10's wave director and §32.1's encounter table use. */
export const minutes = (world: World): number => world.tick / 3600

/**
 * A step is a pure mutation of the world at a stated point in the tick order.
 *
 * It takes the whole world because §142.5's manifest — not an import graph — decides
 * what runs when. A step that needed a second argument would be a step whose inputs
 * the manifest does not express, which is the thing §142.6 fails the build over.
 */
export type Step = (world: World) => void

/** §17 — pre-allocated, never grown during a run. A pool that grows is a frame spike. */
export const ENEMY_POOL = 2048
/** §17's cell size is 64 u; 2^11 buckets keeps the load factor under one at peak. */
export const HASH_BUCKET_BITS = 11

const emptyFrame = (): InputFrame => ({ moveX: 0, moveY: 0, dash: false })

const emptyEntity = (): Entity => ({ id: 0, kind: 0, x: 0, y: 0, vx: 0, vy: 0, hp: 0, flags: 0 })

/**
 * A run's initial state, and the whole of §14's first input.
 *
 * Everything a run becomes is a pure function of this seed and the recorded log, so
 * this constructor is the only place a starting value is chosen — which is what lets
 * §119.8 compare two LIVE runs rather than two replays of one capture.
 */
export const createWorld = (seed: number): World => ({
  tick: 0,
  rng: rng(seed),
  live: emptyFrame(),
  input: emptyFrame(),
  inputLog: [],
  player: {
    x: 0, y: 0, vx: 0, vy: 0,
    integrity: PLAYER_INTEGRITY,
    iframes: 0,
    dashCooldown: 0,
    dashTicks: 0,
    facingX: 0,
    facingY: -1,
  },
  enemies: pool<Entity>(ENEMY_POOL, emptyEntity),
  hash: spatialHash(HASH_BUCKET_BITS, ENEMY_POOL),
  arc: { cooldown: 0 },
  spawnDebt: 0,
  paused: false,
  resumeGap: 0,
  over: false,
  kills: 0,
  contactDamage: 0,
})
