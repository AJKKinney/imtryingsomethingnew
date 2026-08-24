import type { ProvenanceRecord, System } from './meta.ts'

/**
 * §75.3, §84.1 — the fourth canonical home, and the one that changed shape once.
 *
 * §75.1 measured what a document that supersedes itself does to a reader: eleven
 * places where going to the obvious section for a topic returns a **confidently
 * wrong answer**, and four out of five settled decisions overwriting an earlier one.
 * A session told to "read the relevant section" was being told something unsafe.
 *
 * §84.1 then found the index 46% out of date eight passes after it was built, and
 * fixed the cause rather than the contents: **the index is the SOURCE, not a summary
 * of one.** A decision is not settled until it is here; the prose section is the
 * rationale, written afterwards. That is the same inversion §63.3 made for constants
 * and §71.2 for assertions, arriving at the category that took longest because a
 * decision LOOKS like prose in a way a constant does not.
 *
 * §135.3 partitions it by §96.6's system tag. A session reads the one-line index of
 * every decision plus the full rows for the two or three systems its slice touches —
 * 3,980 tokens against 8,364, which is what keeps §63.4's resume budget honest.
 *
 * SEEDED PARTIAL, AND SAYING SO. The plan carries 246 indexed decisions; what is
 * here is every decision governing code that exists or that the next commit touches,
 * which is what §135.3's partition means a session actually loads. The rest arrive
 * with their systems. The phase-boundary sweep reports the gap.
 */
export interface Decision {
  readonly topic: string
  /** The section that CURRENTLY owns it — never the first section that mentions it. */
  readonly owner: string
  readonly system: System
  readonly decision: string
  /** What this overwrote. §75.1: four out of five settled decisions supersede one. */
  readonly supersedes?: string
  /**
   * §100.7 — a claim about the world carries the date it was checked. An entry whose
   * source is REASONING rather than an external check is flagged by the sweep.
   */
  readonly verifiedAgainst?: string
}

export const DECISIONS: readonly Decision[] = Object.freeze([
  // ───────────────────────────────────────────────────────────────── heat
  { topic: 'heat model', owner: '§51.2', system: 'heat', supersedes: '§31.1, §8',
    decision: 'Emitter generation is `1.0 passive + (0.3 + 0.12 x targets hit)` PER SHOT, so heat tracks work done rather than layout — and a fixed board heats up as the run escalates with no scaling rule, because the crowd does it.' },
  { topic: 'heat dissipation', owner: '§31.1', system: 'heat',
    decision: '`dH/dt = generation - (2/3)H`, equilibrium `generation x 1.5`, time constant 1.5 s. Without dissipation every build melts within six seconds regardless of design, which makes heat weather rather than a decision.' },
  { topic: 'heat thresholds', owner: '§72.3', system: 'heat', supersedes: '§43.3, §58.5',
    decision: 'The per-core pairs are PRIORS and the assertion is the LADDER SHAPE: three average emitters safe, four and five stably overclocked, six melting; four Arcs melting and three not. The first real sweep solves for whatever thresholds produce it.' },
  { topic: 'overclock feedback', owner: '§58.1', system: 'heat',
    decision: 'Overclock grants +50% rate AND damage, so it raises the region\'s own generation by x1.16-1.33 — computed for the first time fifty-two sections after both rules were written.' },
  { topic: 'overclock hysteresis', owner: '§110.2', system: 'heat',
    decision: 'Enter at `H >= threshold`, leave at `H <`, with NO separate exit value and no debounce. The x1.26 feedback makes both crossings self-reinforcing and both states stable for generation in [5.29, 6.67] — thermal momentum, which looks exactly like a bug a future session would fix.' },
  { topic: 'cooling floor', owner: '§60.2', system: 'heat', supersedes: '§8.2, §15',
    decision: 'Generation clamps at the 1.0 passive term, never at zero. Sink -0.5 to -1.2 per covered cell, Radiator -0.8 to -2.0; both generate no heat of their own.' },
  { topic: 'region-level effects', owner: '§111.2', system: 'heat', supersedes: '§15',
    decision: 'A change of Delta to a region distributes across that block\'s occupied cells in proportion to current heat; the named region moves by exactly Delta and a neighbour by `Delta x shared / 9`. Two effects write to region heat and neither said which — an ambiguity worth x9 on the vent-dash.' },
  { topic: 'runaway regions', owner: '§116.4', system: 'heat',
    decision: 'A region whose EQUILIBRIUM exceeds meltdown does not melt once — it cycles at 39% uptime, 20% of max integrity every 8.1 s, fatal in ~41 s. The only escape is §112.2\'s move verb.' },
  { topic: 'support rank', owner: '§122.6', system: 'heat',
    decision: '`ceil(level / 8)`, ranks 1-5, shared by every piece held. Every support component carried a range and nothing in 121 sections said how a rank was reached.' },
  { topic: 'the fourth heat verb', owner: '§108.5', system: 'heat', supersedes: '§60.4',
    decision: 'Four verbs, not three: build, buy, act, MOVE. Heat\'s work term reads a field quantity, so disengaging drops generation toward the floor — your position is a thermostat.' },

  // ───────────────────────────────────────────────────────────────── power / board
  { topic: 'power propagation', owner: '§15', system: 'power',
    decision: '0-1 BFS with a deque over occupied cells; a conduit costs 0 to enter and anything else 1. Power at a cell is `coreOutput - dist`, and a component runs at `clamp(delivered / draw, 0, 1)`.' },
  { topic: 'power recompute trigger', owner: '§142.2', system: 'power', supersedes: '§15',
    decision: 'Recomputed when a POWER INPUT changes — occupancy, core output, or the cell mask — flagged this tick and consumed at step 5 of the next. "When the board changes" could not fire §131.5\'s blackout or §120.5\'s mid-fight expansion.' },
  { topic: 'offline components conduct', owner: '§142.2', system: 'power',
    decision: 'An offline component still occupies its cell and still carries power, so a meltdown never severs the graph. Derived from §8\'s region scope, §2\'s legible-cause rule and §135.1D.' },
  { topic: 'core outputs', owner: '§33.1', system: 'power', supersedes: 'the original 10/12/16',
    decision: 'Lattice 6, Spindle 6, Ring 9 — roughly half the original, because at the old values the worst cell on every core still fully powered the hungriest component and power never bound at all.' },
  { topic: 'board expansion geometry', owner: '§108.3', system: 'board', supersedes: '§8, §35.2',
    decision: 'Explicit per core: Lattice four nubs at the edge midpoints, Spindle each arm 3 to 4, Ring four cells at the side midpoints one step OUTWARD. Which four was never stated for a hundred sections while §58.7 made the heat ladder depend on it — and Ring\'s max region occupancy goes 4 to 5, inheriting Spindle\'s already-solved 7/19.' },
  { topic: 'the move verb', owner: '§112.2', system: 'board', supersedes: '§7.2B, §12',
    decision: 'A placed component can be picked up and re-placed anywhere legal, keeping its level, whenever the board is open. For 111 sections the only way to change a layout was to destroy part of it at ~10% of a run\'s progression, which made the board append-only in a game whose premise is arrangement.' },
  { topic: 'heat ownership', owner: '§112.4', system: 'board',
    decision: 'Heat is owned by the COMPONENT and travels with it. Taken the other way the move verb would let a player zero a region by shuffling, which is §60.1\'s off-switch arriving by a different route.' },
  { topic: 'the board is the product', owner: '§68.2', system: 'board', supersedes: '§3.H, §20',
    decision: 'A build-craft puzzle with real-time pressure, not a podcast survivors-like. Tags, comparison set and store copy follow; auto-placement\'s "podcast venue" justification is retired and it stands on onboarding and accessibility, which are real.' },
  { topic: 'board render channels', owner: '§85.2', system: 'render', supersedes: '§85.1',
    decision: 'Power is the TRACE\'S WIDTH (`delivered / draw`); heat is the cell fill; component identity is a glyph from the enemy grammar constrained symmetric/closed/axis-aligned; amplifiers draw a connector per boosted emitter; a discovered synergy notches its cells. All seven channels survive total colour loss.' },
  { topic: 'what the cell fill renders', owner: '§134.2', system: 'render', supersedes: '§85.2',
    decision: 'The DERIVED region heat — §15\'s 3x3 sum — not the stored per-cell scalar. Because that is a box blur of the field, the region, the seam, a corner\'s clipped window and the overclock contour all draw themselves, and four mechanics stop resting on a shape no channel ever drew.' },

  // ───────────────────────────────────────────────────────────────── field
  { topic: 'enemy speeds', owner: '§37.1', system: 'field', supersedes: 'the original table',
    decision: 'Swarmer 170 — FASTER than the player\'s 150, so it cannot be outrun, only killed. Every enemy in the first draft was slower, which made walking in a straight line the optimal strategy and the entire threat model decorative.' },
  { topic: 'i-frames and contact', owner: '§37.2', system: 'field',
    decision: 'GLOBAL 0.5 s i-frames, and the damage taken is the single HIGHEST contact value among overlapping enemies. Per-enemy i-frames make twenty Brutes 780 damage in a tick; global with no further rule makes twenty Brutes equal to one.' },
  { topic: 'despawn', owner: '§109.4', system: 'field', supersedes: '§9\'s "silently"',
    decision: 'Beyond 1.5x the camera radius, enemies DISSOLVE VISIBLY and grant nothing. §31.2 makes the rule load-bearing — survival pressure sets required DPS, not spawned HP — so a player who thinks they must kill everything plays a harder game than the one that exists, and despawn is a rule.' },
  { topic: 'the wave mix', owner: '§118.2', system: 'field', supersedes: '§10\'s windows',
    decision: 'PROPORTIONS per band, not availability windows. Three honest readings of the old sentence spanned a 3.4x swing in total spawned HP — an input to the heat model, the load ratio, the defence model and both budgets.' },
  { topic: 'shard and salvage values', owner: '§118.3', system: 'field', supersedes: '§9\'s ranges',
    decision: 'Valued by enemy TIER rather than rolled: Swarmer 1, mid-tier 3, Charger 5, Brute 6. Mean 2.456 against §105.3\'s required 2.458 — and it turns the game\'s largest source of pure noise into a reward for positioning, the only targeting a player without manual aim has.' },
  { topic: 'the elite', owner: '§132.2', system: 'field', supersedes: '§15, §4, §35.2, §120.4',
    decision: 'The rare variant IS the elite: x5 HP, x1.25 speed, x1.5 contact, x5 tier value, on §15\'s asymmetric branch. Three systems depended on an entity no section defined — one element rated 0 and one rated 1 became one rated 5.' },
  { topic: 'the Foundry\'s end condition', owner: '§127.2', system: 'field',
    decision: 'The P3 vents step +1 region heat every 15 s from 1.5x the fight\'s target length at that duty rating, uncapped — the fight\'s only terminator, bounding every legal board near 236 s, and far enough out that a competent player never learns it exists.' },
  { topic: 'no manual aim', owner: '§112.6', system: 'field',
    decision: 'Declined on the record. §111.1 fixes the real-time layer at two verbs; a third would turn pressure into execution, which is the genre §68 repositioned away from.' },
  { topic: 'no crit', owner: '§117.5', system: 'field', supersedes: '§9',
    decision: 'Cut, and base damage NOT compensated because the model never included it. A 5% x2 roll is six invisible events a second at late-run hit rates, it appeared in no derived quantity, and it made the game 5-25% stronger than every table it was balanced against.' },
  { topic: 'the arena boundary', owner: '§108.4', system: 'field', supersedes: '§12',
    decision: 'The substrate ending — traces stop, the ground goes dark — and a hard wall the player slides along that NEVER deals damage. §38.4 already puts the danger at the edge, and a hostile boundary is §2\'s "cheated".' },

  // ───────────────────────────────────────────────────────────────── draft
  { topic: 'the drafted roster', owner: '§131.2', system: 'draft', supersedes: '§91.4',
    decision: 'FOURTEEN, and the fourteenth is `SIPHON`. §91.4 counted Damper — a support piece §5.2A bars from the draft — so the pool was 13 while five bands were computed at 14 for thirty-nine passes. Closed by shipping the fourteenth rather than re-deriving the bands.' },
  { topic: 'level rule', owner: '§8.2', system: 'draft',
    decision: 'L1 base, L2 +25% damage, L3 behaviour change, L4 +25% damage and +1 heat, L5 second behaviour change and evolution-eligible.' },
  { topic: 'evolution consumes its amplifier', owner: '§49.1', system: 'draft', supersedes: '§8.2',
    decision: 'The amplifier is absorbed into the evolved component, which caps evolutions at the number of amplifiers placed. At cap 40 with a level requirement the player evolved five in 88% of runs — the capstone became the floor.' },
  { topic: 'evolution requirements visible from L1', owner: '§103.5', system: 'draft', supersedes: '§8.2',
    decision: '`-> RAILGUN · needs GAIN L3+ adjacent`, on the card, in inspect mode and in the codex. §44.4 calls evolution an eight-pick plan and the old `?` hint fired at pick seven.' },
  { topic: 'amplifier pricing', owner: '§59.3', system: 'draft', supersedes: '§34.3, §8.2',
    decision: 'Gain +40 to 60% damage with self-heat `0.5 + 0.5 x adjacent`; Clock +60 to 80% rate; Focus +50 to 70% area. A damage multiplier is thermally free per shot, so the price sits on the amplifier — without it Gain wins 21 of 21 cases and strands four evolutions.' },
  { topic: 'Governor', owner: '§122.5', system: 'draft', supersedes: '§92.3',
    decision: 'Keys on region OCCUPANCY: +140 to 210% damage, minus 40 to 55 points per additional emitter in that region, floored at zero, stacking with overclock. §92.3\'s "while below overclock" was strictly dominated by Gain at every width at identical cost, with two evolutions hostage to it.' },
  { topic: 'offer weight', owner: '§93.3', system: 'draft', supersedes: '§28, §83.1',
    decision: 'A new component weighs `2 x (10 / poolSize)^2` — squared, because a larger pool both increases new-component offers and dilutes each component\'s share of upgrade offers. Anchored permanently to the ten-component baseline (§92.2).' },
  { topic: 'the offer floor', owner: '§121.3', system: 'draft', supersedes: '§28',
    decision: 'A triple whose best-vs-worst marginal value is under §52.3\'s 4% floor is rejected and re-drawn. Measured: 19% of triples were flat, so forty interruptions produced thirty-two decisions.' },
  { topic: 'the run-one roster', owner: '§121.6', system: 'draft', supersedes: '§8.2',
    decision: 'Emitters Arc, Orbiter, Mine, Flak, Pulse; amplifiers Clock, Focus. DERIVED from five existing constraints rather than chosen, and never stated in 120 sections despite deciding the demo, the onboarding and §64.4\'s completion gate.' },
  { topic: 'free support is five, not four', owner: '§121.6', system: 'draft', supersedes: '§8.2',
    decision: 'Wire, Bus and Sink held from run one; Damper and Radiator earned by two thermal achievements. §8.2 read "Free (4)" and listed five from the moment §92.3 added Damper.' },
  { topic: 'Bus', owner: '§132.5', system: 'draft', supersedes: '§8.2',
    decision: 'A two-cell conduit and nothing more. The "+1 budget" clause is cut: undefined in both its appearances and unimplementable under 0-1 BFS, which forbids the negative edge weight it would need.' },

  // ───────────────────────────────────────────────────────────────── build / process
  { topic: 'the stack', owner: '§19', system: 'build',
    decision: 'TypeScript strict, Canvas 2D, Vite, Vitest, Playwright, Electron for Steam — and ZERO runtime dependencies, enforced. It is also the only stack verifiable in this container, since Chromium and Playwright are pre-installed.' },
  { topic: 'determinism policy', owner: '§14', system: 'build',
    decision: 'Only `+ - * / %`, comparisons and `Math.sqrt`; a 4096-entry baked sine table with linear interpolation; a polynomial `atan2`; no `Math.random`; no key-order iteration in an order-sensitive path; N/E/S/W neighbour order; total-order comparators tie-broken on entity id.' },
  { topic: 'the tick order', owner: '§142.5', system: 'build', supersedes: '§26',
    decision: 'Twenty-four steps, held as DATA in `src/data/tickorder.ts`, with `core/loop` generated from it. §26 wrote eighteen and twenty-two behaviours were added afterwards, fourteen with no step at all.' },
  { topic: 'the time-scale', owner: '§142.4', system: 'build', supersedes: '§9, §17, §99.3',
    decision: 'A TICK GATE — target interval `16.67 ms / scale` — never a `dt` multiplier. §30\'s input buffer is therefore SIX TICKS rather than 100 ms, and §149.3 runs the gate upward at x50 for the e2e harness.' },
  { topic: 'the clock\'s home', owner: 'commit 8', system: 'build', supersedes: 'commit 5',
    decision: '`TICK_MS` and its neighbours live in `core/tick`, a leaf. Defining them in the generated loop put every simulation module that integrates a delta on an import of the loop that imports them — the cycle §145.4 exists to forbid, and Node named it on the first run.' },
  { topic: 'input quantisation', owner: 'commit 8', system: 'build',
    decision: 'Axes are quantised to 127 steps AT THE BOUNDARY and the simulation sees the quantised value. Compressing the log afterwards would make it differ from the run it recorded, which is §26\'s desync with a codec in front of it.' },
  { topic: 'replay code size', owner: 'commit 8', system: 'build', supersedes: '§41.1',
    decision: 'MEASURED at 16,904 characters for a smooth stick, 22,028 for a keyboard and 22,592 for random input at §41.1\'s own event rate — about eight times its predicted ~2,500. The two-tier decision is unaffected and strengthened: the summary is the paste and the full replay is a FILE.' },
  { topic: 'sweep sharding', owner: '§143.5', system: 'build', supersedes: '§40.3, §63.5',
    decision: 'A function of the policy mix: release 16 shards, balance 8. lookahead-1 is 3.9x a normal run, which put the release tier at 6.56 h/shard against Actions\' 6-hour ceiling.' },
  { topic: 'CI cadence', owner: '§149.4', system: 'build', supersedes: '§17, §40.3, §63.5',
    decision: 'Push tier (~4 min): unit, solver, e2e, perf/build and every static check. Smoke (200 runs, ~18 min) follows `src/data/` rather than the commits. Phase boundary (~25 min) adds the nine sweep lines. Release (10,000 runs) twice in the project\'s life.' },
  { topic: 'the repository stays private', owner: '§63.5', system: 'build',
    decision: 'A public repository would give unlimited Actions minutes and make the project\'s authorship publicly discoverable, which §18 chose not to lead with. The overage is paid — ~$40-80 across the project (§149.5) — and the reason was never about money.' },
  { topic: 'the four products', owner: '§148.1', system: 'build',
    decision: 'playtest, web, Steam demo, Steam full — with twenty-three behaviours differing between them, declared in `src/data/builds.ts` with NO DEFAULT, because a default is how telemetry reaches the paid build.' },
  { topic: 'generated files are not committed', owner: '§147.2', system: 'build',
    decision: 'The three emitted files are named individually in `.gitignore` rather than the directory being ignored, because §19\'s tree puts the hand-written procedural generators in `src/gen/` too — ignoring the directory would have deleted `gen/shapes.ts` the first time it was written.', verifiedAgainst: 'commit 7' },

  // ───────────────────────────────────────────────────────────────── ui / render
  { topic: 'friend and foe', owner: '§46.2', system: 'render',
    decision: 'TWO channels, redundant on purpose: hue (cyan-to-white against amber-to-red, on the axis protanopia and deuteranopia preserve) and FORM (symmetric and closed against broken and open, which carries the read alone under tritanopia). One generator, and the constraint is the faction.' },
  { topic: 'the play area', owner: '§3.A', system: 'render',
    decision: 'A fair, fixed 640x360 for everyone; taller aspects fill the remainder with the machine bezel. 640x360 is 16:9 and the Deck is 16:10, so the game would have shipped dead black bars on its primary venue.' },
  { topic: 'the run clock', owner: '§105.1', system: 'ui', supersedes: '§3',
    decision: 'Elapsed time plus a marker filling toward the next named encounter, amber at ten seconds, counting DOWN from 18:00 — and during THE FOUNDRY the fight\'s elapsed time alone, since §48.1 leaves nothing to count toward and that figure is what §126.4\'s score reads. The run is built entirely of time gates and had no clock for a hundred sections.' },
  { topic: 'the level-up offer', owner: '§103.2', system: 'ui', supersedes: '§9, §28',
    decision: 'Three cards in the bezel at 20% time, never a modal, no timeout — each showing glyph, the exact level delta, draw and cells, the projected slot as a ghost, the region-heat delta there, and evolution progress. §28 is titled for the interaction and specified only its statistics.' },
  { topic: 'the event-cache rule', owner: '§140.5', system: 'render', supersedes: '§39.2',
    decision: 'A surface that changes on an EVENT renders offscreen and blits; a surface that changes on a TICK draws live. Five passes filled the bezel while §39.1 still budgeted it at one cached row of 7 draws, putting the full profile at 2,602 against a 2,600 ceiling.' },
  { topic: 'the particle cap follows attention', owner: '§140.5', system: 'render',
    decision: '400 while the board view is open. The board runs at 20% time and the player is looking at a grid, which takes the tightest frame in the game from a nine-draw margin to eight hundred.' },
  { topic: 'no main menu', owner: '§101.2', system: 'ui',
    decision: 'The Hall is the home screen. §55.3 made the loadout screen the graveyard for thematic reasons and deleted the main menu without saying so.' },
  { topic: 'three navigation idioms', owner: '§101.3', system: 'ui',
    decision: 'List, grid cursor, walked space — and no screen may invent a fourth. `B` always goes exactly one level up. That makes gamepad completeness a property of the construction rather than a test result, which matters because §100.6 submits for Deck Verification at the end of phase 4.' },
  { topic: 'the typeface', owner: '§140.2', system: 'render',
    decision: 'GENERATED: a 7x9 stroke table, ~900 bytes, emitted at build time by the tool that bakes §14\'s sine table — so §139.1\'s zero-asset-bytes claim and §18\'s all-algorithmic claim both stay literally true, and it is the same rule everything else in the game is drawn by.' },
  { topic: 'the boot atlas', owner: '§147.1', system: 'render', supersedes: '§140.2',
    decision: 'The locale-invariant Latin glyph set at three scales plus §102.2\'s 131 labels as WHOLE WORDS in the active locale — 0.8 MB in every locale, because a glyph set grows with the script and a label does not. CJK prose renders with `fillText` on entity-free screens only.' },

  // ───────────────────────────────────────────────────────────────── meta / economy
  { topic: 'mount points', owner: '§53.3', system: 'meta',
    decision: 'You own every upgrade you buy and may install only 2-4 per run, chosen at the loadout against a known core and anomaly. Without it, spending optimally beat spending as badly as possible by 2.7% — a purchase screen with no decision in it.' },
  { topic: 'the duty ladder', owner: '§120.4', system: 'meta', supersedes: '§11',
    decision: 'Ten upward rungs re-spread to the same total in steps of +0.04 to +0.09, every one inside the run. Four of §11\'s original ten did not raise difficulty at all and rung 10 alone carried half the total.' },
  { topic: 'the downward rungs', owner: '§123.4', system: 'meta', supersedes: '§99.3, §107.3',
    decision: '-20% contact damage, -8% enemy speed, -15% enemy speed with i-frames 0.5 to 0.9 s. All HANDS, none touching the board, so the puzzle at duty -3 is bit-for-bit the puzzle at duty 0. The old first rung cut required DPS by 15%, handing board relief to a player asking for relief from the reflex layer.' },
  { topic: 'assist earns content', owner: '§107.4', system: 'meta', supersedes: '§99.4',
    decision: 'Negative rungs earn every unlock a duty-0 run earns and do not earn claims. §79.2\'s unlocks are COMPONENTS, so the old rule read: you are finding this hard, so you may not have more of the thing that makes it easier.' },
  { topic: 'salvage drop rate', owner: '§96.1', system: 'economy', supersedes: '§9',
    decision: '4%, and §11\'s formula gains its FIELD SALVAGE term. At 10% the field was 67% of all income and appeared in no formula anywhere, so every meta-pacing judgement had been made against a third of the actual economy.' },
  { topic: 'pickup cap', owner: '§96.2', system: 'pickups', supersedes: '§9',
    decision: '250 live, oldest-first DESPAWN, never auto-collected. At 600 with auto-collect a third of everything created by minute 20 was granted for not being reached, which deleted Salvage Magnet and blew the draw budget by 350.' },
  { topic: 'XP seeks, salvage does not', owner: '§105.3', system: 'pickups', supersedes: '§9, §96.2',
    decision: 'XP is the pacing spine and must land the cap at 20:00 regardless of skill; salvage is optional income and the detour stays the cost. Gating the spine on movement would compound with §88.2\'s already-multiplicative axes.' },
  { topic: 'repair cadence', owner: '§96.4', system: 'pickups', supersedes: '§95.1',
    decision: 'One every 60 seconds, one live at a time, 15% of max integrity. §95.1\'s 20-second cadence healed 162% of all damage taken in a run, so integrity never depleted across a run at all.' },
  { topic: 'wear', owner: '§130.2', system: 'field', supersedes: '§54.3',
    decision: '-7.5% per meltdown to every OUTPUT-CARRYING component in the melting region, capped -25% per component, travelling with the component and cleared by claiming a derelict. §54.3\'s sentence scoped it per component and its table computed it per board — a 1.2x to 2.0x disagreement that stood for seventy-six passes.' },

  // ───────────────────────────────────────── build and process, found while building
  { topic: 'document sources are not partitions', owner: 'commit 9', system: 'build',
    decision: 'Laws, decisions, strings, the asset manifest and the schedule are specification and are not constants, so they live in a second registry: out of Appendix A, out of §16\'s content hash, and out of the shipped bundle. Folding them in would bury eighty gameplay numbers under three hundred rows of prose, make a reworded law invalidate every replay in existence, and — measured — add 58 KB to a build whose whole argument is that it loads in a second.' },
  { topic: 'the build manifest is not simulation data', owner: 'commit 9', system: 'build', supersedes: 'commit 2',
    decision: '§148.4\'s four products and twenty-three flags moved out of the content hash, because §80.2 promises web and Steam play the IDENTICAL daily: a flag matrix inside the hash gives one seed a different fingerprint per product, and §119.8\'s fairness check would then fail on two runs that agree. It also carried every forbidden symbol\'s NAME into the web bundle, which A-014 caught on the day it was written.' },
  { topic: 'the determinism lint reads code, not prose', owner: 'commit 9', system: 'build', supersedes: 'commit 4',
    decision: 'String literals and trailing comments are stripped before the scan. `laws.ts` states the rule verbatim and `decisions.ts` records the decision that established it, and both were flagged the moment they existed — a lint that fires on the document describing the lint teaches a session to sprinkle exception comments, which is how a rule stops meaning anything.' },
  { topic: 'a screen title is a label, its contents are prose', owner: 'commit 9', system: 'ui',
    decision: 'The two lists may not share an id. Found by A-044 on the day it was written: BUILD REPORT is a label the player navigates to and the narration inside it is 120 words a human writes, and they had collided on one id — which is the cheapest possible demonstration that §102.2\'s boundary is checkable rather than rhetorical.' },
])

export const bySystem = (system: System): readonly Decision[] =>
  DECISIONS.filter((d) => d.system === system)

/** §75.1's ratio, measured rather than asserted: how much of this file overwrites. */
export const supersessionRate = (): number =>
  DECISIONS.filter((d) => d.supersedes !== undefined).length / DECISIONS.length

export const provenance: ProvenanceRecord = {
  DECISIONS: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§75.3, §84.1', derivedFrom: 'definition' },
  bySystem: { kind: 'solved', system: 'build', axes: [], source: '§135.3', derivedFrom: 'definition', solvedBy: 'DECISIONS filtered by system tag — the partition a session loads' },
  supersessionRate: { kind: 'solved', system: 'build', axes: ['provenance'], source: '§75.1', derivedFrom: 'definition', solvedBy: 'the fraction of entries carrying a supersedes field' },
}
