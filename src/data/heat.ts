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

/**
 * §51.3's measured table, backed out of the generation figures §58.1 publishes: how
 * many targets each emitter hits per shot in a late-run crowd. It is what makes heat
 * a function of WORK DONE rather than of layout — the property §50.3 rewrote the
 * whole model to get, and §51.2 then sharpened, because tying heat to shots FIRED
 * left it saturating at minute eight when every emitter always has a target.
 *
 * Seven of the ten drafted emitters are here: these are the seven §58.1 measured, and
 * they reproduce its per-emitter column and its 2.08 mean exactly. Warden, Bore and
 * Siphon arrived twenty-three passes later (§92.3, §131.3) and no pass published a
 * figure for them, so they are absent rather than guessed — §72.3's rule is that a
 * number measured against the surrogate is a prior, and a number nobody measured at
 * all is not even that.
 */
export const LATE_TARGETS_HIT: Readonly<Record<string, number>> = Object.freeze({
  arc: 3, lance: 7, flak: 10, orbiter: 4, tesla: 5, mine: 5, pulse: 12,
})

/**
 * §8.2, §60.2, §122.6 — cooling per rank, and the numbers §60.1 had to replace.
 *
 * The published endpoints are the ranges §8.2 states — Sink `-0.5 -> -1.2` per covered
 * cell, Radiator `-0.8 -> -2.0`, Damper `+2 -> +5` on both thresholds — and §122.6
 * makes rank `ceil(level / 8)`, so there are five of them and nothing said what the
 * middle three are. Linear between the endpoints, which §128.2 confirms from the other
 * direction: it quotes a rank-4 Sink at **-1.02**, and 0.5 + 3 x 0.175 is 1.025.
 *
 * The reason these are per COVERED CELL rather than per region is §60.2's other half:
 * a Sink cools more when it covers more, so where you put it is a real decision —
 * the same spatial puzzle the rest of the board is, rather than a flat subtraction
 * that would make the cooling piece the one component whose position does not matter.
 */
export const SINK_RATES: readonly number[] = Object.freeze([0.5, 0.675, 0.85, 1.025, 1.2])
export const RADIATOR_RATES: readonly number[] = Object.freeze([0.8, 1.1, 1.4, 1.7, 2.0])
/** §92.3 — Damper raises the ceiling instead of lowering the heat, and is CAPPED by
 *  construction so it can never remove meltdown. §122.6 checks that at rank 5, not
 *  only at rank 1: +5 leaves a 6-wide region at 29.0 against 27, still melting. */
export const DAMPER_OFFSETS: readonly number[] = Object.freeze([2, 2.75, 3.5, 4.25, 5])

export const provenance: ProvenanceRecord = {
  SINK_RATES: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§8.2, §60.2', derivedFrom: 'surrogate',
    solvedBy: 'linear across ranks 1-5 between §8.2\'s published endpoints -0.5 and -1.2; §128.2 quotes rank 4 at -1.02 independently',
  },
  RADIATOR_RATES: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§8.2, §60.2', derivedFrom: 'surrogate',
    solvedBy: 'linear across ranks 1-5 between §8.2\'s published endpoints -0.8 and -2.0',
  },
  DAMPER_OFFSETS: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§92.3, §122.6', derivedFrom: 'surrogate',
    solvedBy: 'linear across ranks 1-5 between §8.2\'s published endpoints +2 and +5, capped by construction',
  },
  LATE_TARGETS_HIT: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§51.3, §58.1', derivedFrom: 'surrogate' },
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
