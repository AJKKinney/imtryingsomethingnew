import type { ProvenanceRecord } from './meta.ts'

/**
 * §145.6 — the schedule is a DERIVED quantity, and it has been an authored one
 * since the first draft.
 *
 * §21 stated 19-24 sessions to Early Access while its own rows summed to 20-26, and
 * then twenty passes added 7.3-10.6 sessions of scope while declaring the total
 * unchanged. Two of the twenty costed themselves. Each judgment was defensible
 * alone, which is the failure: **an addition measured against the total never moves
 * it, and "not a whole session" twenty times is seven to eleven sessions.**
 *
 * The cross-check agrees independently. §63.1's ~15k lines across 84 modules plus
 * §71.2's 261 assertions at ~25 test-lines each is ~21,000 lines; 19-24 sessions
 * demands 875-1,105 lines of production TypeScript per session, by a session that
 * must also read its slice, run CI, fix what CI finds and write the ROADMAP delta.
 * The corrected figure demands 568-778.
 *
 * So the table is emitted from the items, and **a total cannot be restated without
 * the items moving.** §145.6 puts the deliverable list in `ROADMAP.md`; it is here
 * instead, for the reason §63.3 gives about every other artifact of this kind — a
 * generator that parses prose is a generator that breaks on a comma, and a session
 * that edits data cannot forget to regenerate the total because CI does it.
 *
 * §24.1 names shipping at all as the top risk. This file is what makes its size
 * observable rather than reassuring.
 */

export type PhaseId = '1' | '2' | '3a' | '3b' | '4' | '5' | '6' | '7' | '8' | '9' | '10'

export interface Deliverable {
  readonly phase: PhaseId
  readonly what: string
  /** Sessions, low and high. §63.1: a session is one context, not one day. */
  readonly low: number
  readonly high: number
  /** The pass that added it — so a scope addition names the pass that made it. */
  readonly source: string
}

const item = (phase: PhaseId, low: number, high: number, source: string, what: string): Deliverable =>
  ({ phase, what, low, high, source })

export const DELIVERABLES: readonly Deliverable[] = Object.freeze([
  // ── phase 1 · core loop
  item('1', 0.3, 0.4, '§17', 'Repo skeleton, empty dependencies, strict TypeScript, Vite, CI green on an empty test'),
  item('1', 0.4, 0.5, '§63.3', 'src/data/ partitioned by system, tools/gendocs.ts, the appendix-drift check'),
  item('1', 0.3, 0.4, '§71.2', 'tests/assertions.ts seeded, and CI failing in both directions'),
  item('1', 0.4, 0.5, '§14', 'core/rng, core/fixedmath with a baked sine table, the no-transcendentals lint'),
  item('1', 0.4, 0.6, '§142.6', 'core/loop generated from src/data/tickorder.ts, core/pool, core/spatialhash'),
  item('1', 0.5, 0.7, '§140.2', 'render/canvas2d behind render/renderer, the bezel, the generated stroke face and boot atlas, friend/foe language'),
  item('1', 0.3, 0.4, '§71.4', 'Player movement, vent-dash, Arc, Swarmers — the first playable'),
  item('1', 0.2, 0.3, '§14', 'core/input recording, replay, the golden-hash test, core/lifecycle and snapshots'),
  item('1', 0.2, 0.2, '§136.3', 'The eight canonical documents, written once there is something to describe'),
  // ── phase 2 · the hook
  item('2', 0.8, 1.0, '§15', 'The grid, 0-1 BFS power propagation, and the power-input recompute rule'),
  item('2', 0.6, 0.8, '§134.2', 'Region heat as the derived 3x3 sum, rendered as the cell fill'),
  item('2', 0.7, 1.0, '§112.2', 'Placement, rotation, the move verb, scrapping, undo'),
  item('2', 0.5, 1.0, '§69.3', 'Inspect mode and the placement ghost — the board is not a decision until its numbers are visible'),
  item('2', 0.7, 1.0, '§103.2', 'Offer cards in the bezel at 20% time, the projected-slot ghost, and the CODEX'),
  item('2', 0.4, 0.6, '§101.6', 'The screen registry, three navigation idioms, and the B-goes-up-one-level rule'),
  item('2', 0.3, 0.6, '§2.2A', 'Meltdown as an active crisis, ambient and haptic heat, causal placement juice'),
  // ── phase 3a · content and balance
  item('3a', 1.2, 1.6, '§131.2', 'All fourteen drafted components, five levels each, ten evolutions'),
  item('3a', 1.0, 1.4, '§10', 'Six enemies, six encounters including the escalating P3 vents'),
  item('3a', 0.5, 0.7, '§8', 'Board expansion, naming, starting-emitter choice'),
  item('3a', 0.8, 1.1, '§56', 'Banking, the Hall, derelicts, own-wreck seeding'),
  item('3a', 0.7, 1.0, '§4', 'Synergies, anomalies, elites, the reveal'),
  item('3a', 0.5, 0.8, '§11', 'Wave director, meta, cold open, onboarding, release beats'),
  item('3a', 0.3, 0.4, '§143.3', 'The evaluator, the four bot policies, and tools/autobalance.ts'),
  // ── phase 3b · reconciliation and the storefront
  item('3b', 1.2, 1.5, '§72.5', 'Port every surrogate analysis to tools/ against the real simulation, and record each disagreement'),
  item('3b', 0.6, 0.7, '§98.3', 'Telemetry: web analytics, the write-only Worker, TELEMETRY.md, the in-game opt-out'),
  item('3b', 0.6, 0.8, '§20', 'growth/capsule.ts and the store assets it feeds'),
  item('3b', 0.7, 0.8, '§62.2', 'The capped demo, share links, and the deploy gate'),
  item('3b', 0.9, 1.2, '§124', 'The daily seed, the tiered score, and the PAR worker'),
  // ── phase 4 · feel and accessibility
  item('4', 0.7, 0.9, '§101.4', 'The settings screen — five groups, seventeen rows — and the pause menu'),
  item('4', 0.6, 0.8, '§12', 'Colourblind variants, reduce flashing, type scale, battery and fps options'),
  item('4', 1.0, 1.4, '§39.3', 'The WebGL sprite-batch backend — budgeted, not contingent'),
  item('4', 0.7, 1.0, '§99.3', 'WORKSHOP with the live engagement slider, and the duty ladder from -3 to +10'),
  item('4', 0.4, 0.6, '§148.3', 'The Electron shell: a desktop binary of the same bundle, a depot, two apps from two flag sets'),
  item('4', 0.4, 0.6, '§100.6', 'The throttled perf profile and the first Deck Verification submission'),
  item('4', 1.0, 1.0, '§74.5', 'One session whose entire budget is things no assertion requires — pre-committed so it is not what gets cut'),
  item('4', 0.2, 0.7, '§140.5', 'The auto-captured peak moment and the event-cache render refactor'),
  // ── phase 5 · growth
  item('5', 0.7, 1.0, '§21', 'Clip recorder and the replay-link viewer'),
  item('5', 0.3, 0.5, '§21', 'Hall sharing'),
  item('5', 0.6, 0.9, '§140.3', 'The achievement-icon and library-asset generators over src/data/assets.ts'),
  item('5', 0.4, 0.6, '§146.4', 'The Next Fest build, taken with whatever exists'),
  // ── phase 6 · ship
  item('6', 1.4, 2.0, '§19', 'The Steamworks integration: achievements, cloud saves, leaderboards, Steam Input, Rich Presence'),
  item('6', 0.8, 1.2, '§141.3', 'The i18n runtime, five locales, and the +30% expansion layout'),
  item('6', 0.4, 0.6, '§140.4', 'The library asset set and client icon, checked against the partner site'),
  item('6', 0.6, 0.9, '§138.2', 'Store page, Early Access questionnaire, ratings, content survey, depot setup'),
  item('6', 0.4, 0.6, '§100.6', 'Deck Verification, second pass'),
  item('6', 0.4, 0.7, '§20', 'Early Access launch'),
  // ── phases 7-10 · Early Access to 1.0 (§97.4 — committed in §21 and scheduled nowhere)
  item('7', 0.8, 1.0, '§21', 'Drop 1: the Ring core'),
  item('7', 1.2, 1.5, '§66.4', 'Drop 1: the daily leaderboard and the GRAVEYARD'),
  item('7', 1.0, 1.5, '§80.3', 'Drop 1: one emitter and one amplifier'),
  item('8', 0.8, 1.5, '§21', 'Drop 2: the replay viewer UI'),
  item('8', 0.6, 1.2, '§49.2', 'Drop 2: duty ratings 4-10, with the ladder sweep re-run'),
  item('8', 0.6, 1.3, '§91.4', 'Drop 2: an anomaly set'),
  item('9', 0.8, 1.0, '§21', 'Drop 3: three anomalies'),
  item('9', 0.7, 1.0, '§19', 'Drop 3: achievements 20 to 30'),
  item('9', 1.5, 2.0, '§50.1', 'Drop 3: a fourth core — a geometry, a threshold pair, a ladder and a sweep'),
  item('10', 1.5, 2.0, '§138.5', '1.0: the Substrate biome'),
  item('10', 0.8, 1.0, '§40.3', '1.0: the 10,000-run release sweep across 16 shards'),
  item('10', 0.7, 1.0, '§144.5', '1.0: the price rise to $12.99, and the store refresh'),
])

export const PHASE_NAMES: Readonly<Record<PhaseId, string>> = Object.freeze({
  '1': 'Core loop',
  '2': 'The hook',
  '3a': 'Content and balance',
  '3b': 'Reconciliation and the storefront',
  '4': 'Feel and accessibility',
  '5': 'Growth',
  '6': 'Ship — Early Access launch',
  '7': 'Content drop 1',
  '8': 'Content drop 2',
  '9': 'Content drop 3',
  '10': '1.0',
})

export const PHASE_ORDER: readonly PhaseId[] =
  Object.freeze(['1', '2', '3a', '3b', '4', '5', '6', '7', '8', '9', '10'] as PhaseId[])

/** §145.5 — to Early Access, which is where §68.5's clocks and §24.1's risk live. */
export const EA_PHASES: readonly PhaseId[] = Object.freeze(['1', '2', '3a', '3b', '4', '5', '6'] as PhaseId[])

export interface Estimate { readonly low: number; readonly high: number }

const round1 = (n: number): number => Math.round(n * 10) / 10

export const estimate = (phases: readonly PhaseId[]): Estimate => {
  const items = DELIVERABLES.filter((d) => phases.includes(d.phase))
  return {
    low: round1(items.reduce((n, d) => n + d.low, 0)),
    high: round1(items.reduce((n, d) => n + d.high, 0)),
  }
}

export const phaseEstimate = (phase: PhaseId): Estimate => estimate([phase])

/**
 * §71.4, re-derived in §136.3. The first ten commits, ordered by dependency —
 * because §63.1 defines a session as one coherent slice and a session-1
 * implementer reading §22's twelve items in a sentence faces genuine ambiguity.
 *
 * Commits 1-3 contain no gameplay, and that is the point: they are the three
 * machines that make every later session cheap — the external signal, the source of
 * truth, and the contract.
 */
export interface Commit {
  readonly n: number
  readonly what: string
  readonly why: string
}

export const COMMITS: readonly Commit[] = Object.freeze([
  { n: 1, what: 'Repo skeleton, empty `dependencies`, strict `tsconfig`, Vite, CI green on an empty test',
    why: '§17: the build going red is the only external signal that exists, and it must exist before there is anything to break' },
  { n: 2, what: '`src/data/` partitioned by system, `tools/gendocs.ts`, the appendix-drift check, the state manifest, the formula-term inventory, distributions as weighted objects',
    why: '§63.3: the specification\'s home, before any code reads a constant' },
  { n: 3, what: '`tests/assertions.ts` seeded with the manifest, `expected-fail` and `quirk` flags, and the both-directions CI check',
    why: '§71.2: the contract, before the work' },
  { n: 4, what: '`core/rng`, `core/fixedmath` with a baked sine table, `gen/strokefont` from the same emitter, the no-transcendentals lint',
    why: '§14: retrofitting determinism is the expensive mistake' },
  { n: 5, what: '`core/loop` generated from `src/data/tickorder.ts`, `core/pool`, `core/spatialhash` with its brute-force test',
    why: '§142.6: a system cannot be added without choosing a step, and the time-scale is a tick gate' },
  { n: 6, what: '`render/canvas2d` behind `render/renderer`, the bezel, `gen/atlas` and the no-`fillText` rule, friend/foe language',
    why: '§46.5: readability is phase 1, not polish' },
  { n: 7, what: 'Player movement, vent-dash, Arc, Swarmers — the first playable',
    why: 'The smallest thing that is a game' },
  { n: 8, what: '`core/input` recording, replay, the golden-hash test, `core/lifecycle` and snapshots',
    why: '§14\'s payoff, and the `SessionStart` hook lands with it' },
  { n: 9, what: 'The eight canonical documents: `CLAUDE.md` `DECISIONS.md` `ROADMAP.md` `LAWS.md` `PIPELINE.md` `TELEMETRY.md` `STORE.md` `VOICE.md`',
    why: '§63.4 and §75.3: written once there is something to describe' },
  { n: 10, what: 'The board — grid, 0-1 BFS power, region heat as the derived sum, placement, the move verb, scrapping, inspect mode, causal juice, gamepad cursor, engagement slider — shipped as a playable link',
    why: '§81.3: the one question that can veto the project, asked at session 3 instead of session 5-7' },
])

/**
 * §75.2's list, closed at eight. Each was created because prose drifts, and §135.4
 * adds what none of them had: **a canonical home is a budget, not just a location.**
 */
export interface Home {
  readonly file: string
  readonly holds: string
  readonly source: string
  /** §135.4 — the ceiling reported at every phase boundary. */
  readonly tokenCeiling: number
  readonly generated: boolean
}

export const CANONICAL_HOMES: readonly Home[] = Object.freeze([
  { file: 'src/data/', holds: 'Constants — and Appendix A is a rendered view of it', source: '§63.3', tokenCeiling: 6000, generated: false },
  { file: 'tests/assertions.ts', holds: 'Assertions, with tier, phase, cadence, status and why', source: '§71.2', tokenCeiling: 5000, generated: false },
  { file: 'ROADMAP.md', holds: 'Where the project is, and what the run is like', source: '§63.4', tokenCeiling: 1500, generated: true },
  { file: 'DECISIONS.md', holds: 'Every settled decision, its current owner, and what it supersedes', source: '§75.3, §84.1', tokenCeiling: 4000, generated: true },
  { file: 'src/ui/screens.ts', holds: 'The screen registry, the three idioms, and the navigation graph', source: '§101.6', tokenCeiling: 500, generated: false },
  { file: 'LAWS.md', holds: 'What may never be done — the judgment half is what a session reads', source: '§114.4', tokenCeiling: 700, generated: true },
  { file: 'VOICE.md', holds: 'The voice of the ~640 human-written words, and it ships none of them', source: '§133.4', tokenCeiling: 500, generated: false },
  { file: 'src/data/builds.ts', holds: 'Four products and every flag that differs between them, with no defaults', source: '§148.4', tokenCeiling: 800, generated: false },
])

export const provenance: ProvenanceRecord = {
  DELIVERABLES: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§145.6', derivedFrom: 'definition' },
  PHASE_NAMES: { kind: 'authored', system: 'build', axes: [], source: '§21, §74.3', derivedFrom: 'definition' },
  PHASE_ORDER: { kind: 'authored', system: 'build', axes: [], source: '§21', derivedFrom: 'definition' },
  EA_PHASES: { kind: 'authored', system: 'build', axes: [], source: '§145.5', derivedFrom: 'definition' },
  estimate: { kind: 'solved', system: 'build', axes: ['provenance'], source: '§145.6', derivedFrom: 'definition', solvedBy: 'the sum of every deliverable in the named phases, so a total moves mechanically when an item is added' },
  phaseEstimate: { kind: 'solved', system: 'build', axes: ['provenance'], source: '§145.6', derivedFrom: 'definition', solvedBy: 'estimate() over one phase — §21 stated per-phase figures its own rows did not sum to' },
  COMMITS: { kind: 'authored', system: 'build', axes: [], source: '§71.4, §136.3', derivedFrom: 'definition' },
  CANONICAL_HOMES: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§75.2, §135.4', derivedFrom: 'definition' },
}
