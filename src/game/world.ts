/**
 * §142.5 step 19 — deaths and pool returns.
 *
 * Two rules meet here and only one of them is obvious.
 *
 * The first is reaping: an enemy at or below zero integrity returns to the pool.
 *
 * The second is §9's despawn, and §31.2 makes it load-bearing rather than
 * housekeeping: enemies beyond 1.5x the camera radius vanish **granting nothing**,
 * so the DPS the game requires is set by SURVIVAL PRESSURE — what reaches you —
 * rather than by the 1,564,312 HP the director spawns. A player who believes they
 * must kill everything is playing a harder game than the one that exists, which is
 * why §109.4 made the despawn VISIBLE: it is a rule, and §4's standing position is
 * transparent rules and opaque combinations. The adverb in §9's original
 * "vanish silently" was describing an implementation and became a design statement
 * by sitting in a table for a hundred sections.
 */
import { despawn } from '../core/pool.ts'
import { distanceSquared } from '../core/fixedmath.ts'
import { DESPAWN_RADIUS } from '../data/waves.ts'
import type { World } from '../core/world.ts'

export const STEP = 'deaths'
export const WRITES: readonly string[] = ['enemies', 'kills', 'over']

const DESPAWN_R2 = DESPAWN_RADIUS * DESPAWN_RADIUS

export const step = (world: World): void => {
  const { enemies, player } = world
  // Backwards, because `despawn` swaps the last item into the hole (§30's dense
  // arrays): forwards would skip whatever the swap moved into the index just read.
  for (let i = enemies.count - 1; i >= 0; i--) {
    const e = enemies.items[i]
    if (e === undefined) continue
    if (e.hp <= 0) {
      world.kills += 1
      despawn(enemies, i)
      continue
    }
    if (distanceSquared(e.x, e.y, player.x, player.y) > DESPAWN_R2) {
      // Grants nothing: no XP, no salvage, no kill. §31.2 is the whole reason the
      // required-DPS curve is survivable at all.
      despawn(enemies, i)
    }
  }

  // §9 — no revives in v0.1. The run ending is what makes §7's unstable salvage a
  // stake and §67.3's fault trace a verdict worth reading.
  if (player.integrity <= 0) world.over = true
}
