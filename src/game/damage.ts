/**
 * §142.5 step 14 — collision and damage.
 *
 * §37.2 settled the two rules that decide whether a crowd is survivable, and both
 * extremes are wrong: with PER-ENEMY i-frames, twenty overlapping Brutes deal 780
 * damage in one tick, which is instant death from a crowd the player is supposed to
 * be able to wade into; with global i-frames and nothing else, twenty Brutes deal
 * exactly as much as one and density stops mattering at all.
 *
 * So: i-frames are GLOBAL, and the damage taken is the SINGLE HIGHEST contact value
 * among every overlapping enemy. Being surrounded by Swarmers is survivable; letting
 * a Brute reach you hurts regardless of what else is touching you; and the ceiling
 * stays predictable enough that a death always has a legible cause, which §2's
 * watchlist requires and which §67.3's fault trace is built on.
 */
import { queryRadius } from '../core/spatialhash.ts'
import { enemyAt } from '../data/enemies.ts'
import { IFRAME_SECONDS, PLAYER_HITBOX } from '../data/player.ts'
import { damageScale } from '../data/waves.ts'
import { minutes, type World } from '../core/world.ts'

export const STEP = 'collision'
export const WRITES: readonly string[] = ['player', 'contactDamage']

const IFRAME_TICKS = Math.round(IFRAME_SECONDS * 60)
/** The widest hitbox on the roster (§38.2's Brute at 14), so one query covers all. */
const MAX_ENEMY_HITBOX = 14

const scratch: number[] = []

export const step = (world: World): void => {
  const { enemies, player } = world
  if (player.iframes > 0) return

  const reach = PLAYER_HITBOX + MAX_ENEMY_HITBOX
  const found = queryRadius(world.hash, player.x, player.y, reach, scratch)
  let worst = 0
  for (let n = 0; n < found; n++) {
    const i = scratch[n] ?? -1
    const e = i < 0 ? undefined : enemies.items[i]
    if (e === undefined || e.hp <= 0) continue
    const def = enemyAt(e.kind)
    const dx = e.x - player.x
    const dy = e.y - player.y
    const r = PLAYER_HITBOX + def.hitbox
    if (dx * dx + dy * dy > r * r) continue
    if (def.contact > worst) worst = def.contact
  }
  if (worst <= 0) return

  const dealt = worst * damageScale(minutes(world))
  player.integrity -= dealt
  player.iframes = IFRAME_TICKS
  // §88.3's second fault-trace line: in a multiplicative game, WHICH AXIS failed you
  // is the only feedback that makes it learnable, and the board half of the trace is
  // silent about the hands. Accumulated from tick one so the report costs nothing.
  world.contactDamage += dealt
}
