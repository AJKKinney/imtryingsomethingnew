/**
 * §81.3's board prototype — **the one question that can veto this project, asked at
 * session 3 instead of session 5–7.**
 *
 * §9's gate is the only filter in this document with a veto (§73.6): *is arranging
 * this thing a tool or a chore, on a gamepad?* It was scheduled behind phase 2, which
 * is behind combat, the wave director, bosses, XP, the meta, the Hall, derelicts,
 * anomalies, synergies and the entire combat renderer — **ten things the gate does
 * not need.** §81.2 listed what it does need: a grid, 0-1 BFS power, region heat,
 * placement, scrapping, inspect mode, causal juice and a cell cursor.
 *
 * What made that newly possible is §76. Before it, a board with nothing to shoot at
 * was **inert** — §51.2 ties heat to targets hit, so with no enemies nothing moves
 * and there is nothing to evaluate. §76.2's causal placement juice and §69.3's
 * inspect mode changed that, and the scheduling consequence went unnoticed for three
 * passes.
 *
 * **The engagement slider is not a substitute for combat; it is a better instrument
 * for this question.** A player drags "how bad is the fight" from lull to crush and
 * watches the ladder move, so a placement's consequence across the *whole run's*
 * thermal range is visible in ten seconds — which no live run can show, because a
 * live run shows one minute at a time and takes twenty of them.
 *
 * If the gate fails, §70.3's ladder — redesign the UX, then reduce its interaction
 * cost, then stop — executes with **two sessions spent instead of seven**, and
 * §68.5's stop condition becomes a decision rather than a bereavement.
 */
import { drawText, type Atlas, type Scale } from '../render/atlas.ts'
import { BACKGROUND, CORE_HUES, PLAYER, SUBSTRATE } from '../gen/palette.ts'
import type { Surface } from '../render/surface.ts'
import {
  deliveredFor, drawBoard, frameOf, heatTint, traceWidth,
  type BoardFrame, type BoardView,
} from '../render/boardview.ts'
import {
  cellsOf, createBoard, drawOf, key, mask, move, place, scrap, shapeOf, rotate, thresholds,
  type Board, type Cell, type ComponentId, type Placement, type Rotation,
} from './prototype-imports.ts'
import { equilibrium, isOverclocked, regionHeat, stateOf, tickHeat } from '../grid/heat.ts'
import { reaches, runRate } from '../grid/power.ts'
import { LABELS } from '../data/strings.ts'
import { LATE_TARGETS_HIT } from '../data/heat.ts'
import { EMITTERS } from '../data/emitters.ts'
import type { World } from '../core/world.ts'

const text = (id: string): string => LABELS.find((l) => l.id === id)?.text ?? id

/**
 * The tray the prototype offers. §121.6's run-1 roster plus the three support pieces
 * held from run one — the set a player actually starts with, so the gate is answered
 * against the board a new player is handed rather than a curated one.
 */
export const TRAY: readonly ComponentId[] = Object.freeze([
  'arc', 'orbiter', 'mine', 'flak', 'pulse', 'clock', 'focus', 'wire', 'bus', 'sink',
] as ComponentId[])

export interface Prototype {
  readonly board: Board
  cursor: Cell
  rotation: Rotation
  /** Index into TRAY — what a confirm would place. */
  holding: number
  /** §112.2's move verb: the placement picked up, or -1. */
  carrying: number
  /** 0 = a lull, 1 = the late-run crush. §51.2's targets-hit, by hand. */
  engagement: number
  /** §9's gate signal: opens, moves, scraps and manual placements (§121.4). */
  decisions: number
}

export const createPrototype = (): Prototype => ({
  board: createBoard('lattice'),
  // NOT the core's own cell: a cursor that opens on top of the core is invisible, and
  // the cell above it is where the opening placement wants to go anyway — adjacent to
  // the core is where §15's decay of 1 per step makes power free.
  cursor: { x: 2, y: 1 },
  rotation: 0,
  holding: 0,
  carrying: -1,
  engagement: 0.35,
  decisions: 0,
})

/**
 * §82.2's second tab: the same board, driven by real Swarmers instead of by hand.
 *
 * §51.2 ties an emitter's heat to **targets hit**, which is a FIELD quantity — so the
 * board's thermal state is a function of where the player is standing, and the loop
 * closes: board -> damage -> field -> targets hit -> heat -> board. §108.5 names it
 * from the player's side: *your position is a thermostat.* That is why a fixed board
 * heats up across a run with no scaling rule anywhere (§51.1) — the crowd does it.
 *
 * The scale is derived rather than chosen, and §51.3 already published it. Pulse is
 * radial at 120 u and its late-run figure is **12 targets hit**, so *the number of
 * enemies inside a 120 u circle* IS the document's own measure of a full late-run
 * crowd. Engagement is that count against that figure, clamped — which makes the
 * slider and the run read the same axis rather than two that merely look alike.
 */
export const ENGAGEMENT_RADIUS = EMITTERS.pulse.range
export const ENGAGEMENT_FULL = LATE_TARGETS_HIT['pulse'] ?? 12

export const engagementOf = (world: World): number => {
  const r2 = ENGAGEMENT_RADIUS * ENGAGEMENT_RADIUS
  let inside = 0
  for (let i = 0; i < world.enemies.count; i++) {
    const e = world.enemies.items[i]
    if (e === undefined) continue
    const dx = e.x - world.player.x
    const dy = e.y - world.player.y
    if (dx * dx + dy * dy <= r2) inside++
  }
  const at = inside / ENGAGEMENT_FULL
  return at > 1 ? 1 : at
}

const cells = (p: Prototype): Cell[] =>
  [...mask(p.board)]
    .map((k) => { const [x = 0, y = 0] = k.split(',').map(Number); return { x, y } })
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))

/** The placement under the cursor, or -1. */
export const under = (p: Prototype): number =>
  p.board.placements.findIndex((q) => cellsOf(q).some((c) => key(c) === key(p.cursor)))

export type Command =
  | 'up' | 'down' | 'left' | 'right'
  | 'confirm' | 'rotate' | 'scrap' | 'cancel' | 'nextPart' | 'prevPart'
  | 'hotter' | 'cooler'

/**
 * One command, resolved discretely — §142.3's step 4, and the reason the board's UI
 * runs at render rate while its COMMITS land on sim ticks: dragging is a preview at
 * 60 fps even when the simulation is at 12 Hz, and what enters the input log is one
 * stamped action that replays (§14).
 */
export const apply = (p: Prototype, command: Command): void => {
  const legalCells = cells(p)
  const move2 = (dx: number, dy: number): void => {
    const want = { x: p.cursor.x + dx, y: p.cursor.y + dy }
    if (legalCells.some((c) => key(c) === key(want))) p.cursor = want
  }
  switch (command) {
    case 'up': move2(0, -1); return
    case 'down': move2(0, 1); return
    case 'left': move2(-1, 0); return
    case 'right': move2(1, 0); return
    case 'rotate': p.rotation = ((p.rotation + 1) % 4) as Rotation; return
    case 'nextPart': p.holding = (p.holding + 1) % TRAY.length; return
    case 'prevPart': p.holding = (p.holding + TRAY.length - 1) % TRAY.length; return
    case 'hotter': p.engagement = Math.min(1, p.engagement + 0.05); return
    case 'cooler': p.engagement = Math.max(0, p.engagement - 0.05); return
    case 'cancel': p.carrying = -1; return
    case 'scrap': {
      const index = under(p)
      if (index >= 0 && scrap(p.board, index).ok) p.decisions++
      return
    }
    case 'confirm': {
      if (p.carrying >= 0) {
        // §112.4 — the component keeps its level and CARRIES ITS HEAT, so no sequence
        // of moves lowers total board heat. Taken the other way, the move verb would
        // be free cooling: §60.1's off switch arriving by a different route.
        if (move(p.board, p.carrying, p.cursor, p.rotation)) { p.carrying = -1; p.decisions++ }
        return
      }
      const occupant = under(p)
      if (occupant >= 0) { p.carrying = occupant; p.decisions++; return }
      const id = TRAY[p.holding]
      if (id !== undefined && place(p.board, id, p.cursor, p.rotation)) p.decisions++
      return
    }
  }
}

/** One simulation tick of heat at the current engagement (§142.5's step 16). */
export const tick = (p: Prototype, seconds: number): void => {
  tickHeat(p.board, p.engagement, seconds)
}

/**
 * §69.3's inspect mode, as six lines.
 *
 * §69.1 derived it by listing what a placement decision NEEDS and finding the game
 * showed **one of eight** — every other quantity computed sixty times a second and
 * thrown away. That was survivable while the audience was §3's forty-percent-attention
 * player, for whom heat is a mood; §68 sold the game to someone else, and §68.4's
 * promise is *a system I can understand completely*.
 *
 * §69.2 is the rule that keeps it from contradicting §4: **discovery is hidden,
 * arithmetic never is.** A mechanic you have not met may be invisible; one you have
 * met is fully inspectable with its real numbers from that moment on.
 */
export const inspect = (p: Prototype, frame: BoardFrame): readonly string[] => {
  const t = thresholds(p.board)
  const index = under(p)
  const region = regionHeat(p.board, p.cursor)
  const lines = [
    `${text('region')} ${text('heat')} ${region.toFixed(1)}`,
    `${text('overclock')} ${t.overclock} ${text('meltdown')} ${t.meltdown}`,
  ]
  const placed = index >= 0 ? p.board.placements[index] : undefined
  if (placed === undefined) {
    const id = TRAY[p.holding]
    lines.push(`${text(id ?? '')} ${text('draw')} ${id === undefined ? 0 : drawOf(id)}`)
    return lines
  }
  const delivered = Math.round(runRate(frame.power, placed) * drawOf(placed.id))
  const emitter = EMITTERS[placed.id as keyof typeof EMITTERS] as { rate: number } | undefined
  const generation = emitter === undefined ? 0
    : (LATE_TARGETS_HIT[placed.id] ?? 0) * p.engagement
  lines.push(
    reaches(frame.power, placed)
      ? `${text('power')} ${delivered} / ${drawOf(placed.id)}`
      : `${text('power')} ${text('unrouted')}`,
    `${text(placed.id)} ${isOverclocked(p.board, placed) ? text('overclock') : stateOf(p.board, region)}`,
    `${text('engagement')} ${Math.round(p.engagement * 100)} ${generation.toFixed(1)}`,
    `${text('heat')} ${equilibrium(region).toFixed(1)}`,
  )
  return lines
}

export interface PrototypeLayout {
  readonly view: BoardView
  readonly panelX: number
  readonly panelY: number
  readonly scale: Scale
}

/**
 * Renders the prototype, and returns the draw count.
 *
 * §76.2 is what the cursor and the ghost are for, and it is the reason this is not
 * polish: **placing a component must make the machine's causal structure visible,
 * immediately, with no enemy on screen.** §5.2G filed placement juice beside hit-stop
 * and damage numbers — the language of polish — and under §76's lens it is **the
 * toy**, which is a different requirement with a different test.
 */
/**
 * What a confirm would do, computed on a COPY of the real board with the real
 * functions rather than estimated. §30's Board is four fields and an array, so the
 * projection is a shallow copy and a `place()` — which means the number the ghost
 * shows and the number the player gets are the same number by construction, and
 * cannot drift the way a second implementation drifts (§134.2's exact failure).
 */
const project = (p: Prototype): { board: Board; placed: Placement } | undefined => {
  const id = TRAY[p.holding]
  if (id === undefined) return undefined
  const copy: Board = { ...p.board, placements: [...p.board.placements] }
  if (!place(copy, id, p.cursor, p.rotation)) return undefined
  const placed = copy.placements[copy.placements.length - 1]
  return placed === undefined ? undefined : { board: copy, placed }
}

/** §104.5's eighth core hue — the brightest cool, reserved here for the cursor. */
const CURSOR = CORE_HUES[7] ?? '#eaf6ff'

const box = (surface: Surface, x: number, y: number, w: number, h: number): number => {
  surface.beginPath()
  surface.moveTo(x, y)
  surface.lineTo(x + w, y)
  surface.lineTo(x + w, y + h)
  surface.lineTo(x, y + h)
  surface.lineTo(x, y)
  surface.stroke()
  return 1
}

/**
 * §85's grammar, drawn as itself. The board carries seven channels and until the
 * first gate not one of them was ever NAMED — §85.4 audited that every channel
 * survives total colour loss and nobody audited whether a first-time viewer can
 * decode any of them. A key is not a tutorial: it is the legend a diagram needs,
 * and it is drawn from the same primitives as the board so it cannot describe a
 * board the board does not draw.
 */
const drawKey = (
  surface: Surface, atlas: Atlas, p: Prototype, layout: PrototypeLayout,
  x: number, y: number,
): number => {
  const s = layout.scale
  const t = thresholds(p.board)
  let draws = drawText(surface, atlas, text('key'), s, x, y)
  const rowH = 15
  const swatch = 26
  const rows: readonly string[] = [
    `${text('power')} ${text('full')}`,
    `${text('power')} ${text('starved')}`,
    `${text('heat')} ${text('cool')}`,
    `${text('heat')} ${text('hot')}`,
    text('empty'),
  ]
  rows.forEach((row, i) => {
    const ry = y + 14 + i * rowH
    const mid = ry + 4
    if (i === 0 || i === 1) {
      surface.setStroke(PLAYER, traceWidth(layout.view, i === 0 ? 1 : 0.33))
      surface.beginPath()
      surface.moveTo(x, mid)
      surface.lineTo(x + swatch, mid)
      surface.stroke()
      draws++
    } else if (i === 2 || i === 3) {
      surface.setFill(heatTint(p.board, i === 2 ? 0 : t.overclock))
      surface.fillRect(x, ry, swatch, 9)
      draws++
    } else {
      surface.setStroke(SUBSTRATE, 1)
      draws += box(surface, x, ry, swatch, 9)
    }
    draws += drawText(surface, atlas, row, s, x + swatch + 8, ry)
  })
  return draws
}

export const drawPrototype = (
  surface: Surface, atlas: Atlas, p: Prototype, layout: PrototypeLayout,
): number => {
  surface.clear()
  const frame = frameOf(p.board)
  const v = layout.view
  const s = layout.scale
  let draws = drawBoard(surface, p.board, v, frame)

  // ── the verbs, on screen rather than in a table below the page (§112.1) ──────
  // The first gate found a player who could read the board and had NO MOVE. A cursor
  // with no stated verb is a cursor that means nothing, and the controls were four
  // hundred pixels below the canvas in prose nobody had reached yet.
  draws += drawText(surface, atlas, 'ARROWS MOVE   ENTER PLACE   R ROTATE   BACKSPACE SCRAP',
    s, v.x, 14)
  draws += drawText(surface, atlas, `Q E ${text('holding')}   [ ] ${text('fight')}   TAB RUN`,
    s, v.x, 28)

  // ── the cursor, and the ghost of what a confirm would do ────────────────────
  // WHITE and thin, at the cell's own boundary, because the core is CYAN and heavy
  // inside it — and until this pass they were the same colour at the same weight, so
  // on the board every run opens on the cursor and the core were one indistinguishable
  // stack of squares. It stays on §46.2's cool side (the eighth core hue), so the
  // friend/foe read is untouched: what changes is which cool, which is exactly the
  // channel §104.5 already spends on identity.
  const cx = v.x + p.cursor.x * v.cell
  const cy = v.y + p.cursor.y * v.cell
  surface.setStroke(CURSOR, 2)
  draws += box(surface, cx, cy, v.cell, v.cell)

  const ghost = project(p)
  if (ghost !== undefined) {
    // The FOOTPRINT is the half the cursor could never show: a three-cell part under
    // a one-cell box is a placement the player cannot see the shape of.
    surface.setStroke(PLAYER, 1)
    for (const c of cellsOf(ghost.placed)) {
      draws += box(surface, v.x + c.x * v.cell + 4, v.y + c.y * v.cell + 4,
        v.cell - 8, v.cell - 8)
    }
  }

  // ── what is held, and what it would cost ────────────────────────────────────
  const px = layout.panelX
  const held = TRAY[p.holding]
  draws += drawText(surface, atlas, text('holding'), s, px, v.y)
  if (held !== undefined) {
    const shape = rotate(shapeOf(held), p.rotation)
    draws += drawText(surface, atlas,
      `${text(held)}  ${shape.length} ${text('cells')}  ${text('draw')} ${drawOf(held)}`,
      s, px, v.y + 14)
  }

  // The consequence, which the first gate found missing entirely: the player could
  // act and could not tell what changed. Both numbers come from the projection, so
  // they are what WILL happen rather than what probably will.
  const before = regionHeat(p.board, p.cursor)
  if (ghost === undefined) {
    draws += drawText(surface, atlas, `${text('after')} ${text('blocked')}`, s, px, v.y + 28)
  } else {
    const after = regionHeat(ghost.board, p.cursor)
    const power = deliveredFor(frameOf(ghost.board), ghost.placed)
    draws += drawText(surface, atlas,
      `${text('after')} ${text('power')} ${power}/${drawOf(ghost.placed.id)}` +
      `  ${text('heat')} ${before.toFixed(1)}>${after.toFixed(1)}`,
      s, px, v.y + 28)
  }

  // ── §69.3's six lines, unchanged: the state as it IS ────────────────────────
  for (const [i, line] of inspect(p, frame).entries()) {
    draws += drawText(surface, atlas, line, s, px, layout.panelY + i * 12)
  }

  draws += drawKey(surface, atlas, p, layout, px, layout.panelY + 88)

  // ── §115.5's slider, drawn as what it is: the run's thermal range, by hand ───
  const barW = v.cell * 5
  const barY = v.y + v.cell * 5 + 24
  draws += drawText(surface, atlas,
    `${text('fight')} ${Math.round(p.engagement * 100)}`, s, v.x, barY - 16)
  surface.setFill(SUBSTRATE)
  surface.fillRect(v.x, barY, barW, 10)
  surface.setFill(heatTint(p.board, thresholds(p.board).meltdown * p.engagement))
  surface.fillRect(v.x, barY, barW * p.engagement, 10)
  draws += 2
  draws += drawText(surface, atlas, text('lull'), s, v.x, barY + 16)
  draws += drawText(surface, atlas, text('crush'), s, v.x + barW - 34, barY + 16)
  return draws
}

export { BACKGROUND }
