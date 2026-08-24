/**
 * Power — §15's 0-1 BFS, and the half of §8's hook that was decorative for
 * thirty-three sections.
 *
 * §33.1 is why the outputs are what they are: at the original 10/12/16 the WORST
 * cell on every core still delivered more power than the hungriest component draws,
 * so placement could never be punished by distance, conduits solved a problem nobody
 * had, and a 1,200-salvage meta upgrade bought literally nothing. Heat was carrying
 * the entire design while power supplied flavour text.
 *
 * The algorithm is a shortest path rather than a flood fill, and the weights are what
 * make it cheap: moving into a conduit costs **0** and into anything else **1**, so a
 * deque is exact where a priority queue would be needed for general weights. A-017
 * checks it against a reference Dijkstra on every legal board, because a subtle deque
 * error does not crash — it produces a board that is merely slightly wrong.
 */
import type { Cell } from '../data/cores.ts'
import { CORES } from '../data/cores.ts'
import { cellsOf, drawOf, isConduit, key, occupancy, type Board, type Placement } from './board.ts'

/** §14 — N, E, S, W, everywhere. A neighbour order is part of the simulation. */
export const NEIGHBOURS: readonly (readonly [number, number])[] = Object.freeze([
  [0, -1], [1, 0], [0, 1], [-1, 0],
])

export interface PowerField {
  /** cell key -> delivered power, `coreOutput - dist`, floored at 0. */
  readonly delivered: ReadonlyMap<string, number>
  /** cell key -> steps from the core, for the trace the board draws. */
  readonly distance: ReadonlyMap<string, number>
}

/**
 * §142.2 — the recompute trigger is a **power input**, and there are exactly three:
 * the occupancy set, the core's output, and the board's cell mask.
 *
 * §15 said "recomputed only when the board changes", written when a placement was the
 * only thing that could move power. **A meltdown is not a board change**, so
 * §131.5's BLACKOUT could not propagate and the mechanic could not fire; neither
 * could §120.5's +4 cells arriving at a phase transition.
 */
export const powerInputs = (board: Board): string =>
  `${board.coreOutput}|${board.expanded ? 1 : 0}|` +
  board.placements.map((p) => `${p.id}@${p.anchor.x},${p.anchor.y}r${p.rotation}`).join(';')

export const computePower = (board: Board): PowerField => {
  const core = CORES[board.core]
  const taken = occupancy(board)
  const distance = new Map<string, number>()
  const delivered = new Map<string, number>()

  const start = key(core.corePosition)
  // A deque, as two ends of one array: 0-cost edges go to the front and 1-cost edges
  // to the back, which keeps the frontier sorted without a heap.
  const deque: { at: Cell; dist: number }[] = [{ at: core.corePosition, dist: 0 }]
  distance.set(start, 0)

  while (deque.length > 0) {
    const node = deque.shift()
    if (node === undefined) break
    const here = key(node.at)
    const best = distance.get(here)
    if (best !== undefined && node.dist > best) continue

    for (const [dx, dy] of NEIGHBOURS) {
      const next: Cell = { x: node.at.x + dx, y: node.at.y + dy }
      const at = key(next)
      const holder = taken.get(at)
      // §15 — power flows through OCCUPIED cells. An empty cell is not a wire.
      if (holder === undefined) continue
      const occupant = board.placements[holder]
      if (occupant === undefined) continue
      const step = isConduit(occupant.id) ? 0 : 1
      const candidate = node.dist + step
      const known = distance.get(at)
      if (known !== undefined && known <= candidate) continue
      distance.set(at, candidate)
      if (step === 0) deque.unshift({ at: next, dist: candidate })
      else deque.push({ at: next, dist: candidate })
    }
  }

  for (const [at, dist] of distance) {
    const power = board.coreOutput - dist
    delivered.set(at, power > 0 ? power : 0)
  }
  return { delivered, distance }
}

/**
 * A component's delivered power is the **maximum over its own cells**, and the choice
 * is recorded rather than assumed: §15 defines power per CELL and every component
 * larger than one cell therefore has several values.
 *
 * The maximum is right because a component is one machine and the trace reaching any
 * of its cells is the trace reaching it — the minimum would make a three-cell Bore
 * run at the rate of its worst corner, which is a second, undeclared penalty on top
 * of §91.1's measured finding that three cells is already disqualifying.
 */
export const deliveredTo = (field: PowerField, p: Placement): number => {
  let best = 0
  for (const c of cellsOf(p)) {
    const at = field.delivered.get(key(c)) ?? 0
    if (at > best) best = at
  }
  return best
}

/**
 * Whether the core's graph reaches this component at all.
 *
 * §135.1D says zero delivered power is reachable by **exactly one path** — §131.5's
 * blackout. Building the board found a second, and it is a placement rather than an
 * event: **a component with no chain of occupied cells back to the core.** §15 flood-
 * fills through orthogonally adjacent OCCUPIED cells, so an island receives nothing,
 * and nothing in the legality rules forbids one.
 *
 * Islands stay legal, deliberately. Forbidding them would delete the harshest form of
 * the power constraint and with it the clearest reason conduits exist — §50.1
 * measured conduit share at 21% / 0% / 27% across the three cores, and a Wire is
 * exactly the piece that connects one. And it does not violate §2's legible-cause
 * rule, because §85.2 draws power as the trace's WIDTH: an island has no trace at
 * all, which is the loudest signal the board's grammar can produce. What it does mean
 * is that §8's *"never switching off"* has to be read as narrowly as §135.1D wrote
 * it — a rule about **distance**, governing components the core can actually reach.
 */
export const reaches = (field: PowerField, p: Placement): boolean =>
  cellsOf(p).some((c) => field.distance.has(key(c)))

/**
 * §8 — an under-powered component runs at a reduced rate proportional to the
 * shortfall and **never switches off**. §135.1D scopes that rule: it is about
 * DISTANCE, and zero is reachable by two paths, both of them visible — §131.5's
 * blackout, and an island the player placed and never routed to (see `reaches`).
 */
export const runRate = (field: PowerField, p: Placement): number => {
  const draw = drawOf(p.id)
  if (draw <= 0) return 1
  const ratio = deliveredTo(field, p) / draw
  return ratio > 1 ? 1 : ratio < 0 ? 0 : ratio
}

/**
 * §131.5's BLACKOUT: the core is a component in a region, it generates no heat of its
 * own, and it is **not exempt from the meltdown**. Its region melting takes core
 * output to zero for the offline period, and because power flood-fills from the core,
 * the whole board goes dark. It costs no new rule — exempting the core would cost a
 * special case — and on Lattice the eight non-core cells in the core's own region are
 * the best-powered cells on the board, so the balanced core gains a hazard at its
 * heart while Ring, whose binding axis was always power, is untouched.
 */
export const blackout = (board: Board): void => { board.coreOutput = 0 }

export const restorePower = (board: Board): void => {
  board.coreOutput = CORES[board.core].output
}
