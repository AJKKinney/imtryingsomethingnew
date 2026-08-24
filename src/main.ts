/**
 * MELTLINE — the web entry point, and the only file that touches a browser API.
 *
 * §14 puts the whole simulation on the other side of this boundary: the world is a
 * pure function of (seed, input log), the host writes `world.live` when a device
 * changes, and step 2 samples it once per tick. Nothing below reads a device, a
 * clock or a frame time, which is what makes a replay reproduce, a crash report
 * replayable, §63.5's sweeps seed-parallel and §124.5's par bit-identical everywhere.
 *
 * §139.2 is the bug that decides the funnel: browsers start an `AudioContext`
 * SUSPENDED until a genuine user gesture, so the cold open — whose escalation is half
 * audio — would have played silent in the demo. §64.3 turns the required keypress
 * into the ignition beat rather than a wall in front of it.
 */
import { advance, clock, resume } from './gen/loop.ts'
import { createWorld, type World } from './core/world.ts'
import { contentHash } from './core/content.ts'
import { copyWorld, restore, SNAPSHOT_VERSION } from './core/snapshot.ts'
import { canvas2d, type CanvasLike } from './render/canvas2d.ts'
import { buildAtlas, LABEL_SCALE } from './render/atlas.ts'
import { buildBezel, drawBezel, DECK_BEZEL_HEIGHT } from './render/bezel.ts'
import { camera } from './render/camera.ts'
import { PLAY_HEIGHT, PLAY_WIDTH } from './render/camera.ts'
import { renderFrame } from './render/renderer.ts'
import { BACKGROUND } from './gen/palette.ts'
import type { Surface } from './render/surface.ts'

declare const __MELTLINE_TARGET__: string

/** §148.4 — every flag is declared for every target and there is no default. */
export const target: string = __MELTLINE_TARGET__

/** §102.2 — labels are mine; every one of these is a noun naming a thing the player
 *  manipulates, and §102.6's provenance check fails the build on a string that is
 *  on neither this list nor the human-written one. */
const LABELS = ['INTEGRITY', 'NEXT', 'KILLS'] as const

const offscreen = (width: number, height: number): Surface => {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return canvas2d(c as unknown as CanvasLike, 'rgba(0,0,0,0)')
}

const boot = (): void => {
  const element = document.getElementById('stage')
  if (!(element instanceof HTMLCanvasElement)) return

  const height = PLAY_HEIGHT + DECK_BEZEL_HEIGHT
  element.width = PLAY_WIDTH
  element.height = height
  const stage = canvas2d(element as unknown as CanvasLike, BACKGROUND)

  const atlas = buildAtlas(offscreen, [...LABELS])
  const bezel = buildBezel(offscreen, atlas, DECK_BEZEL_HEIGHT)
  const cam = camera()
  const c = clock()
  const hash = contentHash()

  // §9 — an EXACT world snapshot on pause, suspend or quit, and §106.2 makes it
  // local-only: 220 KB against 16 KB for everything else the game persists, rewritten
  // on every suspend, and nobody resumes a mid-run on another device.
  const SLOT = 'meltline.snapshot'
  const world = ((): World => {
    try {
      const saved = window.localStorage.getItem(SLOT)
      if (saved === null) return createWorld(1)
      const parsed = JSON.parse(saved) as { version: number; contentHash: string; world: World }
      const result = restore(parsed, hash)
      // §66.2 — reject, never clamp. A snapshot from a build with different numbers
      // is refused and the run starts fresh, rather than resuming into a world that
      // differs from the saved one deterministically and forever.
      if (!result.ok) return createWorld(1)
      return result.world
    } catch {
      return createWorld(1)
    }
  })()

  const save = (): void => {
    try {
      window.localStorage.setItem(SLOT, JSON.stringify({
        version: SNAPSHOT_VERSION, contentHash: hash, world: copyWorld(world),
      }))
    } catch {
      // A full or disabled store is not a reason to interrupt a run.
    }
  }

  // The host writes intent; step 2 records it. A key held down is a state the
  // simulation samples, and a dash is an EDGE the simulation consumes (§142.5).
  const held = new Set<string>()
  const axis = (neg: string, pos: string): number =>
    (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0)
  const sync = (): void => {
    world.live.moveX = axis('KeyA', 'KeyD') + axis('ArrowLeft', 'ArrowRight')
    world.live.moveY = axis('KeyW', 'KeyS') + axis('ArrowUp', 'ArrowDown')
  }
  window.addEventListener('keydown', (e) => {
    held.add(e.code)
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') world.live.dash = true
    sync()
  })
  window.addEventListener('keyup', (e) => { held.delete(e.code); sync() })
  // §9 — handhelds get their lids closed constantly. The clamp is in `advance`;
  // this is what stops the accumulator being handed a minute of wall clock.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      c.accumulator = 0
      save()
    }
  })
  window.addEventListener('pagehide', save)
  // Any input leaves §9's auto-pause. The accumulator is already empty, so nothing
  // catches up — §3.B: fast-forwarding through a lid-close is a death nobody saw.
  window.addEventListener('keydown', () => { if (world.paused) resume(c, world) })

  let last = 0
  const frame = (now: number): void => {
    const dt = last === 0 ? 0 : now - last
    last = now
    advance(c, world, dt)
    renderFrame(stage, cam, world)
    drawBezel(stage, atlas, bezel, world)
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

if (typeof document !== 'undefined') boot()

export { LABEL_SCALE }
