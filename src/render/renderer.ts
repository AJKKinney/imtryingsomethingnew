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
import { ARC_HALF_ANGLE_COS, EMITTERS } from '../data/emitters.ts'
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
 * §46.2's firing signature, which was specified in pass 46 and never built.
 *
 * The bullet heaven rendered **no weapons at all**: the frame drew the substrate, the
 * enemies and the player, and Arc resolves instantly (§38.2) so a shot left nothing
 * behind for anything to draw. The simulation was firing three times a second and the
 * only visible consequence was an enemy that stopped existing.
 *
 * It is drawn as the **cone**, not as a beam to the target, because the cone is the
 * quantity that matters: §121.5 measured Arc's coverage at **0.17 of the circle**
 * against 1.00 for five of the roster, in the emitter that opens every run, and
 * §118.2 makes minutes 0-3 entirely Swarmers converging from every direction. A beam
 * would show that a shot happened; the cone shows what the weapon IS, which is the
 * half §33.3's DPS table cannot see and the reason that table was retired as a gate
 * (§89.3). It is also honest about the mechanic: everything caught in the wedge takes
 * the damage, so the picture and the predicate are the same object (§134.6).
 *
 * ONE path, so it costs one draw against §39.3's ceiling — and it fades rather than
 * flashes, because §12's reduce-flashing rule caps luminance deltas and is mandatory
 * to provide (§101.4), so the channel has to work for a player who has it on.
 */
/**
 * Ten ticks, not six, and the number is measured rather than chosen. Arc fires at
 * 3/s — one shot every 20 ticks at base rate — so a 6-tick flash leaves the weapon
 * dark for 70% of frames and reads as an occasional flicker rather than as fire.
 * At ten it covers half the cadence: the cone is present in roughly every other
 * frame under load, which is what makes §46.2's "distinct firing signature" a
 * signature. It stays a FADE rather than a strobe (§12's reduce-flashing rule), and
 * it is a RENDER constant — the simulation stamps `firedAt` and never reads this, so
 * §14's golden hash is untouched by it.
 */
export const ARC_FLASH_TICKS = 10
const CONE_SEGMENTS = 8

export const drawArcCone = (target: Surface, cam: Camera, world: World): void => {
  const age = world.tick - world.arc.firedAt
  if (world.arc.firedAt <= 0 || age < 0 || age >= ARC_FLASH_TICKS) return
  const { aimX, aimY } = world.arc
  if (aimX === 0 && aimY === 0) return

  const fade = 1 - age / ARC_FLASH_TICKS
  const [r, g, b] = [95, 242, 255]
  // Filled AND stroked, which is two draws on one path and the reason §46.2's
  // signature reads: the fill is what the eye catches in a frame already holding
  // hundreds of stroked silhouettes, and the edge is what makes the boundary exact
  // (§134.6 — the picture and the predicate are the same object). Both fade, and the
  // stroke thickens with the fade, so a fresh shot is a bright wedge that collapses
  // to a thin one rather than a strobe (§12's reduce-flashing rule).
  target.setFill(`rgba(${r}, ${g}, ${b}, ${(fade * 0.22).toFixed(3)})`)
  target.setStroke(`rgba(${r}, ${g}, ${b}, ${(fade * 0.95).toFixed(3)})`, 1 + fade * 2)

  const cx = screenX(cam, world.player.x)
  const cy = screenY(cam, world.player.y)
  const reach = EMITTERS.arc.range
  // Half the cone, from §14's own constant rather than from a second number: the
  // simulation tests `cos >= ARC_HALF_ANGLE_COS`, so the drawn edge is the same
  // boundary the damage volume uses and cannot drift from it.
  const half = Math.acos(ARC_HALF_ANGLE_COS)

  target.beginPath()
  target.moveTo(cx, cy)
  for (let i = 0; i <= CONE_SEGMENTS; i++) {
    const a = -half + (2 * half * i) / CONE_SEGMENTS
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    const dx = aimX * cos - aimY * sin
    const dy = aimX * sin + aimY * cos
    target.lineTo(cx + dx * reach, cy + dy * reach)
  }
  target.lineTo(cx, cy)
  target.fill()
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
  // Under the entities: §12's bold silhouettes stay the loudest thing on the screen,
  // and a wedge over the top of the crowd would hide what it is firing into.
  drawArcCone(target, cam, world)

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
    // §12 lists the feedback channel as damage numbers, hit flash and death particles,
    // and §109.4 rules out per-enemy health bars on the draw budget — so the flash is
    // the only thing telling a player their shot connected. It costs NO extra draw,
    // because it changes the stroke of a silhouette already being drawn.
    const hit = e.hurtAt > 0 && world.tick - e.hurtAt < ARC_FLASH_TICKS
    target.setStroke(hit ? '#ffffff' : enemyHue(e.kind), hit ? ENTITY_STROKE + 1 : ENTITY_STROKE)
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
