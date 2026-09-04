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

/**
 * How long the host waits for `requestAnimationFrame` before driving the loop from a
 * timer instead. One second is long enough that no browser doing ordinary work is
 * mistaken for a frame that is never rendered, and short enough that a viewer who
 * opens the page in a collapsed panel does not sit in front of a dark board.
 */
const RAF_GRACE_MS = 1000

/**
 * The keyboard, as an EDGE detector rather than a state — which is what §142.5's step
 * 2 already assumes and what the host was not delivering.
 *
 * A held key auto-repeats: the OS re-fires `keydown` about thirty times a second after
 * a half-second delay, and the host wrote `world.live.dash = true` on every one of
 * them. §142.5's step 2 consumes the bit and clears it, so no dash was ever queued —
 * but the bit was true again before the next tick, so the instant §95.2's cooldown
 * expired a dash fired on its own. **Holding Shift dashed on cooldown, for ever**,
 * which is precisely the behaviour §95.2 repriced the verb from 3 s to 5 s to remove:
 * that pass measured dash-on-cooldown as strictly optimal and made it a decision, and
 * a key held down handed the optimal line back for free. The same event drives §9's
 * leave-the-pause and the run-over restart, so auto-repeat also rebuilt the world
 * thirty times a second while any key was held on the death screen.
 *
 * `clear` is not tidiness. A browser does not deliver `keyup` for keys that were down
 * when the window lost focus, so without it an alt-tab mid-run leaves the player
 * walking in a direction nobody is pressing — and, since a key already down is not a
 * press, leaves the dash dead until that key is tapped again. §9 auto-pauses on
 * visibility loss and §3 makes the lid-close the primary venue's normal case, so this
 * is the ordinary path rather than the edge.
 */
export interface Keyboard {
  /** Records the key as held, and reports whether this event was a PRESS. */
  readonly down: (code: string, repeat: boolean) => boolean
  readonly up: (code: string) => void
  /** Every key released at once — what a blur is, since no keyup arrives for it. */
  readonly clear: () => void
  readonly axis: (neg: string, pos: string) => number
}

export const keyboard = (): Keyboard => {
  const held = new Set<string>()
  return {
    // A press is `!repeat` and nothing else. Asking the held set instead would be a
    // second, stricter definition — and a stricter one is worse here, because a key
    // that is stuck in the set (a keyup a blur never delivered) would then be a key
    // that can never be pressed again. `repeat` is a property of the EVENT, so every
    // listener that reads it agrees without depending on the order they were added in.
    down: (code, repeat) => {
      held.add(code)
      return !repeat
    },
    up: (code) => { held.delete(code) },
    clear: () => { held.clear() },
    axis: (neg, pos) => (held.has(pos) ? 1 : 0) - (held.has(neg) ? 1 : 0),
  }
}

/**
 * PRESENCE IS NOT PERMISSION, and this is the bug that made the first playable link a
 * black rectangle. `navigator.getGamepads` exists on every modern browser, so a `typeof`
 * check passes — and inside a frame whose permissions policy withholds the `gamepad`
 * feature, CALLING it throws a SecurityError. The pad poll runs first in every frame, so
 * the very first frame threw, nothing was ever drawn, and an untouched canvas is
 * transparent: the page's own dark ground showed through and read as a game that
 * rendered nothing. It reproduced nowhere, because a top-level document has no policy
 * withholding anything.
 *
 * A policy denial cannot be revoked within a document, so the host asks ONCE and then
 * stops asking rather than throwing sixty times a second. §3 keeps the handheld as the
 * primary venue and §82.1's fourth gate criterion is untouched — a pad works wherever
 * the host permits one, and where it does not the keyboard is the whole interface,
 * rather than the whole page being lost to a device nobody plugged in.
 */
export const guardedPads = (
  read: (() => readonly (Gamepad | null)[]) | undefined,
): (() => readonly (Gamepad | null)[]) => {
  let allowed = read !== undefined
  return () => {
    if (!allowed || read === undefined) return []
    try {
      return read()
    } catch {
      allowed = false
      return []
    }
  }
}

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
  const newWorld = (): World => createWorld(1)
  let world = ((): World => {
    try {
      const saved = window.localStorage.getItem(SLOT)
      if (saved === null) return newWorld()
      const parsed = JSON.parse(saved) as { version: number; contentHash: string; world: World }
      const result = restore(parsed, hash)
      // §66.2 — reject, never clamp. A snapshot from a build with different numbers
      // is refused and the run starts fresh, rather than resuming into a world that
      // differs from the saved one deterministically and forever.
      if (!result.ok) return newWorld()
      return result.world
    } catch {
      return newWorld()
    }
  })()

  const save = (): void => {
    try {
      // §9 — a finished run is not a resumable one. Persisting it meant the FIRST
      // death poisoned the link permanently: the next visit restored a world already
      // over, and with nothing gating the tick that world kept running to -1,160
      // integrity. A dead run clears the slot instead, so a reload is a fresh start.
      if (world.over) { window.localStorage.removeItem(SLOT); return }
      window.localStorage.setItem(SLOT, JSON.stringify({
        version: SNAPSHOT_VERSION, contentHash: hash, world: copyWorld(world),
      }))
    } catch {
      // A full or disabled store is not a reason to interrupt a run.
    }
  }

  /**
   * §9 — no revives, so the only way out of a finished run is a new one.
   *
   * The world is replaced rather than reset in place, because §14 makes a run a pure
   * function of (seed, input log) and a world mutated back toward its start is
   * neither: it is a world with a history the log does not contain. Everything that
   * reads `world` reads the binding, so the swap is the whole mechanism.
   */
  const restart = (): void => {
    world = newWorld()
    c.accumulator = 0
    try { window.localStorage.removeItem(SLOT) } catch { /* nothing to clear */ }
  }

  // The host writes intent; step 2 records it. A key held down is a state the
  // simulation samples, and a dash is an EDGE the simulation consumes (§142.5) — so
  // the host has to tell the two apart, which is what `keyboard` is for.
  const keys = keyboard()
  const sync = (): void => {
    world.live.moveX = keys.axis('KeyA', 'KeyD') + keys.axis('ArrowLeft', 'ArrowRight')
    world.live.moveY = keys.axis('KeyW', 'KeyS') + keys.axis('ArrowUp', 'ArrowDown')
  }
  // One listener for the two things a press does to a RUN — the dash edge, and leaving
  // whatever state the run is in. §12's board bindings are a third consumer of the same
  // event and guard themselves the same way, on `e.repeat`.
  window.addEventListener('keydown', (e) => {
    const press = keys.down(e.code, e.repeat)
    sync()
    if (!press) return
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') world.live.dash = true
    // Any press leaves §9's auto-pause. The accumulator is already empty, so nothing
    // catches up — §3.B: fast-forwarding through a lid-close is a death nobody saw.
    if (world.over) { restart(); return }
    if (world.paused) resume(c, world)
  })
  window.addEventListener('keyup', (e) => { keys.up(e.code); sync() })
  // A blur delivers no keyup for whatever was down, so the keys are released here.
  window.addEventListener('blur', () => { keys.clear(); sync() })
  // §9 — handhelds get their lids closed constantly. The clamp is in `advance`;
  // this is what stops the accumulator being handed a minute of wall clock.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      c.accumulator = 0
      save()
    }
  })
  window.addEventListener('pagehide', save)

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
    view: { x: 40, y: 56, cell: 52, detail: 'full' } as BoardView,
    panelX: 320, panelY: 118, scale: LABEL_SCALE,
  }

  /**
   * WORKBENCH opens, not RUN — reversed after the first gate, and the reason is the
   * finding rather than a preference. §85.3 renders the board in the bezel as a
   * 72x72 STATUS LIGHT and in the `TAB` view as an INSTRUMENT, deliberately: three
   * channels at a glance against seven on demand. Opening on RUN therefore showed a
   * first-time player the *least* legible view of the one thing the prototype exists
   * to test, with combat on top of it — and §9's gate asks whether the board is a
   * tool or a chore, which cannot be answered by someone who never saw it at full
   * size. The link opens on the instrument; the fight is one key away.
   */
  let tab: 'run' | 'workbench' = 'workbench'
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
    // §101.3's grid-cursor idiom is shared with the pad, and the pad below already
    // reads EDGES — *"a held stick is one move, not sixty. A repeat would make
    // §121.4's decision count a function of how long a thumb rested."* The keyboard
    // had exactly that defect ten lines above the sentence describing it: holding
    // Enter placed, picked up and re-placed thirty times a second, and every one of
    // those counted toward the number §9's gate is scored on.
    if (e.repeat) return
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

  /**
   * PRESENCE IS NOT PERMISSION, and this is the bug that made the first playable link
   * a black rectangle for four days. `navigator.getGamepads` exists on every modern
   * browser, so a `typeof` check passes — and inside a frame whose permissions policy
   * withholds the `gamepad` feature, CALLING it throws a SecurityError. `pollPad` runs
   * first in every frame, so the very first frame threw, nothing was ever drawn, and an
   * untouched canvas is transparent: the page's own dark ground showed through and read
   * as a game that rendered nothing. It reproduced nowhere, because a top-level document
   * has no policy withholding anything.
   *
   * A policy denial cannot change within a document, so the host asks once and then stops
   * asking rather than throwing sixty times a second. §3 keeps the handheld as the primary
   * venue and §82.1's fourth gate criterion still stands — a pad works wherever the host
   * permits one, and where it does not, the keyboard is the whole interface rather than
   * the whole page being lost.
   */
  const readPads = guardedPads(
    typeof navigator.getGamepads === 'function' ? () => navigator.getGamepads() : undefined,
  )

  const pollPad = (): void => {
    const pads = readPads()
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
  }

  /**
   * §3.B's sibling, and the bug that ate the first playable link: an embedded frame
   * the browser is not rendering never runs `requestAnimationFrame`, so a board whose
   * FIRST paint waits on rAF is a black rectangle in every viewer that starts the page
   * offscreen — the HTML chrome around it renders, the canvas is never touched, and an
   * untouched canvas is transparent. Nothing throws and nothing logs, which is why it
   * reproduced nowhere: a top-level document always animates.
   *
   * So the first frame is drawn synchronously, before any scheduler exists, and the
   * timer stands BEHIND rAF rather than beside it — it starts only if rAF has not
   * fired, and stands down the tick it does, so the two can never both advance the
   * clock. Both drive the same `frame`, and `frame` is the only thing that does.
   *
   * §14 is untouched: this is the host choosing when to call, and `dt` is still an
   * input the host writes rather than a clock the simulation reads.
   */
  let pumped = false
  let fallback = 0

  const animate = (now: number): void => {
    if (fallback !== 0) {
      window.clearInterval(fallback)
      fallback = 0
    }
    pumped = true
    frame(now)
    requestAnimationFrame(animate)
  }

  frame(0)
  requestAnimationFrame(animate)

  window.setTimeout(() => {
    if (pumped) return
    fallback = window.setInterval(() => {
      frame(performance.now())
    }, TICK_MS)
  }, RAF_GRACE_MS)
}

/**
 * §16's boundary, arriving at its first commit rather than its scheduled one. An
 * uncaught exception here is the whole game, and the browser reports it to a console
 * the player cannot open — so the host records what was thrown where a page can read
 * it back, and rethrows, because swallowing it would trade a legible failure for a
 * silent one. The non-Error branch is not defensive padding: a thrown value that is
 * not an Error reaches `window.onerror` with an EMPTY message, which is a failure
 * report that says nothing at all.
 */
if (typeof document !== 'undefined') {
  try {
    boot()
  } catch (error) {
    const host = window as unknown as { __meltlineFault?: string }
    host.__meltlineFault = error instanceof Error
      ? `${error.name}: ${error.message}\n${error.stack ?? '(no stack)'}`
      : `non-Error thrown: ${Object.prototype.toString.call(error)} ${String(error)}`
    throw error
  }
}

export { LABEL_SCALE }
