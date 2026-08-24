import type { ProvenanceRecord } from './meta.ts'

/**
 * §102.6 — the boundary §18 assumed and never drew.
 *
 * §18 divides text into "functional strings" (mine) and content (human-written),
 * rests the whole disclosure position on the split, and never says which is which.
 * §102.2 drew it, with the test stated rather than left to taste:
 *
 *   A LABEL names a thing the player manipulates and could be replaced by an icon
 *   or an id without loss. PROSE is written to be read: it has sentences, voice,
 *   or tone.
 *
 * The `FAULT TRACE` is what proves the line was real and unmarked. §67.4 spends
 * three constraints on its TONE and warns it is "one bad phrasing away from the
 * negative watchlist" — a string with three constraints on its tone is not a
 * functional string, and it sat on the wrong side of a boundary nobody had drawn.
 *
 * §102.1 is the correction that forced this: §18's sentence "machine names are
 * written by players" has been false since §66.1 replaced typed names with a 2-byte
 * procedural index. The one category §18 exempted by saying players write it is the
 * category players never write, so the word list behind it is player-consumed
 * generated text and joins the human side.
 *
 * §141.4 then makes these two lists load-bearing twice over: they ARE the runtime
 * string table, so adding a locale is a data file rather than a refactor across
 * sixteen screens — enforcement written for provenance, paying for localization.
 *
 * SEEDED PARTIAL, AND SAYING SO. §102.2 counts 131 labels and ~640 words of prose.
 * `LABEL_COUNT` and `PROSE_WORDS` below are what is actually here, and the gap is
 * reported rather than rounded away: screens and settings that do not exist yet
 * have no labels, and a list that looks complete and is not is the failure §71.2
 * seeded the assertion manifest empty to avoid.
 */

/** §61.5's last axis: every player-visible string is one of exactly two things. */
export type AuthoredBy = 'label' | 'human'

export type LabelGroup =
  | 'emitter' | 'amplifier' | 'support' | 'evolution'
  | 'enemy' | 'boss' | 'core' | 'anomaly' | 'synergy'
  | 'meta' | 'hud' | 'setting' | 'screen' | 'action'

export interface Label {
  /** The id the code refers to. A label is an id with a rendering. */
  readonly id: string
  readonly text: string
  readonly group: LabelGroup
}

const label = (group: LabelGroup, id: string, text: string): Label => ({ id, text, group })

/**
 * MINE. Every one of these could be an icon, and several already are (§140.3's
 * achievement marks depict the object rather than naming it).
 */
export const LABELS: readonly Label[] = Object.freeze([
  // ── the drafted roster (§8.2, fourteen since §131.2 shipped the fourteenth)
  label('emitter', 'arc', 'ARC'),
  label('emitter', 'lance', 'LANCE'),
  label('emitter', 'flak', 'FLAK'),
  label('emitter', 'orbiter', 'ORBITER'),
  label('emitter', 'tesla', 'TESLA'),
  label('emitter', 'mine', 'MINE'),
  label('emitter', 'pulse', 'PULSE'),
  label('emitter', 'warden', 'WARDEN'),
  label('emitter', 'bore', 'BORE'),
  label('emitter', 'siphon', 'SIPHON'),
  label('amplifier', 'gain', 'GAIN'),
  label('amplifier', 'clock', 'CLOCK'),
  label('amplifier', 'focus', 'FOCUS'),
  label('amplifier', 'governor', 'GOVERNOR'),
  // ── the free tray (§121.6 — five, not four)
  label('support', 'wire', 'WIRE'),
  label('support', 'bus', 'BUS'),
  label('support', 'sink', 'SINK'),
  label('support', 'radiator', 'RADIATOR'),
  label('support', 'damper', 'DAMPER'),
  // ── evolutions (§113.4, ten across four amplifiers)
  label('evolution', 'cascade', 'CASCADE'),
  label('evolution', 'railgun', 'RAILGUN'),
  label('evolution', 'cluster', 'CLUSTER'),
  label('evolution', 'halo', 'HALO'),
  label('evolution', 'storm', 'STORM'),
  label('evolution', 'minefield', 'MINEFIELD'),
  label('evolution', 'shockwave', 'SHOCKWAVE'),
  label('evolution', 'bastion', 'BASTION'),
  label('evolution', 'lathe', 'LATHE'),
  label('evolution', 'crucible', 'CRUCIBLE'),
  // ── the field (§10)
  label('enemy', 'swarmer', 'SWARMER'),
  label('enemy', 'brute', 'BRUTE'),
  label('enemy', 'shooter', 'SHOOTER'),
  label('enemy', 'splitter', 'SPLITTER'),
  label('enemy', 'phaser', 'PHASER'),
  label('enemy', 'charger', 'CHARGER'),
  label('enemy', 'elite', 'ELITE'),
  label('boss', 'sentinel', 'SENTINEL'),
  label('boss', 'breaker', 'BREAKER'),
  label('boss', 'regulator', 'REGULATOR'),
  label('boss', 'sentinelPrime', 'SENTINEL PRIME'),
  label('boss', 'breakerPrime', 'BREAKER PRIME'),
  label('boss', 'foundry', 'THE FOUNDRY'),
  // ── cores (§8.1)
  label('core', 'lattice', 'LATTICE'),
  label('core', 'spindle', 'SPINDLE'),
  label('core', 'ring', 'RING'),
  // ── anomalies (§4, announced by name once and by their numbers after — §109.6)
  label('anomaly', 'coldStart', 'COLD START'),
  label('anomaly', 'surge', 'SURGE'),
  label('anomaly', 'salvageRun', 'SALVAGE RUN'),
  label('anomaly', 'mirror', 'MIRROR'),
  label('anomaly', 'deadCell', 'DEAD CELL'),
  label('anomaly', 'resonanceField', 'RESONANCE FIELD'),
  label('anomaly', 'overpressure', 'OVERPRESSURE'),
  label('anomaly', 'scavenger', 'SCAVENGER'),
  // ── synergies (§4 — listed only from the tick one first fires, §69.2)
  label('synergy', 'pulseMine', 'PULSE / MINE'),
  label('synergy', 'teslaOrbiter', 'TESLA / ORBITER'),
  label('synergy', 'lanceFlak', 'LANCE / FLAK'),
  label('synergy', 'overclockedConduit', 'OVERCLOCKED CONDUIT'),
  label('synergy', 'resonance', 'RESONANCE'),
  label('synergy', 'flashFreeze', 'FLASH-FREEZE'),
  // ── meta (§11)
  label('meta', 'reinforcedCasing', 'REINFORCED CASING'),
  label('meta', 'servoTuning', 'SERVO TUNING'),
  label('meta', 'powerSurge', 'POWER SURGE'),
  label('meta', 'coolantReserve', 'COOLANT RESERVE'),
  label('meta', 'salvageMagnet', 'SALVAGE MAGNET'),
  label('meta', 'fabricator', 'FABRICATOR'),
  label('meta', 'failsafe', 'FAILSAFE'),
  label('meta', 'scrapBay', 'SCRAP BAY'),
  label('meta', 'mountPoint', 'MOUNT POINT'),
  // ── the HUD and the board (§54.2's rethemed vocabulary — a machine has structural
  //    margin, not hit points, and it runs on a duty rating rather than an ascension)
  label('hud', 'integrity', 'INTEGRITY'),
  label('hud', 'cycle', 'CYCLE'),
  label('hud', 'dutyRating', 'DUTY RATING'),
  label('hud', 'salvageBanked', 'BANKED'),
  label('hud', 'salvageUnstable', 'UNSTABLE'),
  label('hud', 'heat', 'HEAT'),
  label('hud', 'power', 'POWER'),
  label('hud', 'draw', 'DRAW'),
  label('hud', 'cells', 'CELLS'),
  label('hud', 'overclock', 'OVERCLOCK'),
  label('hud', 'meltdown', 'MELTDOWN'),
  label('hud', 'region', 'REGION'),
  label('hud', 'clearWear', 'CLEAR WEAR'),
  label('hud', 'repair', 'REPAIR'),
  label('hud', 'pending', 'PENDING'),
  label('hud', 'auto', 'AUTO'),
  label('hud', 'par', 'PAR'),
  label('hud', 'standing', 'STANDING'),
  // ── the verbs (§112.1 — the board's operational set, one label each)
  label('action', 'place', 'PLACE'),
  label('action', 'move', 'MOVE'),
  label('action', 'rotate', 'ROTATE'),
  label('action', 'scrap', 'SCRAP'),
  label('action', 'undo', 'UNDO'),
  label('action', 'inspect', 'INSPECT'),
  label('action', 'close', 'CLOSE'),
  label('action', 'prioritise', 'PRIORITISE'),
  label('action', 'claim', 'CLAIM'),
  // ── settings (§101.4 — five groups, seventeen rows; the row IS the label)
  label('setting', 'renderProfile', 'RENDER PROFILE'),
  label('setting', 'frameCap', 'FRAME CAP'),
  label('setting', 'batterySaver', 'BATTERY SAVER'),
  label('setting', 'language', 'LANGUAGE'),
  label('setting', 'volumeMaster', 'MASTER'),
  label('setting', 'volumeMusic', 'MUSIC'),
  label('setting', 'volumeSfx', 'SFX'),
  label('setting', 'rumble', 'RUMBLE'),
  label('setting', 'glyphSet', 'GLYPHS'),
  label('setting', 'rebinding', 'CONTROLS'),
  label('setting', 'colourblind', 'COLOURBLIND'),
  label('setting', 'reduceFlashing', 'REDUCE FLASHING'),
  label('setting', 'typeScale', 'TYPE SCALE'),
  label('setting', 'boardTimeScale', 'BOARD TIME'),
  label('setting', 'assist', 'ASSIST'),
  label('setting', 'telemetry', 'TELEMETRY'),
  label('setting', 'standingShown', 'SHOW STANDING'),
  // ── screens (§101.2 — sixteen, and the Hall is home because §55.3 deleted the
  //    main menu without saying so)
  label('screen', 'title', 'MELTLINE'),
  label('screen', 'hall', 'THE FOUNDRY HALL'),
  label('screen', 'loadout', 'LOADOUT'),
  label('screen', 'metaShop', 'FABRICATION'),
  label('screen', 'boardView', 'BOARD'),
  label('screen', 'pause', 'PAUSED'),
  label('screen', 'settings', 'SETTINGS'),
  label('screen', 'runEnd', 'RUN END'),
  label('screen', 'daily', 'DAILY'),
  label('screen', 'workshop', 'WORKSHOP'),
  label('screen', 'goals', 'GOALS'),
  label('screen', 'codex', 'CODEX'),
  label('screen', 'recovery', 'RECOVERY'),
  label('screen', 'transfer', 'TRANSFER'),
  label('screen', 'shareLanding', 'SCHEMATIC'),
  // The screen TITLE is a label; the narration inside it is prose, and §102.2's whole
  // test is that those are different things. They collided on one id until A-044 said
  // so, which is the cheapest possible demonstration that the boundary is checkable.
  label('screen', 'buildReport', 'BUILD REPORT'),
])

/**
 * THEIRS. §18: the store description and every word of in-game prose are
 * human-written, because Valve's disclosure attaches to generative-AI content
 * players consume — and this is the category §102.2 found on the wrong side.
 *
 * `words` is a budget, not a count of anything that exists: §23's task 17 is what
 * fills these, and the budget is what makes it a schedulable ask (~3.5 h) rather
 * than an open one.
 */
export interface ProseSurface {
  readonly id: string
  readonly surface: string
  readonly words: number
  /** §133.4 — the constraint `VOICE.md` expands. Deadpan machine telemetry. */
  readonly voice: string
  /** §23's task 17 splits: the namespace freezes at phase 3b, the rest at phase 6. */
  readonly due: '3b' | '6'
}

export const PROSE: readonly ProseSurface[] = Object.freeze([
  {
    id: 'nameParts', surface: 'The machine-name word list — 64 prefixes, 32 roots, 32 numerals',
    words: 128, due: '3b',
    voice: 'One semantic register, industrial and thermal (§134.4). ANY prefix must combine with ANY root, because all 65,536 ship and none can be vetoed after §102.3 freezes the format. Numerals read as part numbers, never counts.',
  },
  {
    id: 'faultTrace', surface: 'FAULT TRACE, both variants (§67.3, §74.2, §107.2)',
    words: 60, due: '6',
    voice: 'The machine\'s telemetry, never the game\'s verdict. When there was no point of no return it says so, and THAT IS THE COMPLIMENT. It says "found" rather than "existed", because the solver\'s search is bounded and the sentence must not outrun it.',
  },
  {
    id: 'buildReportTemplate', surface: 'The build-report template (§2.2C, §137.4\'s novelty line)',
    words: 120, due: '6',
    voice: 'Narrates cause from quantities the simulation already has. Names the overflow conversion and the scrap refund as a refund rather than as income (§128.3, §130.1).',
  },
  {
    id: 'achievements', surface: '20 achievement names and descriptions (§19, §124.6)',
    words: 180, due: '6',
    voice: 'Each names an object the renderer draws, because §140.3 generates its two icons from that object.',
  },
  {
    id: 'anomalies', surface: '8 anomaly announcement lines (§4)',
    words: 64, due: '6',
    voice: 'The name on first encounter; the real numbers on every encounter after (§109.6).',
  },
  {
    id: 'death', surface: 'Death copy (§2.2F, §78.3\'s four beats)',
    words: 12, due: '6',
    voice: 'Leads with the machine you built. THE VICTORY SHIPS ZERO STRINGS (§134.3) — §4.4 defines the reveal as the one deliberately languageless moment in the game, and any sentence arriving with that camera move is a sentence explaining the image.',
  },
  {
    id: 'crash', surface: 'Crash-recovery and error copy (§16)',
    words: 40, due: '6',
    voice: 'States what was recovered and hands over a copyable error code. A crash is a fault the machine reports, which is the one place the voice is literally true.',
  },
  {
    id: 'onboarding', surface: 'The onboarding beat and the game\'s single prompt (§11, §69.6)',
    words: 36, due: '6',
    voice: 'One prompt in twenty minutes. It fires on a placement that visibly has a consequence, so it names a key and not a lesson.',
  },
])

/** What is actually here, against §102.2's 131. The gap is the point (§145.6). */
export const LABEL_COUNT: number = LABELS.length
export const LABEL_BUDGET = 131

/** §102.2's ~640, after §134.3 cut the victory copy. */
export const PROSE_WORDS: number = PROSE.reduce((n, p) => n + p.words, 0)
export const PROSE_BUDGET = 640

export const labelsIn = (group: LabelGroup): readonly Label[] =>
  LABELS.filter((l) => l.group === group)

export const provenance: ProvenanceRecord = {
  LABELS: { kind: 'authored', system: 'ui', axes: ['provenance'], source: '§102.2', derivedFrom: 'definition' },
  PROSE: { kind: 'authored', system: 'ui', axes: ['provenance'], source: '§102.2, §133.4', derivedFrom: 'definition' },
  LABEL_COUNT: { kind: 'solved', system: 'ui', axes: ['provenance'], source: '§102.2', derivedFrom: 'definition', solvedBy: 'the length of LABELS, reported against LABEL_BUDGET rather than asserted equal to it' },
  LABEL_BUDGET: { kind: 'authored', system: 'ui', axes: ['provenance'], source: '§102.2', derivedFrom: 'definition' },
  PROSE_WORDS: { kind: 'solved', system: 'ui', axes: ['provenance'], source: '§102.2', derivedFrom: 'definition', solvedBy: 'the sum of every prose surface word budget, which is what §23 task 17 costs at ~200 words an hour' },
  PROSE_BUDGET: { kind: 'authored', system: 'ui', axes: ['provenance'], source: '§134.3', derivedFrom: 'definition' },
  labelsIn: { kind: 'solved', system: 'ui', axes: [], source: '§141.4', derivedFrom: 'definition', solvedBy: 'LABELS filtered by group — the runtime string table a locale replaces wholesale' },
}
