/**
 * §142.5 step 9 — enemy AI and movement.
 *
 * §37.1 was the most fundamental error the arithmetic passes found: every enemy in
 * the plan was slower than the player's 150 u/s, so the horde could never close and
 * the entire threat model was decorative. The Swarmer's 170 is the correction, and
 * it is why this step is direct pursuit rather than anything cleverer — a thing that
 * cannot be outrun does not need to be smart.
 *
 * §94.1 then rewrote §37.3's assertion as a CAPABILITY rather than a behaviour,
 * because an expert taking 0.69 contacts a minute was failing a test for playing
 * well. What must hold is that at least one enemy type CAN close on a player moving
 * at full speed in a straight line — which is a fact about this table, not this code.
 */
import { length } from '../core/fixedmath.ts'
import { enemyAt } from '../data/enemies.ts'
import { DT } from '../core/tick.ts'
import type { World } from '../core/world.ts'

export const STEP = 'enemyai'
export const WRITES: readonly string[] = ['enemies']


export const step = (world: World): void => {
  const { enemies, player } = world
  for (let i = 0; i < enemies.count; i++) {
    const e = enemies.items[i]
    if (e === undefined) continue
    const dx = player.x - e.x
    const dy = player.y - e.y
    const d = length(dx, dy)
    // A zero-length pursuit vector is a divide by zero, and it happens the instant
    // an enemy reaches the player — which is exactly when the crowd is thickest.
    if (d <= 0) continue
    const speed = enemyAt(e.kind).speed
    e.vx = (dx / d) * speed
    e.vy = (dy / d) * speed
    e.x += e.vx * DT
    e.y += e.vy * DT
  }
}
