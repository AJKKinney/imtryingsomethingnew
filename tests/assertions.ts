/**
 * The assertion manifest — the canonical home §71.2 built for the document's most
 * valuable output, after finding it stored in a 899-word paragraph that could not
 * answer how many there were, which phase each belonged to, or which were done.
 *
 * `tools/gendocs.ts` regenerates §22's check tables from this file, and CI fails in
 * BOTH directions: an assertion with no test is unfinished work that cannot hide,
 * and a test with no assertion is scope that arrived without a decision behind it.
 */

export type Phase = 1 | 2 | 3 | 4 | 5 | 6
export type Tier = 'unit' | 'solver' | 'sim' | 'sweep' | 'player' | 'e2e' | 'perf' | 'build'

/**
 * §149.4 — every check declares a CADENCE beside its tier and phase. §22 stamped a
 * hundred checks with a tier and a phase and never with WHEN THEY RUN, so §17, §40.3
 * and §63.5 gave the same smoke tier three different clocks 40x apart.
 */
export type Cadence = 'push' | 'data-slice' | 'phase-boundary' | 'release' | 'report'

/** §115.7 — a test you expect to fail is a design question with a number attached. */
export type Status = 'todo' | 'implemented' | 'expected-fail'

export interface Assertion {
  /** Stable, never reused; cited from ROADMAP and commit messages. Greppable. */
  readonly id: string
  readonly phase: Phase
  readonly tier: Tier
  readonly cadence: Cadence
  /** The pass that established it — the rationale, not the rule. */
  readonly source: string
  /** One line, falsifiable. */
  readonly statement: string
  /**
   * §74.4 — the counter-intuitive reason, so a refactor cannot quietly delete it.
   * The most valuable findings are the most exposed, because they look like cleanup.
   */
  readonly why: string
  readonly status: Status
  /** §133.6 — a quirk is guarded by an assertion testing its ASYMMETRY, not its value. */
  readonly quirk?: true
}

/**
 * §71.2's distribution. The manifest is seeded complete per phase as that phase's
 * work begins; these are the counts §71.2 measured, and `tools/roadmap.ts` reports
 * `phase N: implemented/planned` against them so coverage is never a guess.
 */
export const PLANNED: Readonly<Record<Phase, number>> = Object.freeze({
  // Phase 1 was 16 and is 17: §17 budgets five pre-allocated pools and states that
  // none is grown during a run, and no seeded assertion held that. §145.6's law is
  // that an addition is costed against the increment and the TOTAL is recomputed
  // rather than restated, so the plan moved rather than the work being squeezed into
  // a count that had no room for it.
  //
  // 17 -> 18 at commit 7: A-015 asserts friend and foe are separable with hue removed
  // ENTIRELY, and it is stamped `e2e` because that is a claim about a rendered frame.
  // The property underneath it is structural and checkable before a pixel is drawn —
  // §15's grammar makes SYMMETRY the faction — and those are two different checks.
  // Folding the second into the first by re-tiering A-015 would have been §92.2's
  // failure with a harness instead of a baseline: moving the thing being measured so
  // the measurement fits.
  //
  // 18 -> 23 at commit 9, and the increment is named rather than the total restated
  // (§145.6): the eight documents brought five checks nothing else could make. String
  // provenance and asset derivation are what make §18's disclosure position auditable
  // rather than asserted; the decision index is §84.1's "a decision is not settled
  // until it is indexed" turned into a build failure; the generated schedule is what
  // stops §21's own arithmetic recurring; and the canonical-home budget is §135.4.
  1: 23, 2: 41, 3: 148, 4: 26, 5: 18, 6: 12,
})

const a = (x: Assertion): Assertion => Object.freeze(x)

export const ASSERTIONS: readonly Assertion[] = Object.freeze([
  // ─────────────────────────────────────────────────────────── phase 1: the machines
  a({ id: 'A-001', phase: 1, tier: 'build', cadence: 'push', source: '§139.1', status: 'implemented',
      statement: 'The runtime dependency tree is empty, transitively, and every devDependency is pinned exactly.',
      why: 'A shipped binary with zero runtime dependencies cannot carry a compromised transitive package to a player, and §18\'s no-generative-AI claim is only auditable if nothing third-party is vendored in. The lockfile is the subject because npm normalises an empty "dependencies" away.' }),
  a({ id: 'A-002', phase: 1, tier: 'build', cadence: 'push', source: '§63.3', status: 'implemented',
      statement: 'docs/appendix-a.md is byte-identical to what tools/gendocs.ts emits from src/data/.',
      why: 'Transcription across twenty memoryless sessions is the mechanism by which a specification and its code diverge. Inverting the source of truth removes the transcription; this removes the possibility of editing the copy.' }),
  a({ id: 'A-003', phase: 1, tier: 'build', cadence: 'push', source: '§147.2', status: 'implemented',
      statement: 'Every generated region is enclosed by its sentinels, and a generator writes only between them.',
      why: 'ROADMAP.md is generated by §136.2, read as a source by §145.6 and hand-written by §63.4 — so a generator that rewrites it clobbers the IN PROGRESS: block, which is the only thing letting the next session recover.' }),
  a({ id: 'A-004', phase: 1, tier: 'build', cadence: 'push', source: '§96.6, §131.6, §61.5', status: 'implemented',
      statement: 'Every exported constant declares provenance: a system tag, its axes, authored-or-solved, and a procedure if solved.',
      why: '§96 found four constants owned by three passes, each individually reviewed and each wrong at the JOIN — a defect no per-constant column can see. The system tag is what makes "a system is audited whole" enforceable.' }),
  a({ id: 'A-005', phase: 1, tier: 'unit', cadence: 'push', source: '§14', status: 'implemented',
      statement: 'A golden hash over 10,000 simulated ticks reproduces exactly.',
      why: 'IEEE-754 does not specify Math.sin, cos, pow, exp or log — they legitimately differ across engines and platforms, so a single transcendental in the sim would desynchronise replays and look like a mysterious bug rather than a spec violation.' }),
  a({ id: 'A-006', phase: 1, tier: 'build', cadence: 'push', source: '§14', status: 'implemented',
      statement: 'No simulation module references a transcendental, Math.random, or iteration over Set/Map key order.',
      why: 'The lint rule catches the mistake at authoring time rather than at replay time, which is the difference between a compile error and a bug report from a stranger whose run will not reproduce.' }),
  a({ id: 'A-007', phase: 1, tier: 'unit', cadence: 'push', source: '§14', status: 'implemented',
      statement: 'The seeded RNG reproduces a fixed golden sequence, and the baked sine table matches Math.sin within 1e-6.',
      why: 'The table is generated at BUILD time and emitted as source constants, so the shipped game never calls the implementation-defined function it approximates.' }),
  a({ id: 'A-008', phase: 1, tier: 'unit', cadence: 'push', source: '§17', status: 'implemented',
      statement: 'The spatial hash returns exactly what a brute-force neighbour query returns, for every seeded layout.',
      why: 'The hash is the largest single cost in the tick (§40.1) and the easiest place for an off-by-one to silently drop collisions, which reads as the game being unfair rather than as a bug.' }),
  a({ id: 'A-009', phase: 1, tier: 'unit', cadence: 'push', source: '§3.B, §9', status: 'implemented',
      statement: 'The accumulator clamps across a visibility gap, and a suspend/resume round-trips the world exactly.',
      why: 'The primary venue gets its lid closed constantly. An unclamped accumulator spends the gap simulating, which on a Deck means dying during a suspend.' }),
  a({ id: 'A-010', phase: 1, tier: 'unit', cadence: 'push', source: '§16, §30', status: 'implemented',
      statement: 'A snapshot round-trips the world bit-exactly, and a replay whose content hash mismatches is refused rather than played.',
      why: 'Pretending a v0.1 replay reproduces on v0.2 is how a "watch this run" feature becomes a liar.' }),
  a({ id: 'A-011', phase: 1, tier: 'unit', cadence: 'push', source: '§142.4', status: 'implemented',
      statement: 'The time-scale is a tick gate: the golden hash is identical at 100%, 20%, 5% and paused.',
      why: 'Scaling dt makes the step variable, which makes the hash a function of frame timing and silently breaks replays, PAR and the daily. A gate at scale 0 is trivially zero ticks where a zero multiplier is a special case.' }),
  a({ id: 'A-012', phase: 1, tier: 'build', cadence: 'push', source: '§142.6', status: 'implemented',
      statement: 'core/loop is generated from src/data/tickorder.ts, every simulation module declares a step index, and no module writes a simulation attribute from outside the step that declares it.',
      why: 'Ordering IS the simulation\'s semantics and a reordering is a silent desync. Twenty-two tick-ordered behaviours were added after §26 and fourteen had no step at all.' }),
  a({ id: 'A-013', phase: 1, tier: 'build', cadence: 'push', source: '§140.2, §139.1', status: 'implemented',
      statement: 'The 7x9 stroke face is emitted at build time by the tool that bakes the sine table, and the bundle contains zero font bytes.',
      why: 'A system font stack makes the game read differently on every OS, breaking §85.2\'s visual language; a bundled webfont breaks §139.1\'s zero-asset-bytes claim. The generated face is the one that was always correct rather than merely cheapest.' }),
  a({ id: 'A-014', phase: 1, tier: 'perf', cadence: 'push', source: '§139.1, §148.4', status: 'implemented',
      statement: 'The WEB bundle is under 700 KB uncompressed; the ceiling is stamped with its target.',
      why: 'Bundle size only ever creeps upward without a gate, and a game playable a second after the click converts better than one behind a loading bar. §102.5\'s 250 MB is the Steam budget and the two had never been compared.' }),
  a({ id: 'A-015', phase: 1, tier: 'e2e', cadence: 'push', source: '§46.2', status: 'todo',
      statement: 'Friend and foe are separable with hue removed entirely: symmetric-and-closed against broken-and-open.',
      why: 'Colour and form are redundant on purpose — the cyan/amber split survives protanopia and deuteranopia, and where it does not (tritanopia) the form distinction carries the whole load by itself.', quirk: true }),
  a({ id: 'A-016', phase: 1, tier: 'build', cadence: 'push', source: '§71.2', status: 'implemented',
      statement: 'Every assertion has a test and every test cites an assertion; phases seeded so far are complete against PLANNED.',
      why: 'An assertion with no test is unfinished work that can hide, and a test with no assertion is scope that arrived without a decision behind it.' }),

  // ─────────────────────────────────────────────────────── phase 2: the hook (partial seed)
  a({ id: 'A-017', phase: 2, tier: 'unit', cadence: 'push', source: '§15', status: 'implemented',
      statement: '0-1 BFS power propagation agrees with a reference Dijkstra on every legal board.',
      why: 'Moving into a conduit costs 0 and any other cell 1, so the shortest-path structure is 0/1-weighted and a deque is exact — but only if the deque discipline is right, and a subtle error produces a board that is merely slightly wrong.' }),
  a({ id: 'A-018', phase: 2, tier: 'unit', cadence: 'push', source: '§142.2', status: 'implemented',
      statement: 'Power is recomputed when occupancy, core output OR the cell mask changes — and an offline component still occupies its cell and still conducts.',
      why: '"Recomputed only when the board changes" was written when a placement was the only thing that could move power. A meltdown is not a board change, so §131.5\'s BLACKOUT could not propagate and the mechanic could not fire.' }),
  a({ id: 'A-019', phase: 2, tier: 'unit', cadence: 'push', source: '§15', status: 'implemented',
      statement: 'Incremental region-heat recomputation over the dirty set equals a full recomputation, always.',
      why: 'Region heat is a DERIVED moving 3x3 sum over a per-cell store; an incremental update that drifts from the full sum is a board that looks safe and melts, which is §2\'s "cheated" on the one surface §68 calls the product.' }),
  a({ id: 'A-020', phase: 2, tier: 'unit', cadence: 'push', source: '§111.2', status: 'implemented',
      statement: 'A region-level heat change of delta moves the named region by exactly delta, distributed across the block IN PROPORTION to current heat, and moves each neighbour by delta x its share of that heat — which is delta x shared / 9 exactly when the block is uniformly hot.',
      why: 'Region heat is derived and two effects write to it. "-5 heat from your hottest region" can mean -5 or -45 depending on a mapping nobody wrote — a factor of nine on the game\'s only real-time thermal verb. Defining it correctly creates seam dashing. The seeded form asserted the ninths unconditionally: §111.2 gives both sentences and PROPORTIONAL is the mechanism, because the clamp at zero forces it — a cell with no heat cannot give any up — while the ninths are the case where the block happens to be uniform and the window unclipped. Asserting the special case would have made §133.1\'s clipped corner a failure.' }),
  a({ id: 'A-021', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§58.7, §108.3', status: 'implemented',
      statement: 'On every one of the six board states (three cores x two sizes) all three rungs are reachable, and overclock sits at least one full rung below meltdown.',
      why: 'Thresholds are per REGION and the three geometries cap a region at 9, 5 and 4 cells, so a single global pair is meaningless. Ring on the shared 14/22 could not reach overclock in any of its 84 loadouts: a 4,500-salvage core shipped with the central mechanic switched off.' }),
  a({ id: 'A-022', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§72.3', status: 'implemented',
      statement: 'The LADDER SHAPE holds: three average emitters safe, four and five stably overclocked, six melting; four Arcs melt and three do not.',
      why: 'The thresholds are values and §35.3 says invariants survive retuning while values do not. The shape is the invariant and 10/22 is a prior the first real sweep may move.' }),
  a({ id: 'A-023', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§60.2', status: 'implemented',
      statement: 'No combination of cooling at any rank reduces a component\'s generation below its 1.0 passive floor.',
      why: 'A rank-1 Sink at the old -3 per covered cell zeroed every component it touched — and the free tray GUARANTEES delivery of one to every player by about level four. The mechanic was optional from level four onward and the optimal play was to switch it off.' }),
  a({ id: 'A-024', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§110.2', status: 'implemented',
      statement: 'A region at generation 6.0 is stable in BOTH states, and shot ripple flips neither.',
      why: 'Overclocking raises the region\'s own generation x1.26, so both states are self-consistent for generation in [5.29, 6.67]. Thermal momentum looks exactly like a bug a future session would fix.', quirk: true }),
  a({ id: 'A-025', phase: 2, tier: 'unit', cadence: 'push', source: '§112.4', status: 'implemented',
      statement: 'A moved component keeps its level and carries its heat, so no sequence of moves changes total board heat at all, and a scrap debits exactly the heat of the piece removed.',
      why: 'Heat owned by the CELL would make shuffling free cooling — §60.1\'s off switch arriving by a different route — in the one game whose premise is that arrangement costs something. The seeded form said "no sequence of moves OR SCRAPS lowers total board heat", which is false as written: scrapping removes a component and its heat goes with it. That is not laundering, it is paying ~10% of a run\'s progression, so the checkable invariant is the precise one — moves conserve exactly, scraps debit exactly, and neither can move a neighbour\'s heat.' }),
  a({ id: 'A-026', phase: 2, tier: 'unit', cadence: 'push', source: '§57.2', status: 'implemented',
      statement: 'The last remaining emitter cannot be scrapped.',
      why: 'Scrapping it is not a softlock but a slow unwinnable death with no feedback explaining why, which is worse.' }),
  a({ id: 'A-027', phase: 2, tier: 'unit', cadence: 'push', source: '§15', status: 'implemented',
      statement: 'Auto-placement enumerates only legal (cell, rotation) pairs and breaks ties on lowest (row, col, rotation).',
      why: 'Determinism is not optional in the placer: §14\'s replays, §124.5\'s PAR and §80.2\'s identical daily all run through it, and a tie broken by iteration order is a desync waiting for a different engine.' }),
  a({ id: 'A-028', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§143.6', status: 'todo',
      statement: 'The auto-placer, the offer ghost, the four bot policies and the fault-trace solver call ONE scoring function, and it contains no free weight.',
      why: 'projectedDPS − meltdownRisk x penalty had two undefined terms and no value for penalty, in the instrument every acceptance band in the document is denominated in. Its risk term is now §130.2\'s measured meltdown cost rather than a tuned constant.' }),
  a({ id: 'A-029', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§143.4', status: 'todo',
      statement: 'Every bot-policy threshold is expressed relative to that core\'s own thresholds, never as an absolute.',
      why: '"Survival keeps region heat < 8" sits ABOVE the overclock line on Spindle and Ring, so the survival bot courted overclock on two of three cores — in the policy every band is measured under.' }),
  a({ id: 'A-030', phase: 2, tier: 'e2e', cadence: 'push', source: '§69.3', status: 'todo',
      statement: 'Inspect mode is reachable and readable LIVE at 20% time on a gamepad, without pausing, and its numbers track the board as it is edited.',
      why: 'The board computed eight quantities and displayed one. A build-craft audience will not tolerate being unable to compute with what it has already found — that is not mystery, it is opacity. WHICH quantities the panel carries is a property of a pure function over the board (A-051); that it is legible under a clock the player cannot stop is a claim about a running frame, and only the second needs a browser.' }),
  a({ id: 'A-031', phase: 2, tier: 'e2e', cadence: 'push', source: '§103.3', status: 'todo',
      statement: 'Every offer card shows all six quantities including the projected slot as a ghost.',
      why: 'The card is the decision surface forty times a run against the board\'s three, and §28 specified only its statistics. Running the auto-placer for all three offers BEFORE the choice is the same computation moved one step earlier.' }),
  a({ id: 'A-032', phase: 2, tier: 'sim', cadence: 'data-slice', source: '§121.3', status: 'todo',
      statement: 'The offer generator never ships a triple whose best-vs-worst marginal value is under §52.3\'s 4% floor.',
      why: '19% of triples fell below it, so forty interruptions produced thirty-two decisions. A perfectly legible presentation of three equivalent options is still not a choice, so the fix belongs in the generator rather than on the card.' }),
  a({ id: 'A-033', phase: 2, tier: 'e2e', cadence: 'push', source: '§134.2', status: 'todo',
      statement: 'In a RENDERED FRAME at both levels of detail, the cells tinted at or above overclock are exactly the overclocked ones, and the tint survives the bezel\'s 14.4 px cell.',
      why: 'A board that looks safe and melts is "cheated" on the surface §68 calls the product. The seeded statement bundled two checks: WHICH QUANTITY the fill is computed from, which is a property of the draw call and runs in milliseconds against a counting stub (A-050), and whether it is legible once composited at two scales, which needs a browser. Pairing them put the cheap one behind the expensive one — the same split A-049 made from A-035.' }),
  a({ id: 'A-034', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§133.1', status: 'implemented',
      statement: 'The region window is strictly smaller at a corner than at the centre (4 · 6 · 9 on Lattice), and region heat is never normalised by window size.',
      why: 'A session normalising so that "thresholds mean the same thing everywhere" would delete §108.1\'s corner economics — why §44.2 measured corner cells chosen 31 times against 78 — and §58.7\'s ladder check would still pass, because it tests occupancy and never position.', quirk: true }),
  a({ id: 'A-035', phase: 2, tier: 'e2e', cadence: 'push', source: '§101.6', status: 'todo',
      statement: 'B goes exactly one level up from every screen, on a gamepad, in the running game — and every function on every screen is reachable with the gamepad alone.',
      why: 'Deck Verification is judged on gamepad reachability and §100.6 submits at the end of phase 4, so testing for it at the end is how it fails at the end. The seeded statement bundled this with a REGISTRY property — idioms declared, graph connected, one parent each — which is a claim about data and is checkable before a pixel is drawn; that half is A-049, and separating them is what makes §101.3 true as written: gamepad completeness is a property of the construction rather than a test result.' }),
  a({ id: 'A-036', phase: 2, tier: 'unit', cadence: 'push', source: '§110.4, §127.6', status: 'todo',
      statement: 'Offers resolve FIFO, one card at a time with "+1 pending", and no offer card is open when a boss spawns.',
      why: 'At the early cadence of one level-up per 17 seconds two can genuinely be queued — and §105.3 lands the level cap on the tick §48.1 empties the field and THE FOUNDRY walks in.' }),
  a({ id: 'A-037', phase: 2, tier: 'unit', cadence: 'push', source: '§110.3', status: 'todo',
      statement: 'A derelict channel is cancelled by movement, unaffected by damage, and resets progress.',
      why: 'The commitment is standing still for two seconds in a game where Swarmers are faster than the player — a cost the player CHOOSES. Interruption by damage would be the "helpless" entry on §2\'s watchlist.' }),
  a({ id: 'A-038', phase: 2, tier: 'unit', cadence: 'push', source: '§130.2', status: 'todo',
      statement: 'Wear applies per component to every output-carrying component in the melting region, travels with a moved component, and no sequence of moves or scraps launders it.',
      why: '§54.3\'s sentence scoped wear to "the components involved" and its own table three lines below applied 5% to the whole board — a 1.2x to 2.0x disagreement that stood for seventy-six passes, and the scope is what makes the punishment scale with the greed that caused it.' }),
  a({ id: 'A-039', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§131.5', status: 'implemented',
      statement: 'The core generates no heat of its own, is not exempt from meltdown, and a meltdown in its region takes core output to zero for the offline period.',
      why: 'The core is a component in a region and power flood-fills FROM it, so its region melting takes the whole board dark. A BLACKOUT costs no new rule; exempting the core would cost a special case.' }),
  a({ id: 'A-040', phase: 2, tier: 'solver', cadence: 'data-slice', source: '§116.4', status: 'implemented',
      statement: 'A region whose equilibrium exceeds meltdown is detected as a runaway, named in the fault trace, and escapable only by rearranging.',
      why: '§36.1 checked the reboot heat and stopped there. With generation restored the region climbs back in 3.1 s and melts again forever — 39% uptime, 20% integrity every 8.1 s, dead in forty-one seconds, and nothing described it.' }),
  a({ id: 'A-041', phase: 2, tier: 'unit', cadence: 'push', source: '§118.5', status: 'todo',
      statement: 'Every random draw is a weighted distribution object summing to 1, and no data table ships a range literal.',
      why: 'A range is a summary of a distribution. Three unspecified shapes in one system — "1 -> 8", "(1-5)", "Swarmers 0-3" — each read like a specification and each left the only part that matters to the implementer.' }),

  // ───────────────────────────────────────────── phase 1, found while building it
  a({ id: 'A-042', phase: 1, tier: 'unit', cadence: 'push', source: '§17', status: 'implemented',
      statement: 'Every pool is allocated at boot and never grown during a run; a full pool refuses the spawn and counts the refusal.',
      why: 'Growing a pool mid-run allocates, and allocating mid-run is a garbage-collection pause inside a 16.7 ms frame on the primary venue. §31.3 fixes concurrent enemies at 190-624 against a 2,048 pool, so a full pool means something upstream is wrong; the honest response is a dropped spawn and a counter the sweep can read.' }),

  a({ id: 'A-043', phase: 1, tier: 'unit', cadence: 'push', source: '§15, §46.2', status: 'implemented',
      quirk: true,
      statement: 'The shape grammar carries the faction in its FORM: every friendly silhouette is symmetric and closed, and no hostile one is either.',
      why: 'This is an ASYMMETRY rather than a value (§133.6), which is what a quirk needs: a session tidying the generator into one code path for both factions would leave every hue, every palette test and every screenshot passing, and would delete the only channel §46.2 has under tritanopia — the one CVD type the cyan/amber axis does not survive. In a screen holding 570 entities, telling your shots from theirs is a playability question, not a style one.' }),

  // ──────────────────────────────────────────── phase 1, the eight documents (commit 9)
  a({ id: 'A-044', phase: 1, tier: 'build', cadence: 'push', source: '§102.6, §102.2', status: 'implemented',
      statement: 'Every player-visible string is on the label list or the human-written list, on exactly one, and each list is internally unique.',
      why: '§18 rests the whole disclosure position on a split between functional strings and content, and never enumerated either side. §102.1 is why that is not bookkeeping: §18 exempted machine names because "players write them", while §47.4 auto-names every machine and §66.1 makes the shared name a procedural index — so the one category it exempted is the category players never write. A boundary nobody can check is a boundary that has already moved.' }),

  a({ id: 'A-045', phase: 1, tier: 'build', cadence: 'push', source: '§140.6, §140.3', status: 'implemented',
      statement: 'Every player-visible asset carries a derivation row generated from src/data/assets.ts, and every achievement names a source scene and a seed for both of its icons.',
      why: 'Steamworks will not accept an achievement without TWO icons, achieved and unachieved, so §19\'s twenty were unshippable from pass 19 to pass 140 — and the sweep that found it is one line: typeface, achievement icon, library capsule and favicon appeared ZERO times in sixteen thousand lines. §18 was audited for a hundred and thirty-nine passes against the art INSIDE the simulation, which is the art the mechanics passes were interested in.' }),

  a({ id: 'A-046', phase: 1, tier: 'build', cadence: 'push', source: '§84.1, §75.3', status: 'implemented',
      statement: 'Every decision names a current owner citing a section, no two decisions claim the same topic, and the generated index lists every one.',
      why: '§84.1 found the index 46% out of date eight passes after it was built and fixed the CAUSE rather than the contents: the index is the source, not a summary of one. A decision that is not here is not settled — which is the only thing that stops §75.1\'s eleven confidently-wrong answers recurring.' }),

  a({ id: 'A-047', phase: 1, tier: 'build', cadence: 'push', source: '§145.6', status: 'implemented',
      statement: 'The session totals are emitted from the per-item deliverable estimates; a hand-written total fails the build.',
      why: '§21 stated 19-24 sessions while its own rows summed to 20-26, and twenty passes then added 7.3-10.6 sessions while declaring the total unchanged. Each judgment was defensible alone, which is the failure: an addition measured against the total never moves it, and "not a whole session" twenty times is seven to eleven sessions. §24.1 names shipping at all as the top risk, so the size of the ask has to be observable rather than reassuring.' }),

  a({ id: 'A-048', phase: 1, tier: 'build', cadence: 'push', source: '§135.4, §75.2', status: 'implemented',
      statement: 'Every canonical home declares a token ceiling, and one declared generated is actually emitted by a generator.',
      why: '§135.4: a canonical home is a BUDGET, not just a location. Six homes were created to make something readable and none was re-measured; the resume set reached x5.3 its stated cost, with src/data/ alone three times the entire budget §63.4 wrote for it. A home that exceeds its ceiling is partitioned by its system tag, never trimmed, because §84.1 and §71.2 both make completeness the property that earns the file.' }),

  // ─────────────────────────────────────────── phase 2, found while building the board
  a({ id: 'A-049', phase: 2, tier: 'build', cadence: 'push', source: '§101.6, §101.3', status: 'implemented',
      statement: 'Every screen declares one of the three idioms, every screen except the four roots has exactly one B parent, every screen is reachable from a DECLARED ENTRY POINT, and every cross-edge is named.',
      why: '§101.3 makes gamepad completeness structural rather than a test result, and the structural half needs no browser — so pairing it with A-035\'s rendered-frame claim under an e2e tier put a check that runs in milliseconds behind one that needs a build. Written against TITLE alone it also failed on two screens the moment it existed: §101.3 drew THREE arrows into the graph — a launch, a crash and a share link — and the registry modelled one, leaving `recovery` and `shareLanding` unreachable from anywhere. An entry point is now a claim with a reason attached, so "declare it an entry" can never become the way an orphaned screen passes.' }),
  a({ id: 'A-050', phase: 2, tier: 'unit', cadence: 'push', source: '§134.2, §111.5', status: 'implemented',
      statement: 'Every occupied cell\'s fill is computed from the DERIVED 3x3 region sum rather than its stored scalar, and the cells filled at or above the overclock tint are exactly the cells the simulation reports overclocked.',
      why: 'The two readings differ by up to nine, and both are called "heat": §85.1\'s channel table named the region and §85.2\'s prose thirty lines later encoded the cell — so no cross-reference could catch it and §85.4\'s colourblind audit checked that the channel survives colour loss, never that it carries the right number. Rendering the sum is also free and pays for itself: the region, the seam between two hot clusters, a corner\'s clipped four-cell window and the overclocked contour all draw themselves, so the four mechanics that rest on that shape need no eighth channel.' }),
  a({ id: 'A-051', phase: 2, tier: 'unit', cadence: 'push', source: '§69.3, §69.1', status: 'implemented',
      statement: 'The inspect panel returns all six quantities a placement decision needs — power against draw, region heat, this core\'s threshold pair, the equilibrium at the current engagement, the component\'s state, and what a confirm would place — and every one is read from state the simulation already computes.',
      why: '§69.1 enumerated the eight a placement decision needs and found the game showed ONE, with the other seven computed sixty times a second and discarded — which is why this is the cheapest large change in the document and not a feature. §69.2 is the rule that keeps it from contradicting §4: discovery is hidden, arithmetic never is. A quantity recomputed for the display would be a second implementation that can disagree with the simulation, which is the shape §134.2 found in the fill.' }),
])

export const byPhase = (phase: Phase): readonly Assertion[] =>
  ASSERTIONS.filter((x) => x.phase === phase)

export const coverage = (phase: Phase): { implemented: number; seeded: number; planned: number } => ({
  implemented: byPhase(phase).filter((x) => x.status === 'implemented').length,
  seeded: byPhase(phase).length,
  planned: PLANNED[phase],
})
