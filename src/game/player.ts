/**
 * §142.5 step 6 — movement and dash resolution.
 *
 * Two real-time verbs, and §111.1 counted them deliberately: move and vent-dash.
 * §68 positions this as a build-craft puzzle WITH real-time pressure, so the field
 * layer is pressure and the board layer is depth — and §88.2 then measured the two
 * as multiplicative rather than additive, which is what makes two verbs sufficient.
 *
 * The dash runs before this tick's heat generation (§142.5), because §111.2's vent
 * writes into the per-cell store and a vent applied after generation would be a
 * vent the crowd had already outrun. There is no store yet — the board arrives at
 * commit 10 — so the vent is the one half of this step that is not here.
 */
import { length } from '../core/fixedmath.ts'
import {
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  PLAYER_SPEED,
} from '../data/player.ts'
import { DT } from '../core/tick.ts'
import type { World } from '../core/world.ts'

export const STEP = 'player'
export const WRITES: readonly string[] = ['player']

const DASH_TICKS = Math.round(DASH_DURATION * 60)
const COOLDOWN_TICKS = Math.round(DASH_COOLDOWN * 60)

export const step = (world: World): void => {
  const { player, input } = world

  // Normalise here rather than trusting the host: a device that reports 1.0 on both
  // axes would otherwise buy 41% more speed diagonally, which is the oldest bug in
  // the genre and is a determinism hazard besides — the same input log would mean
  // different things on a stick and on a keyboard.
  const mag = length(input.moveX, input.moveY)
  const dirX = mag > 1 ? input.moveX / mag : input.moveX
  const dirY = mag > 1 ? input.moveY / mag : input.moveY
  const moving = mag > 0

  if (moving) {
    player.facingX = input.moveX / mag
    player.facingY = input.moveY / mag
  }

  // §9 — i-frames throughout the dash, and the dash is a state rather than an
  // impulse, so a player mid-dash is committed to the direction they chose. That
  // commitment is the whole skill: §110.3's derelict channel and §122.5's climax
  // are both priced against a dash you cannot take back.
  if (player.dashTicks <= 0 && input.dash && player.dashCooldown <= 0) {
    player.dashTicks = DASH_TICKS
    player.dashCooldown = COOLDOWN_TICKS
    player.vx = player.facingX * DASH_SPEED
    player.vy = player.facingY * DASH_SPEED
    // §95.2's -5 region heat lands here, once commit 10's board has a store to
    // distribute it across (§111.2: Delta over the block, in proportion to current
    // heat, so a neighbour moves by Delta x shared / 9).
  } else if (player.dashTicks <= 0) {
    player.vx = dirX * PLAYER_SPEED
    player.vy = dirY * PLAYER_SPEED
  }

  player.x += player.vx * DT
  player.y += player.vy * DT

  if (player.dashTicks > 0) {
    player.dashTicks -= 1
    player.iframes = player.iframes > player.dashTicks ? player.iframes : player.dashTicks
  }
  if (player.dashCooldown > 0) player.dashCooldown -= 1
  if (player.iframes > 0) player.iframes -= 1
}
