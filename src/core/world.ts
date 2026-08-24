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
import type { Rng } from './rng.ts'
import type { Pool, Pooled } from './pool.ts'
import type { SpatialHash } from './spatialhash.ts'

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
}

export interface World {
  /** Ticks since the run began. Never wall clock, which is an unrecorded input. */
  tick: number
  rng: Rng
  player: PlayerState
  enemies: Pool<Entity>
  hash: SpatialHash
}

/**
 * A step is a pure mutation of the world at a stated point in the tick order.
 *
 * It takes the whole world because §142.5's manifest — not an import graph — decides
 * what runs when. A step that needed a second argument would be a step whose inputs
 * the manifest does not express, which is the thing §142.6 fails the build over.
 */
export type Step = (world: World) => void
