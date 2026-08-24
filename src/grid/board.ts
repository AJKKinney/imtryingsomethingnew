/**
 * The board — the object §68 calls the product.
 *
 * §8's hook is one sentence: **power wants your build compact and close to the core,
 * heat wants it spread out.** Everything here exists to make that trade concrete —
 * a finite set of cells, shapes that must fit in them, and two derived fields
 * (`power.ts`, `heat.ts`) that read the same occupancy and disagree about it.
 *
 * §112.2 is the verb this file exists to provide and the game went a hundred and
 * eleven sections without: **a placed component can be picked up and re-placed.**
 * Until then the only way to change a layout was to destroy part of it, at ~10% of a
 * run's progression per average component — so the board was append-only after
 * placement, in a game whose premise is arrangement, and §44.4's strongest problem
 * generator (re-pack at 10:00) was impossible.
 */
import { CORES, type Cell, type CoreId } from '../data/cores.ts'
import {
  AMPLIFIERS, EMITTERS, SUPPORT, type ComponentId, type Shape,
} from '../data/emitters.ts'

export type Rotation = 0 | 1 | 2 | 3

export interface Placement {
  readonly id: ComponentId
  readonly anchor: Cell
  readonly rotation: Rotation
  /** §8.2's level rule. L3 and L5 are behaviour changes; L2 and L4 are +25% damage. */
  level: number
  /**
   * §15, §112.4 — **per occupied cell, and owned by the COMPONENT**, indexed by the
   * shape's own offset order so it survives a rotation unchanged. §15's sentence
   * carries both halves and they are usually read as one: *"each occupied cell
   * carries an accumulating heat scalar — owned by the component, not by the cell,
   * so it travels when the component moves."*
   *
   * A single scalar per component satisfies the second half and breaks the first,
   * and the break is not cosmetic. §111.2 requires a region-level change of Δ to move
   * the named region by **exactly** Δ; with one scalar, a two-cell component
   * straddling the window's edge takes its share and then smears it back across both
   * cells, half of it landing outside the region that was supposed to change.
   * Measured on a Lance at heat 4 with one cell in the window, a −1 vent-dash moves
   * the region by **−0.5**. The array is what makes §111.2 exact, and it costs a
   * `map` at placement.
   *
   * Taken the other way — heat owned by the CELL — §112.2's move verb would let a
   * player zero a region by shuffling, which is §60.1's off switch arriving by a
   * different route.
   */
  heat: number[]
  /** §130.2 — per component, capped -25%, and it travels with the component too. */
  wear: number
}

export interface Board {
  readonly core: CoreId
  /** §108.3 — the Regulator's +4 cells, as explicit geometry per core. */
  expanded: boolean
  readonly placements: Placement[]
  /** §131.5 — zero during a BLACKOUT, which is the one path to zero delivered power. */
  coreOutput: number
}

export const key = (c: Cell): string => `${c.x},${c.y}`

export const createBoard = (core: CoreId): Board => ({
  core,
  expanded: false,
  placements: [],
  coreOutput: CORES[core].output,
})

/** The legal cell set: the core's own geometry, plus §108.3's expansion when earned. */
export const mask = (board: Board): ReadonlySet<string> => {
  const core = CORES[board.core]
  const cells = board.expanded ? [...core.cells, ...core.expansion] : core.cells
  return new Set(cells.map(key))
}

export const shapeOf = (id: ComponentId): Shape =>
  id in EMITTERS
    ? EMITTERS[id as keyof typeof EMITTERS].shape
    : id in AMPLIFIERS
      ? AMPLIFIERS[id as keyof typeof AMPLIFIERS].shape
      : SUPPORT[id as keyof typeof SUPPORT].shape

export const drawOf = (id: ComponentId): number =>
  id in EMITTERS
    ? EMITTERS[id as keyof typeof EMITTERS].draw
    : id in AMPLIFIERS
      ? AMPLIFIERS[id as keyof typeof AMPLIFIERS].draw
      : SUPPORT[id as keyof typeof SUPPORT].draw

export const isEmitter = (id: ComponentId): boolean => id in EMITTERS
/** §15 — a conduit costs 0 to enter, which is what makes power a 0-1 shortest path. */
export const isConduit = (id: ComponentId): boolean => id === 'wire' || id === 'bus'

/**
 * Rotation is a quarter turn of the offsets, then a re-anchor so the shape's minimum
 * offset is (0,0). Without the re-anchor a rotated shape drifts away from the cell
 * the player pointed at, which reads as the board refusing a placement it accepted a
 * moment ago — §2's *confused*, produced by arithmetic rather than by design.
 */
export const rotate = (shape: Shape, rotation: Rotation): Shape => {
  const turned = shape.map(([x, y]) => {
    switch (rotation) {
      case 0: return [x, y] as const
      case 1: return [-y, x] as const
      case 2: return [-x, -y] as const
      default: return [y, -x] as const
    }
  })
  let minX = turned[0]?.[0] ?? 0
  let minY = turned[0]?.[1] ?? 0
  for (const [x, y] of turned) {
    if (x < minX) minX = x
    if (y < minY) minY = y
  }
  return Object.freeze(turned.map(([x, y]) => Object.freeze([x - minX, y - minY] as const)))
}

/** The cells a placement occupies, in a stable order (§14: never a Set iteration). */
export const cellsOf = (p: Placement): readonly Cell[] =>
  rotate(shapeOf(p.id), p.rotation).map(([dx, dy]) => ({ x: p.anchor.x + dx, y: p.anchor.y + dy }))

/** cell key -> the index of the placement occupying it. */
export const occupancy = (board: Board): ReadonlyMap<string, number> => {
  const out = new Map<string, number>()
  board.placements.forEach((p, i) => {
    for (const c of cellsOf(p)) out.set(key(c), i)
  })
  return out
}

export type Legality = { ok: true } | { ok: false; reason: 'offBoard' | 'occupied' }

export const legal = (
  board: Board, id: ComponentId, anchor: Cell, rotation: Rotation, ignore = -1,
): Legality => {
  const cells = mask(board)
  const taken = occupancy(board)
  for (const [dx, dy] of rotate(shapeOf(id), rotation)) {
    const at = key({ x: anchor.x + dx, y: anchor.y + dy })
    if (!cells.has(at)) return { ok: false, reason: 'offBoard' }
    const holder = taken.get(at)
    if (holder !== undefined && holder !== ignore) return { ok: false, reason: 'occupied' }
  }
  return { ok: true }
}

export const place = (
  board: Board, id: ComponentId, anchor: Cell, rotation: Rotation, level = 1,
): boolean => {
  if (!legal(board, id, anchor, rotation).ok) return false
  board.placements.push({ id, anchor, rotation, level, heat: shapeOf(id).map(() => 0), wear: 0 })
  return true
}

/**
 * §112.2's verb. **The component keeps its level and carries its heat** (§112.4), so
 * no sequence of moves lowers total board heat — the price of rearranging is exposure
 * at 20% time and the heat you brought with you, never a salvage cost, because a tax
 * would fall hardest at 10:00 where §44.4 wants the expansion to feel like liberation.
 */
export const move = (board: Board, index: number, anchor: Cell, rotation: Rotation): boolean => {
  const p = board.placements[index]
  if (p === undefined) return false
  if (!legal(board, p.id, anchor, rotation, index).ok) return false
  board.placements[index] = { ...p, anchor, rotation }
  return true
}

export type ScrapResult =
  | { readonly ok: true; readonly salvage: number }
  | { readonly ok: false; readonly reason: 'missing' | 'lastEmitter' }

/** §7.2B — cells are owned, so a component returns its cell and 20 salvage. */
export const SCRAP_SALVAGE = 20

export const scrap = (board: Board, index: number): ScrapResult => {
  const p = board.placements[index]
  if (p === undefined) return { ok: false, reason: 'missing' }
  // §57.2 — the last emitter cannot be scrapped. Not a softlock: a slow unwinnable
  // death with no feedback explaining why, which is worse than a refusal.
  if (isEmitter(p.id) && board.placements.filter((q) => isEmitter(q.id)).length === 1) {
    return { ok: false, reason: 'lastEmitter' }
  }
  board.placements.splice(index, 1)
  return { ok: true, salvage: SCRAP_SALVAGE }
}

/**
 * Heat accumulates on the COMPONENT and is spread evenly across the cells it occupies.
 *
 * Even is right and the alternative is a penalty nobody wrote down: charging every
 * cell the component's full generation would make a three-cell Bore three times as hot
 * as a one-cell Arc doing identical work, which is a thermal tax on footprint on top
 * of §91.1's measured finding that three cells is already disqualifying.
 */
export const addHeat = (p: Placement, amount: number): void => {
  const share = p.heat.length === 0 ? 0 : amount / p.heat.length
  for (let i = 0; i < p.heat.length; i++) {
    const next = (p.heat[i] ?? 0) + share
    p.heat[i] = next < 0 ? 0 : next
  }
}

/** §112.4's invariant, in one number: what no sequence of moves may ever reduce. */
export const totalHeat = (board: Board): number =>
  board.placements.reduce((sum, p) => sum + p.heat.reduce((a, b) => a + b, 0), 0)

/** §108.3 — the +4 cells land at the Regulator's P2 transition, not on its death. */
export const expand = (board: Board): void => { board.expanded = true }

/** §58.5, §108.3 — thresholds scale with the core's own max region occupancy. */
export const thresholds = (board: Board): { overclock: number; meltdown: number } => {
  const core = CORES[board.core]
  return board.expanded
    ? { overclock: core.overclockExpanded, meltdown: core.meltdownExpanded }
    : { overclock: core.overclock, meltdown: core.meltdown }
}
