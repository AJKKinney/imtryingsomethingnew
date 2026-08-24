import type { ProvenanceRecord } from './meta.ts'

export type EncounterId = 'sentinel' | 'breaker' | 'regulator' | 'sentinelPrime' | 'breakerPrime' | 'foundry'

export interface Encounter {
  readonly id: EncounterId
  readonly name: string
  readonly minute: number
  readonly hp: number
  /** §32.1 — the band is stamped with the duty rating AND, since §127.2, the board. */
  readonly targetSeconds: number
  /** §109.3 — phases are defined by HP percentage, so the bezel bar carries ticks. */
  readonly phases: readonly number[]
}

/**
 * Every value is DPS(t) x 0.6 x target length — the Foundry at x1.0, since §48.1
 * stops spawning and the player commits 100% of their damage. The table is DERIVED,
 * so a change to the power curve moves it mechanically rather than by argument.
 */
export const ENCOUNTERS: Readonly<Record<EncounterId, Encounter>> = Object.freeze({
  sentinel:      { id: 'sentinel',      name: 'Sentinel',       minute: 3,  hp: 4_900,   targetSeconds: 25,  phases: [] },
  breaker:       { id: 'breaker',       name: 'Breaker',        minute: 6,  hp: 10_600,  targetSeconds: 30,  phases: [] },
  regulator:     { id: 'regulator',     name: 'Regulator',      minute: 10, hp: 30_000,  targetSeconds: 45,  phases: [0.5] },
  sentinelPrime: { id: 'sentinelPrime', name: 'Sentinel Prime', minute: 13, hp: 29_000,  targetSeconds: 35,  phases: [] },
  breakerPrime:  { id: 'breakerPrime',  name: 'Breaker Prime',  minute: 16, hp: 35_600,  targetSeconds: 35,  phases: [] },
  foundry:       { id: 'foundry',       name: 'THE FOUNDRY',    minute: 20, hp: 215_300, targetSeconds: 100, phases: [0.66, 0.33] },
})

/** §12, §108.4 — a hard, visible, NON-damaging wall; §38.4's herding lives in the geometry. */
export const ARENA_WIDTH = 1400
export const ARENA_HEIGHT = 900
export const REGULATOR_BEAM_SWEEP = 15      // degrees/second

/**
 * §127.2 — THE FOUNDRY was the one bounded activity with no end condition, because
 * §48.1 removed everything that was previously ending runs. The P3 vents escalate
 * instead of a timer, which bounds every legal board near 236 s while sitting far
 * enough out that a competent player never learns it exists.
 */
export const FOUNDRY_VENT_HEAT = 4          // §122.5 — melts a 4-wide, spares a 3-wide
export const FOUNDRY_ESCALATION_STEP = 1
export const FOUNDRY_ESCALATION_INTERVAL = 15
/** §129.1 — 1.5x the fight's target length AT THAT DUTY RATING, not a flat 150 s. */
export const FOUNDRY_ESCALATION_FACTOR = 1.5

/** §120.5 — each orb the player stands inside adds heat, capped. The arena is a thermal map. */
export const PRIME_ORB_HEAT = 1
export const PRIME_ORB_HEAT_CAP = 3

/** §10, §73.1 — the quiet has a subject: the field's wrecks become visible. */
export const RELEASE_BEAT_SECONDS = 20

export const provenance: ProvenanceRecord = {
  ENCOUNTERS: {
    kind: 'solved', system: 'field', axes: ['damage'], source: '§32.1, §48.3, §61.3', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/bosses.ts — hp = DPS(t) x 0.6 x targetSeconds, the Foundry at x1.0 because §48.1 stops spawning',
  },
  ARENA_WIDTH: { kind: 'authored', system: 'field', axes: [], source: '§12, §96.5', derivedFrom: 'surrogate' },
  ARENA_HEIGHT: { kind: 'authored', system: 'field', axes: [], source: '§12, §96.5', derivedFrom: 'surrogate' },
  REGULATOR_BEAM_SWEEP: { kind: 'authored', system: 'field', axes: [], source: '§38.4', derivedFrom: 'surrogate' },
  FOUNDRY_VENT_HEAT: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§122.5', derivedFrom: 'surrogate' },
  FOUNDRY_ESCALATION_STEP: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§127.2', derivedFrom: 'surrogate' },
  FOUNDRY_ESCALATION_INTERVAL: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§127.2', derivedFrom: 'surrogate' },
  FOUNDRY_ESCALATION_FACTOR: { kind: 'solved', system: 'field', axes: ['bands'], source: '§129.1', derivedFrom: 'surrogate', solvedBy: 'the smallest factor that never fires on the intended winning run at any duty rung' },
  PRIME_ORB_HEAT: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§120.5', derivedFrom: 'surrogate' },
  PRIME_ORB_HEAT_CAP: { kind: 'authored', system: 'heat', axes: ['heat'], source: '§120.5', derivedFrom: 'surrogate' },
  RELEASE_BEAT_SECONDS: { kind: 'authored', system: 'field', axes: [], source: '§2.2B, §73.1', derivedFrom: 'surrogate' },
}
