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
import { BACKGROUND, PLAYER, SUBSTRATE } from '../gen/palette.ts'
import type { Surface } from '../render/surface.ts'
import { drawBoard, frameOf, heatTint, type BoardFrame, type BoardView } from '../render/boardview.ts'
import {
  cellsOf, createBoard, drawOf, key, mask, move, place, scrap, thresholds,
  type Board, type Cell, type ComponentId, type Rotation,
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
  cursor: { x: 2, y: 2 },
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
export const drawPrototype = (
  surface: Surface, atlas: Atlas, p: Prototype, layout: PrototypeLayout,
): number => {
  surface.clear()
  const frame = frameOf(p.board)
  let draws = drawBoard(surface, p.board, layout.view, frame)

  // The cursor: a bright box on the cell, and the ghost of what a confirm would do.
  const v = layout.view
  const cx = v.x + p.cursor.x * v.cell
  const cy = v.y + p.cursor.y * v.cell
  surface.setStroke(PLAYER, Math.max(2, v.cell * 0.08))
  surface.beginPath()
  surface.moveTo(cx, cy)
  surface.lineTo(cx + v.cell, cy)
  surface.lineTo(cx + v.cell, cy + v.cell)
  surface.lineTo(cx, cy + v.cell)
  surface.lineTo(cx, cy)
  surface.stroke()
  draws++

  // §115.5's slider, drawn as what it is: the run's thermal range, by hand.
  const barW = v.cell * 5
  surface.setFill(SUBSTRATE)
  surface.fillRect(v.x, layout.panelY - 18, barW, 8)
  surface.setFill(heatTint(p.board, thresholds(p.board).meltdown * p.engagement))
  surface.fillRect(v.x, layout.panelY - 18, barW * p.engagement, 8)
  draws += 2

  for (const [i, line] of inspect(p, frame).entries()) {
    draws += drawText(surface, atlas, line, layout.scale, layout.panelX, layout.panelY + i * 12)
  }
  return draws
}

export { BACKGROUND }
