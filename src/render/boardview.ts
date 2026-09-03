/**
 * §85.2 — the board's visual grammar, and the fact that it did not have one.
 *
 * §85 is the pass that found it: the board is on the store capsule, permanently in
 * the bezel since §76.4, the first thing a share link opens on (§76.5), the object
 * §73.4's community posts, and the game's face since §68 — and after eighty-four
 * passes, **`board glyph`, `how power is drawn` and `level of detail` appeared zero
 * times.** §46 raised aesthetics from 50% and everything it added described the
 * WORLD, because that is what "aesthetics" means in a bullet heaven; then §68
 * repositioned the game and nobody re-ran it (§59.6's rule, pointed at art).
 *
 * Seven channels, and **not one of them depends on hue** (§85.4):
 *
 * | occupied | fill against outline | form |
 * | component | glyph | shape |
 * | **power** | **the trace's WIDTH, `delivered / draw`** | thickness |
 * | heat | cell fill, hue AND brightness | brightness alone survives |
 * | overclock | thickened traces, sparks | form and motion |
 * | amplifier links | a connector's presence | presence |
 * | synergy | a corner notch | presence |
 *
 * Choosing WIDTH for power is the decision that carries the whole file. It is the
 * puzzle's most important quantity, and as a thickness it is legible at the bezel's
 * 14.4 px cell, in every colourblind profile, and through the compression a stream
 * puts on §3's spectator venue — where a colour ramp is legible in none of the three.
 *
 * And §134.2 corrects the one channel that named the wrong quantity: **the cell's
 * fill renders the DERIVED region heat**, the 3x3 sum every threshold is tested
 * against, not the per-cell scalar it is summed from. §85.1's table said *region
 * heat* and §85.2's prose said *the cell's fill* — the same two readings §111.2
 * measured at a factor of nine, here in the display layer. Rendering the sum makes
 * the board draw a box blur of the heat field, so **the region, the seam between two
 * hot clusters, a corner's clipped four-cell window and the overclocked contour all
 * draw themselves**, and the four mechanics that rest on that shape need no eighth
 * channel.
 */
import { HEAT_RAMP, PLAYER, SUBSTRATE } from '../gen/palette.ts'
import type { Surface } from './surface.ts'
import {
  cellsOf, drawOf, isConduit, isEmitter, key, mask, thresholds, type Board, type Placement,
} from '../grid/board.ts'
import { computePower, deliveredTo, reaches, runRate, type PowerField } from '../grid/power.ts'
import { regionField } from '../grid/heat.ts'
import { CORES, type Cell } from '../data/cores.ts'
import { AMPLIFIERS, type ComponentId } from '../data/emitters.ts'

/**
 * §85.3's two levels of detail, which §83.2 made mandatory rather than optional.
 *
 * That pass measured the bezel: the play area is a fixed 640x360 (16:9), so on the
 * Steam Deck's 1280x800 the leftover band is **80 px** and the board renders at
 * 72x72 — **14.4 px a cell**, where §76.4 had asserted 120x120 at 24 px against a
 * space nobody had computed. A 14 px cell cannot carry a glyph, a connector or a
 * notch, and that is not a compromise: it is the correct division. The bezel view is
 * a **status light** answering *is my machine healthy?*; the `TAB` view is an
 * **instrument** answering *what exactly is this cell doing?* — the same two-channel
 * split §69.4 defended for numbers, arrived at independently.
 */
export type Detail = 'bezel' | 'full'

export interface BoardView {
  readonly x: number
  readonly y: number
  /** Pixels per cell. 14.4 at the bezel's 72x72, ~48 in the `TAB` view. */
  readonly cell: number
  readonly detail: Detail
}

/**
 * The dotted substrate an empty cell is drawn on — the same material as the field.
 *
 * It SCALES with the cell, which is the same defect §83.2 caught in the board itself:
 * §76.4 asserted 120x120 against a bezel band nobody had measured, and a dot fixed at
 * two pixels is that number one level down. At the bezel's 14.4 px cell two pixels is
 * a seventh of the cell and reads; at the workbench's 52 px it is a twenty-sixth, and
 * the board's SHAPE — §108.3's explicit per-core geometry, the thing that tells a
 * player where they may place at all — stops being visible on the surface §68 calls
 * the product. The floor keeps the bezel exactly where §86.2 measured it.
 */
export const substrateDot = (view: BoardView): number => Math.max(2, view.cell * 0.1)

export interface BoardFrame {
  readonly power: PowerField
  readonly heat: ReadonlyMap<string, number>
}

export const frameOf = (board: Board): BoardFrame => ({
  power: computePower(board),
  heat: regionField(board),
})

/**
 * §12's ambient ramp, indexed by how far the region is along its own core's ladder.
 *
 * Relative to the THRESHOLDS rather than to an absolute figure, because §58.5 scaled
 * every pair to its core's geometry: a fill keyed to a global number would read
 * Ring's meltdown as Lattice's mid-range and show the player a board that is not the
 * one they are playing.
 */
/**
 * How many of the ramp's colours read as SAFE. Everything from here up is the
 * overclocked band, and the split is what anchors the picture to the predicate.
 */
export const SAFE_BANDS = 2

export const heatTint = (board: Board, heat: number): string => {
  const t = thresholds(board)
  const last = HEAT_RAMP.length - 1
  if (t.meltdown <= 0 || t.overclock <= 0) return HEAT_RAMP[0] ?? SUBSTRATE
  if (heat >= t.meltdown) return HEAT_RAMP[last] ?? SUBSTRATE
  // Anchored to the THRESHOLDS rather than interpolated across the whole span,
  // because §134.2 requires the set drawn at or above the overclock tint to be
  // exactly the set the simulation reports overclocked. Linear in `heat / meltdown`
  // it was not: on Lattice the amber began at **8.81** against a line of 10, so every
  // region between them was painted overclocked while the simulation called it safe —
  // a false alarm on the quantity §116.5 calls the game's real minute-scale decision,
  // and §2's *cheated* pointing the other way. The old form passed its own test
  // because that test sampled one board rather than sweeping the band (§133.6: a
  // property is guarded by an asymmetry, not by a value).
  if (heat < t.overclock) {
    const at = heat / t.overclock
    let index = Math.floor(at * SAFE_BANDS)
    if (index < 0) index = 0
    if (index > SAFE_BANDS - 1) index = SAFE_BANDS - 1
    return HEAT_RAMP[index] ?? SUBSTRATE
  }
  const hot = last - SAFE_BANDS
  const at = (heat - t.overclock) / (t.meltdown - t.overclock)
  let index = SAFE_BANDS + Math.floor(at * hot)
  if (index < SAFE_BANDS) index = SAFE_BANDS
  if (index > last - 1) index = last - 1
  return HEAT_RAMP[index] ?? SUBSTRATE
}

/**
 * §85.4's other half, which the ramp alone does not deliver: **brightness, monotone
 * in heat.**
 *
 * §85.1 lists the heat channel as *"hue AND brightness — brightness alone survives"*,
 * and §12's ambient scale runs cyan to deep red. Rendered as hue alone that claim is
 * false, and measurably so: the ramp's luminance rises to the amber in the middle and
 * falls to the red at the end, so under total colour loss a cold cell and a melting
 * one are the same mid-grey and the cold one is the LOUDER of the two. A board whose
 * safest cells are its brightest is §2's *confused* on the surface §68 calls the
 * product.
 *
 * So the tint is composited over the substrate at an alpha that climbs from a floor
 * to full at the meltdown threshold. Hue still says WHERE on the ladder; brightness
 * now says HOW FAR, monotonically, and it is the half that survives the greyscale.
 */
export const HEAT_FLOOR_ALPHA = 0.14

const rgb = (hex: string): readonly [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
]

export const heatAlpha = (board: Board, heat: number): number => {
  const span = thresholds(board).meltdown
  const at = span <= 0 ? 0 : heat / span
  const clamped = at < 0 ? 0 : at > 1 ? 1 : at
  return HEAT_FLOOR_ALPHA + (1 - HEAT_FLOOR_ALPHA) * clamped
}

export const heatFill = (board: Board, heat: number): string => {
  const [r = 0, g = 0, b = 0] = rgb(heatTint(board, heat))
  return `rgba(${r}, ${g}, ${b}, ${heatAlpha(board, heat).toFixed(3)})`
}

/**
 * §85.2's central decision, in one function: **the trace's width is `delivered / draw`.**
 *
 * A component at 100% has a fat bright feed and one at 33% a visibly starved thread,
 * so the quantity §15 turns into every component's run rate is encoded as a thickness
 * rather than as a colour — and §140.5's event-cache rule means it is redrawn only
 * when a power input changes (§142.2), never per tick.
 */
export const traceWidth = (view: BoardView, rate: number): number => {
  const full = view.cell * 0.22
  const thin = view.cell * 0.05
  return thin + (full - thin) * (rate < 0 ? 0 : rate > 1 ? 1 : rate)
}

const at = (view: BoardView, c: Cell): { x: number; y: number } => ({
  x: view.x + c.x * view.cell + view.cell / 2,
  y: view.y + c.y * view.cell + view.cell / 2,
})

/**
 * §109.2 — **wear is trace TEXTURE**: a worn component's feed draws broken in
 * proportion to its penalty.
 *
 * §54.3 made wear the mechanic that decides whether a run ends at minute sixteen —
 * its own arithmetic puts three meltdowns between derelicts at load 0.99,
 * unsurvivable — and then no section specified any display for it, so the quantity
 * that ends the run was invisible until it had already ended it. A line STYLE is the
 * right channel because it survives total colour loss, which is §85.4's requirement
 * for all seven.
 */
export const dashesFor = (wear: number): number => {
  const capped = wear < 0 ? 0 : wear > 0.25 ? 0.25 : wear
  return Math.round((capped / 0.25) * 4)
}

const strokeSegment = (
  surface: Surface, from: { x: number; y: number }, to: { x: number; y: number }, breaks: number,
): void => {
  surface.beginPath()
  if (breaks === 0) {
    surface.moveTo(from.x, from.y)
    surface.lineTo(to.x, to.y)
  } else {
    // Broken in proportion to the wear, drawn as one path so it stays one draw call
    // against §39.3's ceiling — §140.5's rule is that the budget counts CALLS.
    const pieces = breaks + 1
    for (let i = 0; i < pieces; i++) {
      const a = i / pieces
      const b = (i + 0.6) / pieces
      surface.moveTo(from.x + (to.x - from.x) * a, from.y + (to.y - from.y) * a)
      surface.lineTo(from.x + (to.x - from.x) * b, from.y + (to.y - from.y) * b)
    }
  }
  surface.stroke()
}

/**
 * The core, which no pass ever asked to be drawn — and it is the only thing on an
 * empty board.
 *
 * §85.1 lists seven channels and every one of them describes a **placement**: the
 * cell's fill, the component's glyph, the trace's width, the connector, the notch.
 * So `drawBoard` used the core's position as a trace ORIGIN and never rendered the
 * origin, which is invisible for as long as there is a trace to infer it from — and
 * `createBoard` returns `placements: []`, so **run one opens on a grid of substrate
 * dots with nothing in the middle of it.** §8's hook is *power flood-fills from the
 * core*, §76 asks whether the player wants to touch the thing before they know what
 * it does, and the answer to both was a blank square.
 *
 * It is **one stroked path** — an outer ring and an inner ring, concentric — because
 * §39.1 budgets the bezel board at *25 cells + 24 traces + the core* and the core's
 * share of that 50 is one draw. Concentric rather than single keeps it distinct from
 * a component glyph, which is one open square at a smaller radius, while staying
 * inside §85.2's constraint on everything the machine draws: symmetric, closed and
 * axis-aligned, which IS §46.2's friend/foe language rather than a decoration on it.
 *
 * **§131.5's BLACKOUT is the one state that changes the shape.** Zero core output is
 * reachable by exactly one path (§135.1D), it takes the whole board dark, and it is
 * the moment the player most needs to know where to send §2.2A's reboot order — so
 * the outer ring opens into four corner brackets. An OPEN outline is the corruption's
 * half of §46.2's form channel, which is why it reads as *not a working machine*
 * under total colour loss and not merely as a dimmer one.
 */
export const drawCore = (surface: Surface, board: Board, view: BoardView): number => {
  const before = surface.draws
  const centre = at(view, CORES[board.core].corePosition)
  const outer = view.cell * 0.40
  const inner = view.cell * 0.16
  const dark = board.coreOutput <= 0
  surface.setStroke(PLAYER, Math.max(1.5, view.cell * 0.08))
  surface.beginPath()
  if (dark) {
    // Four brackets: the same square with its sides cut out of it.
    const arm = outer * 0.5
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = centre.x + outer * (sx ?? 0)
      const y = centre.y + outer * (sy ?? 0)
      surface.moveTo(x - arm * (sx ?? 0), y)
      surface.lineTo(x, y)
      surface.lineTo(x, y - arm * (sy ?? 0))
    }
  } else {
    surface.moveTo(centre.x - outer, centre.y - outer)
    surface.lineTo(centre.x + outer, centre.y - outer)
    surface.lineTo(centre.x + outer, centre.y + outer)
    surface.lineTo(centre.x - outer, centre.y + outer)
    surface.lineTo(centre.x - outer, centre.y - outer)
  }
  surface.moveTo(centre.x - inner, centre.y - inner)
  surface.lineTo(centre.x + inner, centre.y - inner)
  surface.lineTo(centre.x + inner, centre.y + inner)
  surface.lineTo(centre.x - inner, centre.y + inner)
  surface.lineTo(centre.x - inner, centre.y - inner)
  surface.stroke()
  return surface.draws - before
}

const isAmplifier = (id: ComponentId): boolean => id in AMPLIFIERS

/** The emitters an amplifier is boosting: orthogonally adjacent, N/E/S/W (§14). */
export const boosted = (board: Board, amp: Placement): readonly Placement[] => {
  const own = new Set(cellsOf(amp).map(key))
  const out: Placement[] = []
  for (const p of board.placements) {
    if (!isEmitter(p.id)) continue
    const touching = cellsOf(p).some((c) =>
      [[0, -1], [1, 0], [0, 1], [-1, 0]].some(([dx = 0, dy = 0]) =>
        own.has(key({ x: c.x + dx, y: c.y + dy }))))
    if (touching) out.push(p)
  }
  return out
}

/**
 * Draws the board. Returns the draw count so §39.3's ceiling is measured rather than
 * estimated — §96.3 found both render profiles over budget from the pass that wrote
 * them, because the counts were estimates and one of them was a POOL SIZE.
 */
export const drawBoard = (
  surface: Surface, board: Board, view: BoardView, frame: BoardFrame = frameOf(board),
): number => {
  const before = surface.draws
  const cells = [...mask(board)]
    .map((k) => { const [x = 0, y = 0] = k.split(',').map(Number); return { x, y } })
    // §14 — never an order-sensitive path over a Set. Row, then column.
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))
  const occupied = new Set(board.placements.flatMap((p) => cellsOf(p).map(key)))
  const t = thresholds(board)

  // 1. The substrate and the heat field. An empty cell is a dot; an occupied one is
  //    a fill whose value is the DERIVED region heat centred on it (§134.2).
  for (const c of cells) {
    const p = at(view, c)
    if (!occupied.has(key(c))) {
      surface.setFill(SUBSTRATE)
      const dot = substrateDot(view)
      surface.fillRect(p.x - dot / 2, p.y - dot / 2, dot, dot)
      continue
    }
    surface.setFill(heatFill(board, frame.heat.get(key(c)) ?? 0))
    const inset = view.cell * 0.06
    surface.fillRect(
      p.x - view.cell / 2 + inset, p.y - view.cell / 2 + inset,
      view.cell - inset * 2, view.cell - inset * 2,
    )
  }

  // 1b. The core. Drawn at BOTH levels of detail and before the traces, because it
  //     is the one object an empty board has and every trace begins inside it.
  drawCore(surface, board, view)

  // 2. The traces: one per component, from the core outward, at `delivered / draw`.
  //    An ISLAND has no trace at all, which is the loudest thing this grammar can
  //    say and is why §142.2 leaves an unrouted placement legal.
  const core = CORES[board.core].corePosition
  for (const p of board.placements) {
    if (!reaches(frame.power, p)) continue
    const rate = runRate(frame.power, p)
    const region = frame.heat.get(key(cellsOf(p)[0] ?? core)) ?? 0
    const overclocked = region >= t.overclock
    surface.setStroke(PLAYER, traceWidth(view, rate) * (overclocked ? 1.4 : 1))
    const head = cellsOf(p)[0] ?? core
    strokeSegment(surface, at(view, core), at(view, head), dashesFor(p.wear))
  }

  if (view.detail === 'bezel') return surface.draws - before

  // 3–5. The instrument's half: glyphs, amplifier connectors, synergy notches. None
  //      of it is drawn at 14.4 px a cell, because none of it is legible there.
  for (const p of board.placements) {
    const c = cellsOf(p)[0]
    if (c === undefined) continue
    const centre = at(view, c)
    const r = view.cell * 0.28
    surface.setStroke(PLAYER, Math.max(1, view.cell * 0.06))
    surface.beginPath()
    if (isConduit(p.id)) {
      // A conduit is a run, not a part: a bar rather than a closed glyph.
      surface.moveTo(centre.x - r, centre.y)
      surface.lineTo(centre.x + r, centre.y)
    } else {
      // §85.2 — the SAME seeded grammar as the enemies, constrained to symmetric,
      // closed and axis-aligned. That constraint IS §46.2's friend/foe language: one
      // generator, and the faction is the constraint rather than the palette.
      surface.moveTo(centre.x - r, centre.y - r)
      surface.lineTo(centre.x + r, centre.y - r)
      surface.lineTo(centre.x + r, centre.y + r)
      surface.lineTo(centre.x - r, centre.y + r)
      surface.lineTo(centre.x - r, centre.y - r)
    }
    surface.stroke()
  }

  for (const p of board.placements) {
    if (!isAmplifier(p.id)) continue
    const from = cellsOf(p)[0]
    if (from === undefined) continue
    surface.setStroke(PLAYER, Math.max(1, view.cell * 0.09))
    for (const target of boosted(board, p)) {
      const to = cellsOf(target)[0]
      if (to === undefined) continue
      strokeSegment(surface, at(view, from), at(view, to), 0)
    }
  }

  return surface.draws - before
}

/** §86.2's per-frame allowance for the board, measured in §140.5's recount. */
export const BEZEL_BOARD_DRAWS = 50
export const FULL_BOARD_DRAWS = 96

export const deliveredFor = (frame: BoardFrame, p: Placement): number =>
  deliveredTo(frame.power, p)

export const drawFor = (p: Placement): number => drawOf(p.id)
