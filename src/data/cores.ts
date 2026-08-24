import type { ProvenanceRecord } from './meta.ts'

export type CoreId = 'lattice' | 'spindle' | 'ring'

/** A cell coordinate on the board grid. Neighbour order is always N, E, S, W (§14). */
export interface Cell { readonly x: number; readonly y: number }

export interface Core {
  readonly id: CoreId
  readonly name: string
  /** §8.1 — core output; power decays 1 per step from the core (§15's 0-1 BFS). */
  readonly output: number
  /** §108.3 — explicit geometry. "+4 cells" was a count with no shape for a hundred sections. */
  readonly cells: readonly Cell[]
  readonly expansion: readonly Cell[]
  readonly corePosition: Cell
  /** §58.5 — thresholds scale with each core's own max region occupancy. */
  readonly overclock: number
  readonly meltdown: number
  /** §108.3 — Ring's max region goes 4 -> 5 on expansion, so it inherits Spindle's pair. */
  readonly overclockExpanded: number
  readonly meltdownExpanded: number
  readonly unlock: 'start' | { kill: 'regulator' } | { salvage: number }
}

const grid = (...rows: string[]): Cell[] => {
  const cells: Cell[] = []
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') cells.push({ x, y }) }))
  return cells
}

export const CORES: Readonly<Record<CoreId, Core>> = Object.freeze({
  lattice: {
    id: 'lattice', name: 'Lattice', output: 6,
    cells: grid('#####', '#####', '#####', '#####', '#####'),
    // §108.3 — four nubs at the edge midpoints, outside the 5x5. Max region stays 9.
    expansion: [{ x: 2, y: -1 }, { x: 5, y: 2 }, { x: 2, y: 5 }, { x: -1, y: 2 }],
    corePosition: { x: 2, y: 2 },
    overclock: 10, meltdown: 22, overclockExpanded: 10, meltdownExpanded: 22,
    unlock: 'start',
  },
  spindle: {
    id: 'spindle', name: 'Spindle', output: 6,
    cells: grid('...#...', '...#...', '...#...', '#######', '...#...', '...#...', '...#...'),
    // §108.3 — each arm 3 -> 4. Max region stays 5.
    expansion: [{ x: 3, y: -1 }, { x: 7, y: 3 }, { x: 3, y: 7 }, { x: -1, y: 3 }],
    corePosition: { x: 3, y: 3 },
    overclock: 7, meltdown: 19, overclockExpanded: 7, meltdownExpanded: 19,
    unlock: { kill: 'regulator' },  // §79.4 — earned, not bought
  },
  ring: {
    id: 'ring', name: 'Ring', output: 9,
    cells: grid('#####', '#...#', '#...#', '#...#', '#####'),
    // §108.3 — OUTWARD at the side midpoints, not inward: max region 4 -> 5 rather
    // than 4 -> 6, so it inherits the 5-cell pair §58.5 already solved.
    expansion: [{ x: 2, y: -1 }, { x: 5, y: 2 }, { x: 2, y: 5 }, { x: -1, y: 2 }],
    corePosition: { x: 0, y: 2 },
    overclock: 7, meltdown: 17, overclockExpanded: 7, meltdownExpanded: 19,
    unlock: { salvage: 4500 },
  },
})

/** §5.2B, §8 — the Regulator's reward, landing at the P2 transition (§120.5). */
export const EXPANSION_CELLS = 4

export const provenance: ProvenanceRecord = {
  CORES: {
    kind: 'solved', system: 'board', axes: ['heat'], source: '§8.1, §58.5, §108.3',
    derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/ladder.ts — each threshold pair is emitted from the core\'s max region occupancy; §58.7 re-runs the ladder over all six board states (3 cores x 2 sizes)',
  },
  EXPANSION_CELLS: { kind: 'authored', system: 'board', axes: [], source: '§5.2B', derivedFrom: 'surrogate' },
}
