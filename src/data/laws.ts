import type { ProvenanceRecord, System } from './meta.ts'

/**
 * §114.4 — the sixth canonical home, and the one that took longest to notice.
 *
 * §75.2 found that constants, assertions and progress each had a home and decisions
 * had none. The same question, asked of the thing this plan produces most: **it has
 * written seventy-nine standing laws and had no index of them.** One every 2.4
 * passes, each written at the moment a violation was found — and then left in the
 * prose of the section that discovered it, filed under the accident rather than
 * under the principle, where the next pass cannot see it.
 *
 * That is exactly how a mode deleting twenty-one systems survived forty-four passes
 * (§114.3) and how two unfinished components survived twenty-one (§113.2).
 *
 * `DECISIONS.md` says what WAS decided. This says what may never be done.
 *
 * SEEDED PARTIAL, AND SAYING SO. §114.4's sweep counted seventy-nine standing laws
 * across the plan; fifty-one are here — the ones that govern code that exists or that
 * the next commit touches. The remainder land with their systems, and the count is
 * reported by the phase-boundary sweep rather than assumed complete, because a file
 * that looks finished and is not is the failure §71.2 seeded the assertion manifest
 * complete-and-empty to avoid. A law is not like an assertion, though: an empty
 * assertion is a placeholder and an empty law is nothing at all, so this one grows.
 *
 * §114.5 splits them, and the split decides the resume cost (§135.3): an `enforced`
 * law points at the assertion that fails the build for it and therefore does not
 * need reading, while a `judgment` law cannot be tested and must be. A session's
 * resume set carries the judgment half only — ~616 tokens against 2,212.
 */
export type Enforcement = 'enforced' | 'judgment'

export interface Law {
  readonly id: string
  readonly system: System | 'build'
  readonly enforcement: Enforcement
  /** The pass that established it. */
  readonly source: string
  readonly law: string
  /**
   * The violation that produced it. §114.4: a law with its precedent attached is one
   * a session can apply to a case it has not seen — which is the whole reason the
   * file is worth its tokens.
   */
  readonly precedent: string
  /** For an enforced law, the assertion that fails the build. */
  readonly assertion?: string
}

export const LAWS: readonly Law[] = Object.freeze([
  // ───────────────────────────────────────────────── the derivation family
  {
    id: 'L-001', system: 'build', enforcement: 'judgment', source: '§35.3',
    law: 'When a foundational constant changes, every number calibrated against it is suspect until re-checked — and assert the INVARIANT, never the value.',
    precedent: '§31.1 changed Coolant Reserve to reduce generation rather than level, kept the flat -1 per rank against a base of 3, and rank 3 therefore switched the game\'s central mechanic off entirely. Introduced by a fix rather than surviving from a draft.',
  },
  {
    id: 'L-002', system: 'heat', enforcement: 'enforced', source: '§58.7',
    law: 'A threshold is meaningful only relative to the range of values that can actually reach it, so it is validated against region CAPACITY and re-run whenever a geometry changes.',
    precedent: 'Ring\'s thresholds were never edited and never wrong on their own terms; the shape they applied to was never counted. 0 of 84 legal region loadouts could reach overclock, so a 4,500-salvage core shipped with the game\'s central mechanic switched off.',
    assertion: 'A-021',
  },
  {
    id: 'L-003', system: 'build', enforcement: 'judgment', source: '§59.6',
    law: 'When the binding constraint changes units, every balance claim denominated in the old unit is re-derived — including the ones that were correct.',
    precedent: 'Heat replaced cells as the scarce resource and every "X is worth taking" judgement in the plan had been priced in cells. Gain then dominated 21 of 21 cases, stranding four evolutions behind amplifiers nobody would draft.',
  },
  {
    id: 'L-004', system: 'build', enforcement: 'enforced', source: '§61.5, §96.6, §131.6',
    law: 'Every constant declares its system, its axes, the model version it was derived against, whether it is authored or solved, and — if solved — the procedure that emits it.',
    precedent: 'Four consecutive passes (§58-§61) chased one model rewrite outward at roughly one system per pass. A version stamp fails everything downstream simultaneously instead.',
    assertion: 'A-004',
  },
  {
    id: 'L-005', system: 'build', enforcement: 'judgment', source: '§92.2',
    law: 'A baseline may never be moved to accommodate the change it is measuring. If a change breaches an invariant, the invariant has done its job.',
    precedent: '§91.4 re-based §83.1\'s draft invariant onto the new pool size, which made the drift definitional and stopped the band firing on the change it exists to catch.',
  },
  {
    id: 'L-006', system: 'build', enforcement: 'judgment', source: '§145.6',
    law: 'An addition is costed against the INCREMENT and never against the total, and the total is recomputed rather than restated.',
    precedent: 'Twenty passes added 7.3-10.6 sessions while declaring §21\'s 19-24 unchanged. Each judgment was defensible alone; "not a whole session" twenty times is seven to eleven sessions.',
  },
  {
    id: 'L-007', system: 'build', enforcement: 'judgment', source: '§147.5',
    law: 'When a system is generalised to a new class of input, its founding ASSUMPTION is re-checked and not only its capacity.',
    precedent: '§141 shipped Simplified Chinese one pass after §140.2 designed a bounded glyph atlas, asked how many bytes a CJK font is, and never asked whether a bounded atlas is bounded for a logographic script. Three of six passes found this shape.',
  },

  // ───────────────────────────────────────────────── the measurement family
  {
    id: 'L-010', system: 'build', enforcement: 'judgment', source: '§89.5',
    law: 'A gate may only measure something the player experiences. Everything else explains.',
    precedent: '§33.3\'s DPS band would have buffed the two best defensive components and nerfed the two whose high damage compensates for defending nothing, flattening the range-versus-safety trade it could not see.',
  },
  {
    id: 'L-011', system: 'build', enforcement: 'enforced', source: '§93.1, §120.7',
    law: 'Every acceptance band states the bot policy AND the duty rating it is measured under; variety is measured adversarially under the strongest known policy, never averaged.',
    precedent: 'The same roster passes §13\'s pick-rate band at 9.9-10.1% under a random bot and fails it with three components under 4% under a greedy one. §91.5 then wrote a variety band with the same dependency one pass after §90 diagnosed it.',
    assertion: 'A-026',
  },
  {
    id: 'L-012', system: 'build', enforcement: 'judgment', source: '§94.3',
    law: 'A band computed from the data tables is safe; a band computed from a simulated run needs a policy; a band describing what a player DOES rather than what the game PERMITS is rewritten as a capability.',
    precedent: '§37.3 asserted the player must be caught once a minute after 3:00. An expert fails it at minutes 5 and 10 for playing well, and the indicated fix would undo the Swarmer-versus-player margin that made the horde threatening at all.',
  },
  {
    id: 'L-013', system: 'build', enforcement: 'judgment', source: '§143.6',
    law: 'A measuring instrument is specified to the same standard as the thing it measures.',
    precedent: '§15\'s evaluator had two undefined terms and a nameless weight, was called by four systems, and optimised a metric §89.3 had retired fifty-six sections earlier — in a plan that specified the colour of a wreck.',
  },
  {
    id: 'L-014', system: 'build', enforcement: 'judgment', source: '§121.5',
    law: 'A crude model that produces an unstable answer is REPORTED as unstable, never tuned until it agrees.',
    precedent: '§54.4: a verdict was written into an analysis script above the output that refuted it, at pass twenty-three, with every prior lesson in view.',
  },
  {
    id: 'L-015', system: 'build', enforcement: 'enforced', source: '§149.6',
    law: 'Every check declares its cadence, and a cadence is costed in wall clock before it is committed to.',
    precedent: '§17, §40.3 and §63.5 gave the same 200-run smoke tier three different clocks 40x apart, and §143.5 costed a month against the most expensive of the three. A gate whose cost nobody measures is a gate somebody eventually stops running.',
    assertion: 'A-016',
  },

  // ───────────────────────────────────────────────── the specification family
  {
    id: 'L-020', system: 'build', enforcement: 'enforced', source: '§63.3',
    law: 'Code is the specification and the document is a rendered view of it. A session that changes a number changes it in exactly one place.',
    precedent: 'Transcription across twenty memoryless sessions is precisely the mechanism by which a specification and its code diverge.',
    assertion: 'A-002',
  },
  {
    id: 'L-021', system: 'build', enforcement: 'enforced', source: '§71.2',
    law: 'An assertion with no test fails the build, and a test with no assertion fails it too.',
    precedent: '899 words of checks in a single paragraph could not answer how many there were, which phase each belonged to, or which were done.',
    assertion: 'A-016',
  },
  {
    id: 'L-022', system: 'build', enforcement: 'judgment', source: '§84.1',
    law: 'A decision is not settled until it is INDEXED. `DECISIONS.md` is the source, and the prose section is the rationale written after.',
    precedent: 'The index was 46% out of date eight passes after it was created, because it had been written as a summary of what had happened rather than as the place a decision is made.',
  },
  {
    id: 'L-023', system: 'build', enforcement: 'enforced', source: '§136.5, §147.5',
    law: 'An artifact that is READ may be prose; an artifact that is EXECUTED must be generated or version-stamped. A file is generated, authored or a source — and where it is more than one, the regions are marked and enforced both ways.',
    precedent: 'Six canonical homes could not drift and three could: the run narrative (58 passes), the commit order (65) and the reconciliation baseline (64). All three are things a session ACTS on — and a reference that drifts gives a wrong answer to a question someone asked, while an instruction that drifts is simply followed.',
    assertion: 'A-003',
  },
  {
    id: 'L-024', system: 'build', enforcement: 'judgment', source: '§135.4',
    law: 'A canonical home is a BUDGET, not just a location. A home over its token ceiling is partitioned by system, never trimmed.',
    precedent: '§63.4 costed the resume set at ~6,100 tokens and never measured it again; seventy-two passes later it was 32,384, and `src/data/` alone was three times the whole original budget.',
  },
  {
    id: 'L-025', system: 'build', enforcement: 'judgment', source: '§102.6',
    law: '"Routine" in a plan is a load-bearing assumption wearing a dismissal. So are "trivial", "just a form" and "an implementation detail".',
    precedent: '§100.4 called Steam\'s forms routine and §19\'s tree called the name generator `names`. Behind them were 688 words of tone-critical prose and a published wire format.',
  },
  {
    id: 'L-026', system: 'build', enforcement: 'judgment', source: '§138.6',
    law: 'A deliverable assigned to someone else needs a SPECIFICATION, not a brief.',
    precedent: 'The store capsule had five validated sizes and the trailer had one sentence. Everything on my side of §18\'s boundary was specified to the pixel and everything on the human\'s side was a note.',
  },
  {
    id: 'L-027', system: 'build', enforcement: 'enforced', source: '§148.6',
    law: 'A plan names its PRODUCTS, not only its features — and every dated commitment names the product it needs and the phase that produces it.',
    precedent: '§100.6\'s Deck submission and §146.4\'s Next Fest were both scheduled two phases before the build either one requires, and §146.4\'s safety net named a web URL where a fest needs a demo app on a depot.',
    assertion: 'A-039',
  },

  // ───────────────────────────────────────────────── the simulation family
  {
    id: 'L-030', system: 'field', enforcement: 'enforced', source: '§14',
    law: 'The simulation uses only + - * / %, comparisons and Math.sqrt. No transcendental, no Math.random, no iteration over object or Set/Map key order in an order-sensitive path.',
    precedent: 'IEEE-754 does not specify Math.sin. One call in the simulation silently desynchronises every replay, and the failure looks like a mysterious bug rather than a spec violation.',
    assertion: 'A-006',
  },
  {
    id: 'L-031', system: 'field', enforcement: 'enforced', source: '§142.6',
    law: '`core/loop` is GENERATED from the tick manifest. A simulation module declares its step and the world attributes it writes, or it fails the build.',
    precedent: '§26 wrote "ordering IS the simulation\'s semantics and a reordering is a silent desync" and then sat in a paragraph while twenty-two tick-ordered behaviours were added, FOURTEEN with no step. The one that was ever checked was checked by accident.',
    assertion: 'A-012',
  },
  {
    id: 'L-032', system: 'field', enforcement: 'enforced', source: '§142.4',
    law: 'The time-scale is a TICK GATE — target interval `16.67 ms / scale` — and never a `dt` multiplier.',
    precedent: '"20% time" appears forty times with no stated relationship to the fixed 60 Hz step §14 depends on. Scaling `dt` makes the golden hash a function of frame timing; §99.3\'s paused is the case that proves the choice, since zero ticks is trivially deterministic where a zero multiplier is a special case.',
    assertion: 'A-011',
  },
  {
    id: 'L-033', system: 'build', enforcement: 'judgment', source: '§147.3',
    law: 'A timing constant declares its LAYER: simulation timings in ticks, presentation timings in wall clock.',
    precedent: '§30\'s input buffer is six ticks and §29\'s 40 ms audio retrigger floor is milliseconds. Stated in ticks the second would stretch to 200 ms on the board at 20% time and muffle the game for no reason.',
  },
  {
    id: 'L-034', system: 'build', enforcement: 'enforced', source: '§111.5, §130.6',
    law: 'Every attribute is `stored` or `derived`. An effect writing to a derived one names its distribution rule; an effect writing to a per-object one names its selector, and any band derived from it is computed at that scope.',
    precedent: '"-5 heat from your hottest region" was undefined by a factor of NINE, and §54.3\'s wear was scoped per component in its sentence and per board in its table three lines below — a 1.2x to 2.0x disagreement that stood for seventy-six passes.',
    assertion: 'A-030',
  },
  {
    id: 'L-035', system: 'field', enforcement: 'enforced', source: '§60.2',
    law: 'A component\'s heat generation clamps at its passive floor, never at zero. No quantity of cooling, at any rank, in any combination, can make a region thermally inert.',
    precedent: 'The Sink\'s -3 per cell was set against a model where an emitter generated a flat 3. After §50 it exceeded any emitter\'s entire generation — so one free piece, handed to every player by level four, switched the game\'s central mechanic off.',
    assertion: 'A-022',
  },
  {
    id: 'L-036', system: 'field', enforcement: 'enforced', source: '§17',
    law: 'Every pool is allocated at boot and never grown during a run. A full pool refuses the spawn and counts the refusal.',
    precedent: 'Allocating mid-run is a garbage-collection pause inside a 16.7 ms frame on the primary venue.',
    assertion: 'A-042',
  },
  {
    id: 'L-037', system: 'build', enforcement: 'enforced', source: '§66.2',
    law: 'Every imported code carries a version and a checksum, and is REJECTED rather than clamped.',
    precedent: 'The simulation is deterministic, so a silently-clamped field does not throw — it produces a board that differs from the sender\'s, deterministically, forever, and the recipient cannot know. That reads as "the game is broken", which is the one emotion §2\'s watchlist singles out as review-converting.',
    assertion: 'A-010',
  },
  {
    id: 'L-038', system: 'build', enforcement: 'enforced', source: '§145.4',
    law: 'Layering: `data/`, `gen/` and `core/`\'s pure half are leaves; `grid/` and `game/` never import each other and are wired by the generated loop; `render/` reads a snapshot and never writes; `core/loop` is the only module allowed to cross systems, and it is the one nobody hand-writes.',
    precedent: 'There was no dependency rule anywhere in 144 sections, so a session working on `heat` read 35 modules and 73,138 tokens before writing a line. And §14 stated the render half in one line that nothing enforced.',
    assertion: 'A-041',
  },

  // ───────────────────────────────────────────────── the design family
  {
    id: 'L-050', system: 'field', enforcement: 'judgment', source: '§1.4',
    law: 'Does this deepen the feeling of riding a machine you built at the edge of catastrophe? If yes, take it. If neutral, take it only if cheap. If it dulls the edge, restores safety for free, or takes credit from the player — cut it, however fun it seems in isolation.',
    precedent: 'The Ring core was specified as making heat "almost free", deleting the central experience for anyone who unlocked it.',
  },
  {
    id: 'L-051', system: 'draft', enforcement: 'judgment', source: '§5',
    law: 'No mechanic may exist purely to make another mechanic work.',
    precedent: 'Conduits and heatsinks were described as "the boring pieces that make the interesting ones work" — approvingly — which meant a third of draft offers were designed to disappoint.',
  },
  {
    id: 'L-052', system: 'draft', enforcement: 'judgment', source: '§4',
    law: 'Transparent rules, opaque combinations. Hidden effects are always beneficial or neutral, never punishing.',
    precedent: 'A hidden bonus is a delight; a hidden penalty is a betrayal, and betrayal is the emotion that converts to a negative review.',
  },
  {
    id: 'L-053', system: 'ui', enforcement: 'enforced', source: '§69.2',
    law: 'Discovery is hidden; arithmetic never is. A mechanic the player has met is fully inspectable with its real numbers from that moment on.',
    precedent: 'A placement decision needs eight quantities and the game showed ONE. The other seven were computed sixty times a second and thrown away.',
    assertion: 'A-020',
  },
  {
    id: 'L-054', system: 'ui', enforcement: 'enforced', source: '§109.7, §128.6',
    law: 'Every attribute the simulation computes is shown or explicitly `withheld` with a reason — and every attribute that can IMPROVE declares the surface that announces the improvement. There is no third category.',
    precedent: 'Wear decides whether a run ends at minute sixteen and was invisible until it had already decided. The free tray delivers ten rewards a run in total silence, and §122.6 then made every held piece silently double in strength.',
    assertion: 'A-031',
  },
  {
    id: 'L-055', system: 'draft', enforcement: 'enforced', source: '§59.5, §34.3',
    law: 'No component may be dominated by another of the same class, and the check runs on every component the moment it is added. A dominated component that gates other content is a deadlock.',
    precedent: 'Built twice: amplifiers were dominated by emitters (§34.3), then Gain dominated the other amplifiers in 21 of 21 cases (§59.1), then Governor was dominated by Gain at every width with two evolutions hostage to it (§122.4).',
    assertion: 'A-024',
  },
  {
    id: 'L-056', system: 'draft', enforcement: 'enforced', source: '§113.6',
    law: 'A roster is a list of COMPLETE components: L1 through L5 and an evolution with its required amplifier are non-nullable.',
    precedent: '§92 added four components and finished two. Warden and Bore had a shape, a draw, a damage and a rule, and no long-range plan at all for 22% of the roster.',
    assertion: 'A-029',
  },
  {
    id: 'L-057', system: 'build', enforcement: 'judgment', source: '§52.3, §117.5, §133.6',
    law: 'A mechanic must move a measured outcome by at least 4% AND be perceptible as an event at the rate it occurs. This applies to MECHANICS and never to texture.',
    precedent: 'Flash-freeze failed the first test twice and was redesigned; crit passed the first, failed the second at six invisible rolls a second, and was cut. Five instruments descended from this floor and not one of them stated a scope.',
  },
  {
    id: 'L-058', system: 'build', enforcement: 'enforced', source: '§133.6',
    law: 'A quirk is protected by an assertion that tests its ASYMMETRY, not its value — and every quirk with no guarding assertion is reported at each phase boundary.',
    precedent: '§108.1\'s corner economics would be deleted by a session normalising region heat by window size, and §58.7\'s ladder check would still pass because it tests occupancy and never position.',
    assertion: 'A-043',
  },
  {
    id: 'L-059', system: 'render', enforcement: 'enforced', source: '§134.6',
    law: 'A display channel declares the attribute it renders, `stored` or `derived`; the picture and the predicate drawn on it must be the same object.',
    precedent: '§85.1\'s channel table named "region heat" and §85.2\'s prose thirty lines later encoded "the cell\'s fill" — two quantities §15 makes differ by up to nine times, on the surface §68 calls the product.',
    assertion: 'A-033',
  },
  {
    id: 'L-060', system: 'render', enforcement: 'enforced', source: '§140.2, §147.1',
    law: 'No `fillText` on a frame that also renders entities. Every glyph and every fixed label is blitted from the boot-time atlas.',
    precedent: '§39.2 measured `fillText` at 10-50x a blit and fixed twelve glyphs. §140.5 counted what that became: 29 live text runs a frame worth 290-1,450 draw-equivalents against a 103-draw margin.',
    assertion: 'A-013',
  },
  {
    id: 'L-061', system: 'build', enforcement: 'judgment', source: '§47.5, §104.6',
    law: 'Every feature touches one of the six core pleasures or is invisible. The six: the overclock gamble, the meltdown scramble, the board coming online, stumbling into a synergy, recognising your own dead, being handed a problem you did not choose.',
    precedent: 'The Purge added a third combat verb requiring the player to stand still in a game explicitly about not being caught, to create a decision that was arithmetic rather than visceral. One pass of enthusiasm was all it took.',
  },
  {
    id: 'L-062', system: 'build', enforcement: 'judgment', source: '§104.8',
    law: 'A blocker recorded as permanent is a claim about the world and decays like any other; every deferred item records WHAT WOULD UNBLOCK IT, and the phase sweep re-checks the conditions rather than the items.',
    precedent: '§55.4 wrote "only the transport is missing" — a perfectly stated unblock condition, satisfied eleven sections later by a pass solving something else. Nothing was watching, so the feature stayed deferred for seventy passes after it stopped being blocked.',
  },
  {
    id: 'L-063', system: 'build', enforcement: 'judgment', source: '§100.7',
    law: 'A claim about the world carries the date it was checked, never reasoning. Availability, hardware, a service\'s retention rule and a partner site\'s size list are facts, not decisions.',
    precedent: 'The title was a registered trademark held by a software company, unchecked for a hundred sections — while the document\'s own bibliography carried a name-conflict citation for a candidate it had rejected.',
  },
  {
    id: 'L-064', system: 'build', enforcement: 'judgment', source: '§129.5',
    law: 'A lens is re-run whenever an object it audited changes, and the change carries the lens\'s name forward.',
    precedent: '§119 audited the daily\'s four inputs; three later passes amended its findings and a fifth input — arriving over the network and deciding 31-40% of a roster — was invisible to all of them.',
  },
  {
    id: 'L-065', system: 'field', enforcement: 'enforced', source: '§127.7',
    law: 'Every bounded activity declares the predicate that ends it, and `player success` is not one.',
    precedent: 'THE FOUNDRY had no end condition: §48.1 stops spawning at 20:00 and §122.5 designs a cold board to walk through P3 untouched, so a competent mover with weak damage fought a boss that could not kill them, indefinitely.',
    assertion: 'A-034',
  },
  {
    id: 'L-066', system: 'build', enforcement: 'judgment', source: '§137.6, §144.6',
    law: 'A growth mechanism is a number or it is a hope, and a price is a SCHEDULE rather than a number.',
    precedent: 'The share loop got seven passes of specification and zero multiplications; measured, it is an amplifier that can never be a source. And every revenue figure was a US list price with no discount, no rise and no regional table in it.',
  },
  {
    id: 'L-067', system: 'build', enforcement: 'judgment', source: '§146.6',
    law: 'An external deadline is an ANCHOR, never an output. A plan whose every date is relative has no dates.',
    precedent: 'Next Fest appears seventeen times and every one says "between phases 5 and 6", in a plan whose session estimate has been revised four times upward and whose author states that sessions are not days.',
  },
  {
    id: 'L-068', system: 'ui', enforcement: 'judgment', source: '§107.7',
    law: 'Every judgment the game makes answers two questions: is it fair, and does it tell the player what to do differently? One that survives the first and fails the second is decoration.',
    precedent: 'The fault-trace solver finds a surviving arrangement of the components the player held, prints a timestamp, and throws the board away.',
  },
  {
    id: 'L-069', system: 'build', enforcement: 'judgment', source: '§131.8',
    law: 'A rule that reads world state GENERATES; a rule that reads an id does not. A design whose authored rows grow faster than its generative rules is buying content instead of a game.',
    precedent: '192 authored rows against six rules that generate — and every emergent property the document is proudest of came from the six, all nine discovered after the fact. It predicts which of the six synergies broke: the three that are conditional bonuses.',
  },
  {
    id: 'L-070', system: 'build', enforcement: 'judgment', source: '§57.3, §148.6',
    law: 'An interaction between systems belongs to no system\'s spec and needs its own test.',
    precedent: 'Onboarding was specified carefully and anomalies were specified carefully; onboarding-WITH-anomalies belonged to neither, and 12.5% of new players met a broken first run.',
  },
  {
    id: 'L-071', system: 'build', enforcement: 'enforced', source: '§145.4, §148.4',
    law: 'A document source is not a runtime import, and a build manifest is not simulation data: neither reaches the shipped bundle, and neither enters the content hash.',
    precedent: 'Registering the laws, the decisions, the schedule and the asset manifest beside the constants put 58 KB of prose into a build whose argument is that it loads in a second, carried every forbidden symbol\'s own name into the bundle that forbids it, and would have made a reworded law invalidate every replay, snapshot and share code in existence.',
    assertion: 'A-014',
  },
])

export const enforced = (): readonly Law[] => LAWS.filter((l) => l.enforcement === 'enforced')
export const judgment = (): readonly Law[] => LAWS.filter((l) => l.enforcement === 'judgment')

export const provenance: ProvenanceRecord = {
  LAWS: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§114.4', derivedFrom: 'definition' },
  enforced: { kind: 'solved', system: 'build', axes: [], source: '§114.5', derivedFrom: 'definition', solvedBy: 'LAWS filtered to enforcement === enforced' },
  judgment: { kind: 'solved', system: 'build', axes: [], source: '§114.5, §135.3', derivedFrom: 'definition', solvedBy: 'LAWS filtered to enforcement === judgment — the half a resume set carries, since the other half fails the build by itself' },
}
