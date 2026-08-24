/**
 * §142.5 step 11 — soft repulsion, capped at 8 neighbours per enemy per tick.
 *
 * §40.1 measured this as the largest single cost in the simulation — 570 enemies
 * against 8 neighbour checks each — which is why the cap lives inside
 * `queryCapped` rather than at this call site: no caller can forget it in the one
 * frame where 624 enemies overlap.
 *
 * It runs AFTER the hash is rebuilt at step 10 and after movement at step 9, so
 * separation reads positions the crowd has already reached rather than the ones it
 * had last tick. That ordering is the difference between a crowd that flows around
 * the player and one that oscillates, and it is the manifest's to state (§26).
 *
 * A step is one module (§142.5): the order and the id are fixed, and the file a step
 * lives in is not part of the order — which is why this is not inside `enemies.ts`.
 */
import { queryCapped } from '../core/spatialhash.ts'
import { enemyAt } from '../data/enemies.ts'
import { DT } from '../core/tick.ts'
import type { World } from '../core/world.ts'

export const STEP = 'separation'
export const WRITES: readonly string[] = ['enemies']

/** §17 — 8 per enemy per tick. The cap is what keeps the cost linear in a crush. */
export const MAX_NEIGHBOURS = 8
/** How hard a pair pushes apart, in units per second at full overlap. Soft, because
 *  §37's threat is a wall of bodies: separation that resolved overlap completely
 *  would space the horde out and undo the encirclement it exists to make legible. */
export const SEPARATION_STRENGTH = 60

const scratch: number[] = []

export const step = (world: World): void => {
  const { enemies, hash } = world
  for (let i = 0; i < enemies.count; i++) {
    const e = enemies.items[i]
    if (e === undefined) continue
    const radius = enemyAt(e.kind).hitbox * 2
    const found = queryCapped(hash, e.x, e.y, radius, MAX_NEIGHBOURS, scratch)
    let pushX = 0
    let pushY = 0
    for (let n = 0; n < found; n++) {
      const j = scratch[n] ?? -1
      if (j === i || j < 0) continue
      const other = enemies.items[j]
      if (other === undefined) continue
      const dx = e.x - other.x
      const dy = e.y - other.y
      const d2 = dx * dx + dy * dy
      if (d2 <= 0) continue
      const d = Math.sqrt(d2)
      // Linear falloff to zero at the radius, so a pair that is barely touching
      // barely pushes. A constant push would make the crowd jitter at rest.
      const strength = (radius - d) / radius
      if (strength <= 0) continue
      pushX += (dx / d) * strength
      pushY += (dy / d) * strength
    }
    // Applied in place, so enemy i moves before enemy j reads it. Asymmetric and
    // deterministic — the pool's order is stable (§30) — and it converges in one
    // pass where a double-buffered version would need two and a second array.
    e.x += pushX * SEPARATION_STRENGTH * DT
    e.y += pushY * SEPARATION_STRENGTH * DT
  }
}
