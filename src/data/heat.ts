import type { ProvenanceRecord } from './meta.ts'

/**
 * The heat model. dH/dt = generation − k·H, so a region's equilibrium is
 * generation × 1.5 and its time constant is 1.5 s (§31.1).
 *
 * Generation is per SHOT and depends on TARGETS HIT (§51.2), which is why heat
 * tracks the war rather than the layout — and why a fixed board heats up across a
 * run with no scaling rule anywhere (§51.1).
 */
export const DISSIPATION_K = 2 / 3
export const EQUILIBRIUM_FACTOR = 1 / DISSIPATION_K  // 1.5

/** §60.2 — the invariant that makes an off switch impossible. */
export const PASSIVE_GENERATION = 1.0

/** §51.2 — per shot: base + perTarget × targets hit. */
export const WORK_BASE = 0.3
export const WORK_PER_TARGET = 0.12

/** §58.1 — overclock raises rate AND damage, so the region's own generation rises. */
export const OVERCLOCK_RATE_MULTIPLIER = 1.5
export const OVERCLOCK_DAMAGE_MULTIPLIER = 1.5

/** §58.5 — one rung is the equilibrium cost of one average emitter. */
export const RUNG = 3.0

/** §15 — region = the 3x3 Chebyshev block centred on a cell, clipped at edges. */
export const REGION_RADIUS = 1
const REGION_SIDE = REGION_RADIUS * 2 + 1
export const REGION_CELLS_MAX = REGION_SIDE * REGION_SIDE  // 9

export const provenance: ProvenanceRecord = {
  DISSIPATION_K: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§31.1', derivedFrom: 'surrogate',
    solvedBy: 'the k giving a 1.5 s time constant — responsive enough to feel live, slow enough to manage',
  },
  EQUILIBRIUM_FACTOR: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§31.1', derivedFrom: 'definition',
    solvedBy: '1 / DISSIPATION_K, by the steady state of dH/dt = G - kH',
  },
  PASSIVE_GENERATION: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§60.2', derivedFrom: 'definition' },
  WORK_BASE: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§51.4', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/heat.ts — with WORK_PER_TARGET, puts a 5-wide at 22.0 against meltdown 22 at 20:00',
  },
  WORK_PER_TARGET: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§51.4', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/heat.ts — the pair is the primary tuning handle for the whole risk economy',
  },
  OVERCLOCK_RATE_MULTIPLIER: { kind: 'authored', system: 'heat', axes: ['heat', 'damage'], source: '§8', derivedFrom: 'surrogate' },
  OVERCLOCK_DAMAGE_MULTIPLIER: { kind: 'authored', system: 'heat', axes: ['damage'], source: '§8', derivedFrom: 'surrogate' },
  RUNG: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§58.5', derivedFrom: 'definition',
    solvedBy: 'the equilibrium cost of one average emitter: mean generation 2.08 x 1.5 ~= 3.0',
  },
  REGION_RADIUS: { kind: 'authored', system: 'heat', axes: [], source: '§15', derivedFrom: 'definition' },
  REGION_CELLS_MAX: {
    kind: 'solved', system: 'heat', axes: [], source: '§15', derivedFrom: 'definition',
    solvedBy: '(2r+1)^2 for the Chebyshev block; clipped to 4 at a corner and 6 at an edge (§133.1)',
  },
}
