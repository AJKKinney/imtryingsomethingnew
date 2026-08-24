/**
 * §142.5 step 7 — the wave director.
 *
 * §10's curve is a pure function of `t` and stays that way (§131.7): §80.2 requires
 * the daily's curve be identical for every player on the same date, and §120.6
 * declined an adaptive curve on three grounds of which that was the strongest. So
 * the only randomness here is WHICH enemy and WHERE, never HOW MANY.
 *
 * The fractional remainder is carried rather than rounded away. At minute one the
 * rate is 4.2/s against 60 ticks, so rounding per tick would spawn nothing at all
 * for the first two minutes and then everything at once — the class of error §25
 * found four times by multiplying a constant against the curve it has to survive.
 */
import { TAU, cos, sin } from '../core/fixedmath.ts'
import { nextFloat, weighted } from '../core/rng.ts'
import { spawn } from '../core/pool.ts'
import { ENEMIES, ENEMY_ORDER, mixAtMinute } from '../data/enemies.ts'
import { SPAWN_RING, hpScale, spawnRate } from '../data/waves.ts'
import { minutes, type World } from '../core/world.ts'

export const STEP = 'spawn'
/** The pool and the rng both move here, and both are mutated through a reference,
 *  which is precisely what `tests/unit/loop.test.ts` fingerprints rather than trusts. */
export const WRITES: readonly string[] = ['spawnDebt', 'enemies', 'rng']

export const step = (world: World): void => {
  const t = minutes(world)
  world.spawnDebt += spawnRate(t) / 60
  const scale = hpScale(t)

  while (world.spawnDebt >= 1) {
    world.spawnDebt -= 1
    const kind = weighted(world.rng, mixAtMinute(t).map((w) => ({ value: w.value, weight: w.weight })))
    const angle = nextFloat(world.rng) * TAU
    const e = spawn(world.enemies)
    // §17: the pool never grows. A refused spawn is counted and dropped, because a
    // frame that allocates is a frame that stutters, and 2,048 is already 3.3x
    // §61.3's measured peak of 624 concurrent.
    if (e === undefined) continue
    const def = ENEMIES[kind]
    e.kind = ENEMY_ORDER.indexOf(kind)
    // §10 — the ring sits 33 u beyond the camera's 367 u half-diagonal, so enemies
    // appear just off-screen rather than popping into view.
    e.x = world.player.x + cos(angle) * SPAWN_RING
    e.y = world.player.y + sin(angle) * SPAWN_RING
    e.vx = 0
    e.vy = 0
    e.hp = def.hp * scale
    e.flags = 0
  }
}
