/**
 * The frame: a fixed 640x360 play area, and the machine bezel in whatever is left.
 *
 * §145.4 makes `render/` a module that READS A SNAPSHOT AND NEVER WRITES — §14 said
 * it in one line ("rendering may use whatever it likes, it never feeds back into the
 * sim") and nothing enforced it until `tools/deps.ts`. Every argument here is
 * readonly for that reason, and it is what lets §40.3's sweeps run headless at
 * thousands of times real speed, which is in turn what makes §63.5's sharding free.
 *
 * §46.5 moved friend/foe language into phase 1 rather than phase 4, because a build
 * that cannot distinguish your shots from theirs produces feedback about the wrong
 * thing entirely. That is the whole content of this file at commit 7.
 */
import { CORRUPTION, PLAYER, SUBSTRATE, enemyHue } from '../gen/palette.ts'
import { silhouette, type Silhouette } from '../gen/shapes.ts'
import { enemyAt } from '../data/enemies.ts'
import { PLAYER_HITBOX } from '../data/player.ts'
import { PLAY_HEIGHT, PLAY_WIDTH, follow, screenX, screenY, type Camera } from './camera.ts'
import type { Surface } from './surface.ts'
import type { World } from '../core/world.ts'

/** §12 — the substrate's dormant traces light faintly under the core (§134.5). */
export const SUBSTRATE_SPACING = 64
export const TRACE_LIGHT_RADIUS = 180

/** §12 — thick traces, bold silhouettes. A stroke, not a hairline. */
export const ENTITY_STROKE = 2
export const PLAYER_STROKE = 3

/**
 * Silhouettes are a pure function of the entity's identity (§15), so they are cached
 * by that identity rather than stored per entity — one shape per enemy KIND at
 * commit 7, and per (kind, variant) once §132.2's elites arrive.
 */
const shapes = new Map<number, Silhouette>()

const shapeFor = (kind: number, friendly: boolean): Silhouette => {
  const cacheKey = friendly ? -1 : kind
  const hit = shapes.get(cacheKey)
  if (hit !== undefined) return hit
  // The seed is the identity, so the same kind draws the same silhouette in every
  // run, on every machine, forever — which is what makes an enemy recognisable.
  const made = silhouette(friendly ? 0x5eed : 0x100 + kind, friendly)
  shapes.set(cacheKey, made)
  return made
}

const strokeSilhouette = (
  target: Surface,
  shape: Silhouette,
  cx: number,
  cy: number,
  radius: number,
): void => {
  // One stroked path per entity, never one per segment: §39.2 measured per-segment
  // trails on projectiles alone at ~2,450 draws against ~306 for a path each.
  target.beginPath()
  const n = shape.points.length / 2
  for (let i = 0; i < n; i++) {
    const x = cx + (shape.points[i * 2] ?? 0) * radius
    const y = cy + (shape.points[i * 2 + 1] ?? 0) * radius
    if (i === 0) target.moveTo(x, y)
    else target.lineTo(x, y)
  }
  // §46.2 — CLOSED for your machine, OPEN for the corruption. The faction is the
  // form, so the read survives total colour loss.
  if (shape.closed) {
    target.lineTo(cx + (shape.points[0] ?? 0) * radius, cy + (shape.points[1] ?? 0) * radius)
  }
  target.stroke()
}

/** The dotted circuit substrate — §46.2's "the world is the same kind of thing as
 *  your board", and the reason §4.4's reveal is pre-figured in every frame. */
const drawSubstrate = (target: Surface, cam: Camera): void => {
  target.setStroke(SUBSTRATE, 1)
  target.beginPath()
  const x0 = Math.floor((cam.x - PLAY_WIDTH / 2) / SUBSTRATE_SPACING) * SUBSTRATE_SPACING
  const y0 = Math.floor((cam.y - PLAY_HEIGHT / 2) / SUBSTRATE_SPACING) * SUBSTRATE_SPACING
  for (let x = x0; x < cam.x + PLAY_WIDTH; x += SUBSTRATE_SPACING) {
    const sx = screenX(cam, x)
    target.moveTo(sx, 0)
    target.lineTo(sx, PLAY_HEIGHT)
  }
  for (let y = y0; y < cam.y + PLAY_HEIGHT; y += SUBSTRATE_SPACING) {
    const sy = screenY(cam, y)
    target.moveTo(0, sy)
    target.lineTo(PLAY_WIDTH, sy)
  }
  // The whole grid is ONE path and therefore one draw, which is the difference
  // between a background that costs 20 calls and one that costs 1.
  target.stroke()
}

/**
 * Draw one frame. Returns the draw count, so §39.3's ceiling is measured by the test
 * that renders rather than asserted by the document that budgets.
 */
export const renderFrame = (target: Surface, cam: Camera, world: World): number => {
  target.resetDraws()
  target.clear()
  follow(cam, world.player.x, world.player.y, world.player.vx, world.player.vy)
  drawSubstrate(target, cam)

  const { enemies } = world
  for (let i = 0; i < enemies.count; i++) {
    const e = enemies.items[i]
    if (e === undefined) continue
    const sx = screenX(cam, e.x)
    const sy = screenY(cam, e.y)
    // Culled against the play area rather than the despawn radius: §31.2's rule is a
    // simulation rule and this is a rendering one, and conflating them is how a
    // budget stops describing the frame.
    if (sx < -32 || sy < -32 || sx > PLAY_WIDTH + 32 || sy > PLAY_HEIGHT + 32) continue
    target.setStroke(enemyHue(e.kind), ENTITY_STROKE)
    strokeSilhouette(target, shapeFor(e.kind, false), sx, sy, enemyAt(e.kind).hitbox)
  }

  // The player last, so nothing in the crush can hide them — the one entity whose
  // position the player must never lose, in a game about being surrounded.
  const px = screenX(cam, world.player.x)
  const py = screenY(cam, world.player.y)
  // §9 — i-frames are a visible state, not a hidden one. Drawn as the core's own
  // hue lifted to white rather than as a flash, because §12's reduce-flashing rule
  // caps luminance deltas and a player who needs that setting still needs to know.
  target.setStroke(world.player.iframes > 0 ? '#ffffff' : PLAYER, PLAYER_STROKE)
  strokeSilhouette(target, shapeFor(0, true), px, py, PLAYER_HITBOX * 1.5)

  return target.draws
}

/** Kept exported so a test can assert the faction palettes never converge (§46.2). */
export const FACTION_HUES = { friendly: PLAYER, corruption: CORRUPTION } as const
