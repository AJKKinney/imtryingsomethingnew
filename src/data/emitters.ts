import type { ProvenanceRecord } from './meta.ts'

/**
 * The drafted roster — §8.2, at the count §131.2 corrected it to.
 *
 * §91.4 moved four components forward from the content drops to Early Access and
 * §92.3 named them: Governor, Warden, Bore and **Damper**. Damper is SUPPORT, and
 * §5.2A bars support from the draft — so the pool was **13** for thirty-nine passes
 * while §93.3's offer weight, §91.5's variety band, §92.1's cell budget, §117.4's
 * starvation figure and §121.2's offer measurement were every one computed at 14.
 * §131.3 closed the question by shipping the fourteenth rather than re-deriving five
 * bands against a roster that was a bookkeeping slip: `SIPHON`, whose damage reads
 * the quantity the game is about.
 *
 * §113.6 makes L3, L5 and an evolution NON-NULLABLE. §92.3 added two emitters with a
 * shape, a draw, a damage and a rule and no capstone, so 22% of the roster had no
 * long-range plan at all — which is §44.4's eight-pick commitment not existing for
 * the components §92 was proudest of. A roster is a list of COMPLETE components.
 */

/** Cell offsets from the anchor, in (col, row). §34.1's packing problem is these. */
export type Shape = readonly (readonly [number, number])[]

export const SHAPE_SINGLE: Shape = Object.freeze([[0, 0]])
export const SHAPE_LINE2: Shape = Object.freeze([[0, 0], [1, 0]])
export const SHAPE_LINE3: Shape = Object.freeze([[0, 0], [1, 0], [2, 0]])
export const SHAPE_L2: Shape = Object.freeze([[0, 0], [0, 1]])
/**
 * §8.2 calls Pulse's footprint a "3 T", and a T is four cells. Three cells make the
 * stub of one: two in a row and one turning off the middle. Recorded rather than
 * silently straightened into a line, because §34.1's packing problem is exactly the
 * difference between a shape that turns and one that does not.
 */
export const SHAPE_ELL3: Shape = Object.freeze([[0, 0], [1, 0], [1, 1]])

export type EmitterId =
  | 'arc' | 'lance' | 'flak' | 'orbiter' | 'tesla' | 'mine' | 'pulse'
  | 'warden' | 'bore' | 'siphon'

export type AmplifierId = 'gain' | 'clock' | 'focus' | 'governor'
export type SupportId = 'wire' | 'bus' | 'sink' | 'radiator' | 'damper'
export type ComponentId = EmitterId | AmplifierId | SupportId

/** §8.2 — the capstone. §49.1 makes it CONSUME the amplifier, which is what caps
 *  evolutions per run at the number of amplifiers placed rather than at a constant. */
export interface Evolution {
  readonly id: string
  /** §59.4: deliberately NOT that emitter's DPS-optimal amplifier. A commitment costs. */
  readonly requires: AmplifierId
  readonly effect: string
}

export interface Emitter {
  readonly id: EmitterId
  readonly shape: Shape
  readonly draw: number
  readonly damage: number
  /** Shots per second. §50.4 — fire rate IS thermal load, since heat is per shot. */
  readonly rate: number
  readonly range: number
  readonly targeting: string
  /**
   * §121.5 — the fraction of the circle the weapon can point at, and the third axis
   * §33.3's DPS table cannot see. Minutes 0–3 are 100% Swarmers converging from
   * every direction (§118.2), so coverage decides whether a weapon fires at the
   * threat at all — and on it **Arc falls from second of seven to fifth or worse**,
   * in the emitter that opens every run and carries the demo.
   */
  readonly coverage: number
  readonly l3: string
  readonly l5: string
  readonly evolution: Evolution
}

export const EMITTERS: Readonly<Record<EmitterId, Emitter>> = Object.freeze({
  arc: {
    id: 'arc', shape: SHAPE_SINGLE, draw: 2, damage: 6, rate: 3, range: 90,
    targeting: 'nearest, 60 degree cone', coverage: 0.17,
    l3: 'cone 60 -> 120 degrees', l5: 'adds a second, opposed cone',
    evolution: { id: 'cascade', requires: 'clock', effect: 'arcs to a second target' },
  },
  lance: {
    id: 'lance', shape: SHAPE_LINE2, draw: 3, damage: 18, rate: 0.8, range: 320,
    targeting: 'longest enemy line, 16 sampled angles', coverage: 0.10,
    l3: 'pierces all', l5: '+50% length',
    evolution: { id: 'railgun', requires: 'gain', effect: 'x3 damage at 0.5/s' },
  },
  flak: {
    id: 'flak', shape: SHAPE_L2, draw: 3, damage: 22, rate: 0.6, range: 300,
    targeting: 'densest spatial-hash cell in range, AoE r40', coverage: 1.0,
    l3: '+20 blast radius', l5: 'two shells',
    evolution: { id: 'cluster', requires: 'focus', effect: 'four bomblets' },
  },
  orbiter: {
    id: 'orbiter', shape: SHAPE_SINGLE, draw: 2, damage: 10, rate: 2, range: 70,
    targeting: 'orbits at 70 u, 0.5 s per-enemy cooldown', coverage: 1.0,
    l3: '+1 orb', l5: '+1 orb, radius pulses',
    evolution: { id: 'halo', requires: 'clock', effect: 'five orbs at two radii' },
  },
  tesla: {
    id: 'tesla', shape: SHAPE_SINGLE, draw: 3, damage: 9, rate: 1.2, range: 120,
    targeting: 'nearest, chains 3 at 120 u per hop', coverage: 1.0,
    l3: 'chains 5', l5: 'no chain falloff',
    evolution: { id: 'storm', requires: 'gain', effect: 'chains every enemy within 200 u' },
  },
  mine: {
    id: 'mine', shape: SHAPE_SINGLE, draw: 2, damage: 30, rate: 0.5, range: 50,
    targeting: 'drops behind the player, AoE r50, max 3', coverage: 0.35,
    l3: '+2 maximum (5)', l5: 'arms instantly',
    evolution: { id: 'minefield', requires: 'focus', effect: '12 maximum, double lifetime' },
  },
  pulse: {
    id: 'pulse', shape: SHAPE_ELL3, draw: 4, damage: 14, rate: 0.4, range: 120,
    targeting: 'radial, wave expands at 400 u/s, knockback', coverage: 1.0,
    l3: '+60 radius', l5: 'adds a 0.5 s stun',
    evolution: { id: 'shockwave', requires: 'gain', effect: 'damage scales with hits' },
  },
  // §92.3 — defence that is not a side-effect of damage, which §89.1 found the
  // roster had no example of. §115.3: a 50% slow puts Swarmers at 85 u/s against
  // the player's 150, INVERTING §37 locally for a player who built for it — which
  // is what satisfies §88.4's graded-response band from L3.
  warden: {
    id: 'warden', shape: SHAPE_LINE2, draw: 3, damage: 4, rate: 1, range: 140,
    targeting: 'omnidirectional slow field', coverage: 1.0,
    l3: 'slow 30% -> 50%', l5: 'the field also pushes outward',
    evolution: { id: 'bastion', requires: 'governor', effect: 'enemies inside take +50% damage from all sources' },
  },
  // §92.3 — §91.1 found the one signal that survived both scoring models: three
  // cells is disqualifying. Bore makes footprint an asset instead of a tax.
  bore: {
    id: 'bore', shape: SHAPE_LINE3, draw: 4, damage: 16, rate: 0.7, range: 280,
    targeting: 'pierces; damage scales with own cells adjacent to powered components', coverage: 0.12,
    l3: 'pierce 280 -> 400 u', l5: 'fires in both directions',
    evolution: { id: 'lathe', requires: 'governor', effect: 'the beam persists 1 s as a damaging lane' },
  },
  // §131.3 — the first component whose output reads the quantity the game is about:
  // weakest on a cold board and strongest on the board that is about to melt.
  siphon: {
    id: 'siphon', shape: SHAPE_LINE2, draw: 2, damage: 6, rate: 1.2, range: 160,
    targeting: 'nearest, omnidirectional; damage = 6 + 0.6 x own region heat', coverage: 1.0,
    l3: 'reads the hottest region on the board instead of its own',
    l5: 'on a meltdown anywhere, one full-power volley at every enemy within 200 u',
    evolution: { id: 'crucible', requires: 'governor', effect: 'damage reads the summed excess of every overclocked region, capped' },
  },
})

/**
 * §14 forbids iteration over object keys in an order-sensitive path, so the order is
 * declared rather than discovered. `kind` on an Entity is an index into this.
 */
export const EMITTER_ORDER: readonly EmitterId[] = Object.freeze([
  'arc', 'lance', 'flak', 'orbiter', 'tesla', 'mine', 'pulse', 'warden', 'bore', 'siphon',
])

/** Siphon's damage term. §131.3: the loop does not close, because §51.2's work term
 *  counts TARGETS HIT and §117.6 classifies damage multipliers as thermally free. */
export const SIPHON_BASE = 6
export const SIPHON_PER_HEAT = 0.6

/** §8.2 level rule — L2 and L4 are +25% damage, L4 also +1 heat. */
export const LEVEL_DAMAGE_STEP = 0.25
export const LEVEL_4_HEAT = 1

export interface Amplifier {
  readonly id: AmplifierId
  /**
   * §8.2 puts every amplifier at one cell, and the field was implied rather than
   * stated until `grid/board.ts` had to ask. It is stated because §34.1's packing
   * problem is a property of SHAPES: a component whose footprint the board layer has
   * to special-case is a component outside the puzzle.
   */
  readonly shape: Shape
  readonly draw: number
  /** §59.3 — a damage multiplier is thermally free per shot, so the price sits on
   *  the amplifier. Without it Gain is best in 21 of 21 cases (§59.1). */
  readonly selfHeat: string
  readonly effect: string
  readonly gates: readonly string[]
}

export const AMPLIFIERS: Readonly<Record<AmplifierId, Amplifier>> = Object.freeze({
  gain: {
    id: 'gain', shape: SHAPE_SINGLE, draw: 1, selfHeat: '0.5 + 0.5 x adjacent emitters',
    effect: '+40 -> 60% damage to orthogonally adjacent emitters',
    gates: ['railgun', 'storm', 'shockwave'],
  },
  clock: {
    id: 'clock', shape: SHAPE_SINGLE, draw: 1, selfHeat: '+1 flat',
    effect: '+60 -> 80% rate; raises the emitter own heat and drives the region toward overclock',
    gates: ['cascade', 'halo'],
  },
  focus: {
    id: 'focus', shape: SHAPE_SINGLE, draw: 1, selfHeat: '+1 flat',
    effect: '+50 -> 70% area, AoE emitters only',
    gates: ['cluster', 'minefield'],
  },
  // §122.5 — §92.3's "+35 -> 55% while below overclock" was STRICTLY DOMINATED by
  // Gain at every width, by up to 37%, at identical cell, draw and self-heat, and
  // its condition was set by the crowd rather than by the build. Keyed on region
  // occupancy it stacks with overclock and simply pays less the tighter you pack.
  governor: {
    id: 'governor', shape: SHAPE_SINGLE, draw: 1, selfHeat: '0.5 + 0.5 x adjacent emitters',
    effect: '+140 -> 210% damage, minus 40 -> 55 points per additional emitter sharing that region, floored at zero',
    gates: ['bastion', 'lathe', 'crucible'],
  },
})

export const AMPLIFIER_ORDER: readonly AmplifierId[] = Object.freeze([
  'gain', 'clock', 'focus', 'governor',
])

export interface Support {
  readonly id: SupportId
  readonly shape: Shape
  readonly draw: number
  readonly effect: string
  /** §121.6 — three are held from run one; two are earned by thermal achievements. */
  readonly heldFromRunOne: boolean
}

export const SUPPORT: Readonly<Record<SupportId, Support>> = Object.freeze({
  wire: { id: 'wire', shape: SHAPE_SINGLE, draw: 0, effect: 'carries power with no decay', heldFromRunOne: true },
  // §132.5 — the "+1 budget" clause is cut: undefined in two appearances and
  // unimplementable under §15's 0-1 BFS, which forbids the negative edge weight it
  // would need. Bus's distinct purpose is its two-cell SHAPE.
  bus: { id: 'bus', shape: SHAPE_LINE2, draw: 0, effect: 'carries power with no decay across two cells', heldFromRunOne: true },
  sink: { id: 'sink', shape: SHAPE_SINGLE, draw: 0, effect: '-0.5 -> -1.2 generation per covered cell in r1', heldFromRunOne: true },
  radiator: { id: 'radiator', shape: SHAPE_LINE2, draw: 0, effect: '-0.8 -> -2.0 generation per covered cell over the union of both r1', heldFromRunOne: false },
  damper: { id: 'damper', shape: SHAPE_SINGLE, draw: 0, effect: 'raises the local overclock and meltdown thresholds +2 -> +5, capped', heldFromRunOne: false },
})

export const SUPPORT_ORDER: readonly SupportId[] = Object.freeze([
  'wire', 'bus', 'sink', 'radiator', 'damper',
])

/** §131.2 — every band stamped with a pool size is generated from this, never a literal. */
export const DRAFT_POOL: readonly ComponentId[] = Object.freeze([
  ...EMITTER_ORDER, ...AMPLIFIER_ORDER,
])

/** §122.6 — ranks 1–5 across a 40-level run, shared by every support piece held.
 *  Every support component carries a range and §5.2A bars support from the draft, so
 *  nothing in a hundred and twenty-one sections said how a rank was reached. */
export const supportRank = (level: number): number => {
  const rank = Math.ceil(level / 8)
  return rank < 1 ? 1 : rank > 5 ? 5 : rank
}

/**
 * §121.6 — which five emitters and which two amplifiers a new player starts with,
 * never stated in a hundred and twenty sections, and it decides the demo, the
 * onboarding and §64.4's completion gate. DERIVED from five constraints already in
 * the document rather than chosen: an evolution must be reachable on the starting
 * roster (§79.2's *evolve a component* gates an unlock), both endpoints of §51.3's
 * thermal axis must be present (Arc hottest at 2.98/s, Mine coolest at 1.45), three
 * distinct shapes so §34.1's packing problem exists on run 1, a cone and four
 * omnidirectional emitters so §5.2C's choice has more than one answer, and a draw-3
 * and a draw-4 so §69.6's under-powered onboarding beat can fire.
 */
export const RUN_ONE_EMITTERS: readonly EmitterId[] = Object.freeze([
  'arc', 'orbiter', 'mine', 'flak', 'pulse',
])
export const RUN_ONE_AMPLIFIERS: readonly AmplifierId[] = Object.freeze(['clock', 'focus'])

export const provenance: ProvenanceRecord = {
  SHAPE_SINGLE: { kind: 'authored', system: 'board', axes: [], source: '§8.2', derivedFrom: 'definition' },
  SHAPE_LINE2: { kind: 'authored', system: 'board', axes: [], source: '§8.2', derivedFrom: 'definition' },
  SHAPE_LINE3: { kind: 'authored', system: 'board', axes: [], source: '§8.2', derivedFrom: 'definition' },
  SHAPE_L2: { kind: 'authored', system: 'board', axes: [], source: '§8.2', derivedFrom: 'definition' },
  SHAPE_ELL3: { kind: 'authored', system: 'board', axes: [], source: '§8.2', derivedFrom: 'definition' },
  EMITTERS: { kind: 'authored', system: 'draft', axes: ['damage', 'heat'], source: '§8.2, §92.3, §113.3, §131.3', derivedFrom: 'surrogate' },
  EMITTER_ORDER: { kind: 'authored', system: 'draft', axes: [], source: '§14', derivedFrom: 'definition' },
  SIPHON_BASE: { kind: 'authored', system: 'draft', axes: ['damage', 'heat'], source: '§131.3', derivedFrom: 'surrogate' },
  SIPHON_PER_HEAT: { kind: 'authored', system: 'draft', axes: ['damage', 'heat'], source: '§131.3', derivedFrom: 'surrogate' },
  LEVEL_DAMAGE_STEP: { kind: 'authored', system: 'draft', axes: ['damage'], source: '§8.2', derivedFrom: 'surrogate' },
  LEVEL_4_HEAT: { kind: 'authored', system: 'draft', axes: ['heat'], source: '§8.2', derivedFrom: 'surrogate' },
  AMPLIFIERS: { kind: 'authored', system: 'draft', axes: ['damage', 'heat'], source: '§59.3, §122.5', derivedFrom: 'surrogate' },
  AMPLIFIER_ORDER: { kind: 'authored', system: 'draft', axes: [], source: '§14', derivedFrom: 'definition' },
  SUPPORT: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§8.2, §60.2, §92.3', derivedFrom: 'surrogate' },
  SUPPORT_ORDER: { kind: 'authored', system: 'heat', axes: [], source: '§14', derivedFrom: 'definition' },
  DRAFT_POOL: {
    kind: 'solved', system: 'draft', axes: ['bands'], source: '§131.2', derivedFrom: 'definition',
    solvedBy: 'the emitter and amplifier orders concatenated — support is barred from the draft (§5.2A), which is how the pool was 13 while every band was computed at 14',
  },
  supportRank: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§122.6', derivedFrom: 'definition',
    solvedBy: 'ceil(level / 8), clamped to 1..5 — ranks advance on §105.3\'s XP spine like everything else',
  },
  RUN_ONE_EMITTERS: {
    kind: 'solved', system: 'draft', axes: ['bands'], source: '§121.6', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/runone.ts — the smallest set satisfying §79.2 evolution reachability, §51.3 thermal endpoints, §34.1 shape variety, §5.2C coverage variety and §69.6 draw variety',
  },
  RUN_ONE_AMPLIFIERS: {
    kind: 'solved', system: 'draft', axes: ['bands'], source: '§121.6', derivedFrom: 'surrogate',
    solvedBy: 'the two amplifiers that make four of the five run-one emitters evolution-reachable',
  },
}
