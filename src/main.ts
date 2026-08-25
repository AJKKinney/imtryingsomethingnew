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
import { DT, MAX_CATCHUP_TICKS, TICK_MS } from './core/tick.ts'
import { canvas2d, type CanvasLike } from './render/canvas2d.ts'
import { buildAtlas, LABEL_SCALE } from './render/atlas.ts'
import { buildBezel, drawBezel, DECK_BEZEL_HEIGHT } from './render/bezel.ts'
import { camera } from './render/camera.ts'
import { PLAY_HEIGHT, PLAY_WIDTH } from './render/camera.ts'
import { renderFrame } from './render/renderer.ts'
import { BACKGROUND } from './gen/palette.ts'
import { BOARD_TILE } from './render/bezel.ts'
import { drawBoard, frameOf, type BoardView } from './render/boardview.ts'
import {
  apply, createPrototype, drawPrototype, engagementOf, tick as tickBoard, type Command,
} from './ui/prototype.ts'
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

  // §82.2 — ONE board, two tabs. The RUN tab and the WORKBENCH tab share this
  // object, so the difference between them is not the machine but WHAT DRIVES ITS
  // ENGAGEMENT: the crowd, or your hand. That is the whole demonstration §51.2 is
  // owed — heat tracks the war rather than the layout — and it costs a tab rather
  // than a second prototype.
  const proto = createPrototype()

  // §85.3's two levels of detail. The bezel view is a STATUS LIGHT — fill, region
  // heat and trace width, at §83.2's measured 72x72 — and the `TAB` view is an
  // INSTRUMENT. A 14.4 px cell cannot carry a glyph, and that is the right division
  // rather than a compromise.
  const bezelBoard: BoardView = {
    x: PLAY_WIDTH - BOARD_TILE - 8, y: PLAY_HEIGHT + 4, cell: BOARD_TILE / 5, detail: 'bezel',
  }
  const workbench = {
    // Centred vertically in the play area, with §69.3's panel beside it rather than
    // under it: the board and its numbers are read together, and a panel below the
    // fold would be the eight-quantities problem solved and then hidden.
    view: { x: 48, y: 84, cell: 52, detail: 'full' } as BoardView,
    panelX: 344, panelY: 108, scale: LABEL_SCALE,
  }

  let tab: 'run' | 'workbench' = 'run'
  const tabs: readonly [string, 'run' | 'workbench'][] = [
    ['tab-run', 'run'], ['tab-workbench', 'workbench'],
  ]
  const showTab = (next: 'run' | 'workbench'): void => {
    tab = next
    // §121.4 — a board OPEN is a board decision. §2.4's floor counted opens alone and,
    // multiplied against §9's 12-second ceiling, made the plan's stated success for
    // its own differentiator 2.9% of a run; the gate now counts decisions.
    if (next === 'workbench') proto.decisions++
    for (const [id, which] of tabs) {
      document.getElementById(id)?.setAttribute('aria-selected', String(which === next))
    }
  }
  for (const [id, which] of tabs) {
    document.getElementById(id)?.addEventListener('click', () => showTab(which))
  }

  /**
   * §12's board bindings, and §3.G's snapping cell cursor.
   *
   * §101.3's grid-cursor idiom is one of exactly three, and no screen may invent a
   * fourth — which is what makes gamepad completeness a property of the CONSTRUCTION
   * rather than a test result, in a project whose primary venue is judged on it.
   */
  const BOARD_KEYS: Readonly<Record<string, Command>> = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    Enter: 'confirm', Space: 'confirm', KeyR: 'rotate', Backspace: 'scrap',
    Escape: 'cancel', KeyQ: 'prevPart', KeyE: 'nextPart',
    BracketRight: 'hotter', BracketLeft: 'cooler',
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Tab') {
      // §9 — `TAB` opens the board, at 20% time, never paused. Here it is the tab it
      // will become, so the binding a playtester learns at the gate is the one that
      // survives into the game.
      e.preventDefault()
      showTab(tab === 'run' ? 'workbench' : 'run')
      return
    }
    if (tab !== 'workbench') return
    const command = BOARD_KEYS[e.code]
    if (command !== undefined) { e.preventDefault(); apply(proto, command) }
  })

  /**
   * The gamepad cursor — §81.2 lists it among the ten things the gate NEEDS, because
   * §82.1's fourth criterion is that every cell and rotation be reachable on a pad
   * without frustration, and §3 makes the handheld the primary venue.
   *
   * Read as EDGES rather than as states: a held stick is one move, not sixty. A
   * repeat would make §121.4's decision count a function of how long a thumb rested.
   */
  const GAMEPAD: readonly (readonly [number, Command])[] = [
    [12, 'up'], [13, 'down'], [14, 'left'], [15, 'right'],
    [0, 'confirm'], [1, 'cancel'], [2, 'rotate'], [3, 'scrap'],
    [4, 'prevPart'], [5, 'nextPart'], [6, 'cooler'], [7, 'hotter'],
    [9, 'nextPart'],
  ]
  const wasPressed = new Set<number>()
  const pollPad = (): void => {
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : []
    const pad = [...pads].find((g) => g !== null)
    if (pad === undefined || pad === null) return
    for (const [button, command] of GAMEPAD) {
      const down = pad.buttons[button]?.pressed === true
      if (down && !wasPressed.has(button)) {
        wasPressed.add(button)
        if (tab === 'workbench') apply(proto, command)
        else if (command === 'nextPart') showTab('workbench')
      } else if (!down) wasPressed.delete(button)
    }
    // The stick, quantised to the same four commands. §3.G's cursor SNAPS: an analog
    // axis that moved a cursor continuously would be a fourth idiom.
    const [ax = 0, ay = 0] = [pad.axes[0] ?? 0, pad.axes[1] ?? 0]
    const dead = 0.6
    const stick: readonly (readonly [boolean, Command, number])[] = [
      [ax < -dead, 'left', 100], [ax > dead, 'right', 101],
      [ay < -dead, 'up', 102], [ay > dead, 'down', 103],
    ]
    for (const [active, command, slot] of stick) {
      if (active && !wasPressed.has(slot)) {
        wasPressed.add(slot)
        if (tab === 'workbench') apply(proto, command)
      } else if (!active) wasPressed.delete(slot)
    }
  }

  // §142.4 — the board prototype has no world, so it carries its own accumulator on
  // the same rule: the time-scale is a TICK GATE and the step never varies.
  //
  // And it runs at REAL TIME rather than at §9's 20%, which is not an exception to
  // that rule but the scope of it. Twenty percent exists so that opening the board
  // inside a run costs something — enemies keep moving — and §99.3 already makes it a
  // SETTING rather than a constant. There is no run here to slow it against, and at
  // 0.2 the heat model's 1.5-second time constant becomes seven and a half seconds of
  // wall clock, so settling takes twenty: the instrument §81.3 built to show a
  // placement's whole thermal range in ten seconds would take longer than the run it
  // stands in for.
  const BOARD_SCALE = 1
  let boardAccumulator = 0

  let last = 0
  const frame = (now: number): void => {
    const dt = last === 0 ? 0 : now - last
    last = now
    pollPad()
    if (tab === 'run') {
      const ran = advance(c, world, dt)
      if (ran > 0) {
        // §51.2's work term is a FIELD quantity, so the crowd sets the board's heat
        // and the player's position sets the crowd (§108.5: position is a thermostat).
        proto.engagement = engagementOf(world)
        tickBoard(proto, ran * DT)
      }
      renderFrame(stage, cam, world)
      drawBezel(stage, atlas, bezel, world)
      drawBoard(stage, proto.board, bezelBoard, frameOf(proto.board))
    } else {
      const interval = TICK_MS / BOARD_SCALE
      boardAccumulator += dt >= 1000 ? 0 : dt
      let ran = 0
      while (boardAccumulator >= interval && ran < MAX_CATCHUP_TICKS) {
        boardAccumulator -= interval
        tickBoard(proto, DT)
        ran++
      }
      if (boardAccumulator >= interval) boardAccumulator = 0
      drawPrototype(stage, atlas, proto, workbench)
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

if (typeof document !== 'undefined') boot()

export { LABEL_SCALE }
