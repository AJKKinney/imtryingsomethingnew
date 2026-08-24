<!-- BEGIN GENERATED: decisions -->

# DECISIONS (generated from `src/data/decisions.ts`)

> **Do not edit — and do not treat this as a summary.** §84.1: the index is the
> **source**. A decision is not settled until it is here, and the prose section is the
> rationale written afterwards. §84.1 found the first version 46% out of date eight
> passes after it was built, and fixed the cause rather than the contents.

> §75.1 measured why the file exists: **eleven places where reading the obvious section
> for a topic returns a confidently wrong answer.** Consult the owner column before any
> section, never the first section that mentions the topic.

**86 decisions · 55 supersede an earlier one · 64%.**

That ratio is the finding, measured rather than asserted: four out of five settled
decisions in this project overwrite one, and until §75.3 nothing recorded it but prose.

The plan carries 246 indexed decisions. What is here is every decision governing code
that exists or that the next commit touches — which is what §135.3's partition means a
session actually loads. The rest arrive with their systems.

---

## The index

§135.3 — a session reads this whole, then the full rows for the two or three systems
its slice touches. That is 3,980 tokens against 8,364, which is what keeps §63.4's
resume budget honest as this file grows.

| Topic | System | Owner | Supersedes |
|---|---|---|---|
| heat model | heat | §51.2 | §31.1, §8 |
| heat dissipation | heat | §31.1 | — |
| heat thresholds | heat | §72.3 | §43.3, §58.5 |
| overclock feedback | heat | §58.1 | — |
| overclock hysteresis | heat | §110.2 | — |
| cooling floor | heat | §60.2 | §8.2, §15 |
| region-level effects | heat | §111.2 | §15 |
| runaway regions | heat | §116.4 | — |
| support rank | heat | §122.6 | — |
| the fourth heat verb | heat | §108.5 | §60.4 |
| power propagation | power | §15 | — |
| power recompute trigger | power | §142.2 | §15 |
| offline components conduct | power | §142.2 | — |
| core outputs | power | §33.1 | the original 10/12/16 |
| board expansion geometry | board | §108.3 | §8, §35.2 |
| the move verb | board | §112.2 | §7.2B, §12 |
| heat ownership | board | §112.4 | — |
| the board is the product | board | §68.2 | §3.H, §20 |
| board render channels | render | §85.2 | §85.1 |
| what the cell fill renders | render | §134.2 | §85.2 |
| enemy speeds | field | §37.1 | the original table |
| i-frames and contact | field | §37.2 | — |
| despawn | field | §109.4 | §9's "silently" |
| the wave mix | field | §118.2 | §10's windows |
| shard and salvage values | field | §118.3 | §9's ranges |
| the elite | field | §132.2 | §15, §4, §35.2, §120.4 |
| the Foundry's end condition | field | §127.2 | — |
| no manual aim | field | §112.6 | — |
| no crit | field | §117.5 | §9 |
| the arena boundary | field | §108.4 | §12 |
| the drafted roster | draft | §131.2 | §91.4 |
| level rule | draft | §8.2 | — |
| evolution consumes its amplifier | draft | §49.1 | §8.2 |
| evolution requirements visible from L1 | draft | §103.5 | §8.2 |
| amplifier pricing | draft | §59.3 | §34.3, §8.2 |
| Governor | draft | §122.5 | §92.3 |
| offer weight | draft | §93.3 | §28, §83.1 |
| the offer floor | draft | §121.3 | §28 |
| the run-one roster | draft | §121.6 | §8.2 |
| free support is five, not four | draft | §121.6 | §8.2 |
| Bus | draft | §132.5 | §8.2 |
| the stack | build | §19 | — |
| determinism policy | build | §14 | — |
| the tick order | build | §142.5 | §26 |
| the time-scale | build | §142.4 | §9, §17, §99.3 |
| the clock's home | build | commit 8 | commit 5 |
| input quantisation | build | commit 8 | — |
| replay code size | build | commit 8 | §41.1 |
| sweep sharding | build | §143.5 | §40.3, §63.5 |
| CI cadence | build | §149.4 | §17, §40.3, §63.5 |
| the repository stays private | build | §63.5 | — |
| the four products | build | §148.1 | — |
| generated files are not committed | build | §147.2 | — |
| friend and foe | render | §46.2 | — |
| the play area | render | §3.A | — |
| the run clock | ui | §105.1 | §3 |
| the level-up offer | ui | §103.2 | §9, §28 |
| the event-cache rule | render | §140.5 | §39.2 |
| the particle cap follows attention | render | §140.5 | — |
| no main menu | ui | §101.2 | — |
| three navigation idioms | ui | §101.3 | — |
| the typeface | render | §140.2 | — |
| the boot atlas | render | §147.1 | §140.2 |
| mount points | meta | §53.3 | — |
| the duty ladder | meta | §120.4 | §11 |
| the downward rungs | meta | §123.4 | §99.3, §107.3 |
| assist earns content | meta | §107.4 | §99.4 |
| salvage drop rate | economy | §96.1 | §9 |
| pickup cap | pickups | §96.2 | §9 |
| XP seeks, salvage does not | pickups | §105.3 | §9, §96.2 |
| repair cadence | pickups | §96.4 | §95.1 |
| wear | field | §130.2 | §54.3 |
| heat is stored per cell AND owned by the component | heat | commit 10 | §15, §112.4 |
| a region-level change is proportional, and the ninths are the uniform case | heat | commit 10 | §111.2 |
| a component's power is the maximum over its own cells | power | commit 10 | — |
| an island is legal, and is the second path to zero power | power | commit 10 | §135.1D |
| the screen graph has three entry points | ui | commit 10 | §101.6 |
| cooling ranks are linear between the published endpoints | heat | commit 10 | — |
| one board, two tabs | ui | commit 10 | §82.2 |
| engagement is measured at Pulse's own scale | heat | commit 10 | — |
| a STEP declaration is a claim to be wired | build | commit 10 | §142.6 |
| the prototype carries its own tick gate | ui | commit 10 | — |
| document sources are not partitions | build | commit 9 | — |
| the build manifest is not simulation data | build | commit 9 | commit 2 |
| the determinism lint reads code, not prose | build | commit 9 | commit 4 |
| a screen title is a label, its contents are prose | ui | commit 9 | — |

---

## The partitions

### heat — 14

**heat model** — §51.2 *(supersedes §31.1, §8)*

Emitter generation is `1.0 passive + (0.3 + 0.12 x targets hit)` PER SHOT, so heat tracks work done rather than layout — and a fixed board heats up as the run escalates with no scaling rule, because the crowd does it.

**heat dissipation** — §31.1

`dH/dt = generation - (2/3)H`, equilibrium `generation x 1.5`, time constant 1.5 s. Without dissipation every build melts within six seconds regardless of design, which makes heat weather rather than a decision.

**heat thresholds** — §72.3 *(supersedes §43.3, §58.5)*

The per-core pairs are PRIORS and the assertion is the LADDER SHAPE: three average emitters safe, four and five stably overclocked, six melting; four Arcs melting and three not. The first real sweep solves for whatever thresholds produce it.

**overclock feedback** — §58.1

Overclock grants +50% rate AND damage, so it raises the region's own generation by x1.16-1.33 — computed for the first time fifty-two sections after both rules were written.

**overclock hysteresis** — §110.2

Enter at `H >= threshold`, leave at `H <`, with NO separate exit value and no debounce. The x1.26 feedback makes both crossings self-reinforcing and both states stable for generation in [5.29, 6.67] — thermal momentum, which looks exactly like a bug a future session would fix.

**cooling floor** — §60.2 *(supersedes §8.2, §15)*

Generation clamps at the 1.0 passive term, never at zero. Sink -0.5 to -1.2 per covered cell, Radiator -0.8 to -2.0; both generate no heat of their own.

**region-level effects** — §111.2 *(supersedes §15)*

A change of Delta to a region distributes across that block's occupied cells in proportion to current heat; the named region moves by exactly Delta and a neighbour by `Delta x shared / 9`. Two effects write to region heat and neither said which — an ambiguity worth x9 on the vent-dash.

**runaway regions** — §116.4

A region whose EQUILIBRIUM exceeds meltdown does not melt once — it cycles at 39% uptime, 20% of max integrity every 8.1 s, fatal in ~41 s. The only escape is §112.2's move verb.

**support rank** — §122.6

`ceil(level / 8)`, ranks 1-5, shared by every piece held. Every support component carried a range and nothing in 121 sections said how a rank was reached.

**the fourth heat verb** — §108.5 *(supersedes §60.4)*

Four verbs, not three: build, buy, act, MOVE. Heat's work term reads a field quantity, so disengaging drops generation toward the floor — your position is a thermostat.

**heat is stored per cell AND owned by the component** — commit 10 *(supersedes §15, §112.4)*

`Placement.heat` is an ARRAY indexed by the shape's own offset order, not a scalar. §15's sentence carries both halves — "each occupied cell carries an accumulating heat scalar, owned by the component, not by the cell, so it travels when the component moves" — and a single scalar satisfies the second and breaks the first. Measured: a two-cell Lance at heat 4 with one cell inside a window takes its share and smears it back across both cells, so a -1 vent-dash moves the named region by -0.5. The array is what makes §111.2 exact, it survives rotation because the index is the offset's, and it costs a map at placement.

**a region-level change is proportional, and the ninths are the uniform case** — commit 10 *(supersedes §111.2)*

§111.2 states BOTH "in proportion to current heat" and "a neighbour moves by Delta x shared / 9", and they agree only when the block is uniformly hot and the window unclipped. PROPORTIONAL is the mechanism, because the clamp at zero forces it — a cell with no heat cannot give any up — and the ninths are the special case. Asserting the special case would have made §133.1's clipped four-cell corner a failure, in the same file that exists to protect it.

**cooling ranks are linear between the published endpoints** — commit 10

§8.2 gives Sink -0.5 to -1.2 per covered cell, Radiator -0.8 to -2.0 and Damper +2 to +5, and §122.6 makes rank ceil(level / 8), so there are five ranks and nothing said what the middle three are. Linear, which §128.2 confirms independently by quoting a rank-4 Sink at -1.02 against a computed 1.025.

**engagement is measured at Pulse's own scale** — commit 10

Engagement is the count of enemies inside 120 u against twelve, clamped. Derived rather than chosen: §51.3 publishes Pulse at 120 u radial hitting TWELVE targets in a late-run crowd, so the number of enemies inside a 120 u circle is already the document's own measure of a full crowd. That makes §115.5's slider and the live field one axis rather than two that merely look alike, which is the whole point of running them against one board.


### power — 6

**power propagation** — §15

0-1 BFS with a deque over occupied cells; a conduit costs 0 to enter and anything else 1. Power at a cell is `coreOutput - dist`, and a component runs at `clamp(delivered / draw, 0, 1)`.

**power recompute trigger** — §142.2 *(supersedes §15)*

Recomputed when a POWER INPUT changes — occupancy, core output, or the cell mask — flagged this tick and consumed at step 5 of the next. "When the board changes" could not fire §131.5's blackout or §120.5's mid-fight expansion.

**offline components conduct** — §142.2

An offline component still occupies its cell and still carries power, so a meltdown never severs the graph. Derived from §8's region scope, §2's legible-cause rule and §135.1D.

**core outputs** — §33.1 *(supersedes the original 10/12/16)*

Lattice 6, Spindle 6, Ring 9 — roughly half the original, because at the old values the worst cell on every core still fully powered the hungriest component and power never bound at all.

**a component's power is the maximum over its own cells** — commit 10

§15 defines power per CELL, so every component larger than one cell has several values and no section chose between them. The maximum: a component is one machine and the trace reaching any of its cells is the trace reaching it. The minimum would run a three-cell Bore at the rate of its worst corner — a second, undeclared penalty on footprint on top of §91.1's measured finding that three cells is already disqualifying.

**an island is legal, and is the second path to zero power** — commit 10 *(supersedes §135.1D)*

§135.1D says zero delivered power is reachable by exactly one path, §131.5's blackout. There are two: a component with no chain of occupied cells back to the core receives nothing, and nothing in the legality rules forbids one. Islands stay legal — forbidding them would delete the harshest form of the power constraint and the clearest reason conduits exist — and §85.2 makes the mistake the loudest thing on the board, since power is drawn as the trace's width and an island has no trace at all. What it costs is precision in §8: "never switching off" governs components the core can actually reach.


### board — 4

**board expansion geometry** — §108.3 *(supersedes §8, §35.2)*

Explicit per core: Lattice four nubs at the edge midpoints, Spindle each arm 3 to 4, Ring four cells at the side midpoints one step OUTWARD. Which four was never stated for a hundred sections while §58.7 made the heat ladder depend on it — and Ring's max region occupancy goes 4 to 5, inheriting Spindle's already-solved 7/19.

**the move verb** — §112.2 *(supersedes §7.2B, §12)*

A placed component can be picked up and re-placed anywhere legal, keeping its level, whenever the board is open. For 111 sections the only way to change a layout was to destroy part of it at ~10% of a run's progression, which made the board append-only in a game whose premise is arrangement.

**heat ownership** — §112.4

Heat is owned by the COMPONENT and travels with it. Taken the other way the move verb would let a player zero a region by shuffling, which is §60.1's off-switch arriving by a different route.

**the board is the product** — §68.2 *(supersedes §3.H, §20)*

A build-craft puzzle with real-time pressure, not a podcast survivors-like. Tags, comparison set and store copy follow; auto-placement's "podcast venue" justification is retired and it stands on onboarding and accessibility, which are real.


### render — 8

**board render channels** — §85.2 *(supersedes §85.1)*

Power is the TRACE'S WIDTH (`delivered / draw`); heat is the cell fill; component identity is a glyph from the enemy grammar constrained symmetric/closed/axis-aligned; amplifiers draw a connector per boosted emitter; a discovered synergy notches its cells. All seven channels survive total colour loss.

**what the cell fill renders** — §134.2 *(supersedes §85.2)*

The DERIVED region heat — §15's 3x3 sum — not the stored per-cell scalar. Because that is a box blur of the field, the region, the seam, a corner's clipped window and the overclock contour all draw themselves, and four mechanics stop resting on a shape no channel ever drew.

**friend and foe** — §46.2

TWO channels, redundant on purpose: hue (cyan-to-white against amber-to-red, on the axis protanopia and deuteranopia preserve) and FORM (symmetric and closed against broken and open, which carries the read alone under tritanopia). One generator, and the constraint is the faction.

**the play area** — §3.A

A fair, fixed 640x360 for everyone; taller aspects fill the remainder with the machine bezel. 640x360 is 16:9 and the Deck is 16:10, so the game would have shipped dead black bars on its primary venue.

**the event-cache rule** — §140.5 *(supersedes §39.2)*

A surface that changes on an EVENT renders offscreen and blits; a surface that changes on a TICK draws live. Five passes filled the bezel while §39.1 still budgeted it at one cached row of 7 draws, putting the full profile at 2,602 against a 2,600 ceiling.

**the particle cap follows attention** — §140.5

400 while the board view is open. The board runs at 20% time and the player is looking at a grid, which takes the tightest frame in the game from a nine-draw margin to eight hundred.

**the typeface** — §140.2

GENERATED: a 7x9 stroke table, ~900 bytes, emitted at build time by the tool that bakes §14's sine table — so §139.1's zero-asset-bytes claim and §18's all-algorithmic claim both stay literally true, and it is the same rule everything else in the game is drawn by.

**the boot atlas** — §147.1 *(supersedes §140.2)*

The locale-invariant Latin glyph set at three scales plus §102.2's 131 labels as WHOLE WORDS in the active locale — 0.8 MB in every locale, because a glyph set grows with the script and a label does not. CJK prose renders with `fillText` on entity-free screens only.


### field — 11

**enemy speeds** — §37.1 *(supersedes the original table)*

Swarmer 170 — FASTER than the player's 150, so it cannot be outrun, only killed. Every enemy in the first draft was slower, which made walking in a straight line the optimal strategy and the entire threat model decorative.

**i-frames and contact** — §37.2

GLOBAL 0.5 s i-frames, and the damage taken is the single HIGHEST contact value among overlapping enemies. Per-enemy i-frames make twenty Brutes 780 damage in a tick; global with no further rule makes twenty Brutes equal to one.

**despawn** — §109.4 *(supersedes §9's "silently")*

Beyond 1.5x the camera radius, enemies DISSOLVE VISIBLY and grant nothing. §31.2 makes the rule load-bearing — survival pressure sets required DPS, not spawned HP — so a player who thinks they must kill everything plays a harder game than the one that exists, and despawn is a rule.

**the wave mix** — §118.2 *(supersedes §10's windows)*

PROPORTIONS per band, not availability windows. Three honest readings of the old sentence spanned a 3.4x swing in total spawned HP — an input to the heat model, the load ratio, the defence model and both budgets.

**shard and salvage values** — §118.3 *(supersedes §9's ranges)*

Valued by enemy TIER rather than rolled: Swarmer 1, mid-tier 3, Charger 5, Brute 6. Mean 2.456 against §105.3's required 2.458 — and it turns the game's largest source of pure noise into a reward for positioning, the only targeting a player without manual aim has.

**the elite** — §132.2 *(supersedes §15, §4, §35.2, §120.4)*

The rare variant IS the elite: x5 HP, x1.25 speed, x1.5 contact, x5 tier value, on §15's asymmetric branch. Three systems depended on an entity no section defined — one element rated 0 and one rated 1 became one rated 5.

**the Foundry's end condition** — §127.2

The P3 vents step +1 region heat every 15 s from 1.5x the fight's target length at that duty rating, uncapped — the fight's only terminator, bounding every legal board near 236 s, and far enough out that a competent player never learns it exists.

**no manual aim** — §112.6

Declined on the record. §111.1 fixes the real-time layer at two verbs; a third would turn pressure into execution, which is the genre §68 repositioned away from.

**no crit** — §117.5 *(supersedes §9)*

Cut, and base damage NOT compensated because the model never included it. A 5% x2 roll is six invisible events a second at late-run hit rates, it appeared in no derived quantity, and it made the game 5-25% stronger than every table it was balanced against.

**the arena boundary** — §108.4 *(supersedes §12)*

The substrate ending — traces stop, the ground goes dark — and a hard wall the player slides along that NEVER deals damage. §38.4 already puts the danger at the edge, and a hostile boundary is §2's "cheated".

**wear** — §130.2 *(supersedes §54.3)*

-7.5% per meltdown to every OUTPUT-CARRYING component in the melting region, capped -25% per component, travelling with the component and cleared by claiming a derelict. §54.3's sentence scoped it per component and its table computed it per board — a 1.2x to 2.0x disagreement that stood for seventy-six passes.


### draft — 11

**the drafted roster** — §131.2 *(supersedes §91.4)*

FOURTEEN, and the fourteenth is `SIPHON`. §91.4 counted Damper — a support piece §5.2A bars from the draft — so the pool was 13 while five bands were computed at 14 for thirty-nine passes. Closed by shipping the fourteenth rather than re-deriving the bands.

**level rule** — §8.2

L1 base, L2 +25% damage, L3 behaviour change, L4 +25% damage and +1 heat, L5 second behaviour change and evolution-eligible.

**evolution consumes its amplifier** — §49.1 *(supersedes §8.2)*

The amplifier is absorbed into the evolved component, which caps evolutions at the number of amplifiers placed. At cap 40 with a level requirement the player evolved five in 88% of runs — the capstone became the floor.

**evolution requirements visible from L1** — §103.5 *(supersedes §8.2)*

`-> RAILGUN · needs GAIN L3+ adjacent`, on the card, in inspect mode and in the codex. §44.4 calls evolution an eight-pick plan and the old `?` hint fired at pick seven.

**amplifier pricing** — §59.3 *(supersedes §34.3, §8.2)*

Gain +40 to 60% damage with self-heat `0.5 + 0.5 x adjacent`; Clock +60 to 80% rate; Focus +50 to 70% area. A damage multiplier is thermally free per shot, so the price sits on the amplifier — without it Gain wins 21 of 21 cases and strands four evolutions.

**Governor** — §122.5 *(supersedes §92.3)*

Keys on region OCCUPANCY: +140 to 210% damage, minus 40 to 55 points per additional emitter in that region, floored at zero, stacking with overclock. §92.3's "while below overclock" was strictly dominated by Gain at every width at identical cost, with two evolutions hostage to it.

**offer weight** — §93.3 *(supersedes §28, §83.1)*

A new component weighs `2 x (10 / poolSize)^2` — squared, because a larger pool both increases new-component offers and dilutes each component's share of upgrade offers. Anchored permanently to the ten-component baseline (§92.2).

**the offer floor** — §121.3 *(supersedes §28)*

A triple whose best-vs-worst marginal value is under §52.3's 4% floor is rejected and re-drawn. Measured: 19% of triples were flat, so forty interruptions produced thirty-two decisions.

**the run-one roster** — §121.6 *(supersedes §8.2)*

Emitters Arc, Orbiter, Mine, Flak, Pulse; amplifiers Clock, Focus. DERIVED from five existing constraints rather than chosen, and never stated in 120 sections despite deciding the demo, the onboarding and §64.4's completion gate.

**free support is five, not four** — §121.6 *(supersedes §8.2)*

Wire, Bus and Sink held from run one; Damper and Radiator earned by two thermal achievements. §8.2 read "Free (4)" and listed five from the moment §92.3 added Damper.

**Bus** — §132.5 *(supersedes §8.2)*

A two-cell conduit and nothing more. The "+1 budget" clause is cut: undefined in both its appearances and unimplementable under 0-1 BFS, which forbids the negative edge weight it would need.


### build — 16

**the stack** — §19

TypeScript strict, Canvas 2D, Vite, Vitest, Playwright, Electron for Steam — and ZERO runtime dependencies, enforced. It is also the only stack verifiable in this container, since Chromium and Playwright are pre-installed.

**determinism policy** — §14

Only `+ - * / %`, comparisons and `Math.sqrt`; a 4096-entry baked sine table with linear interpolation; a polynomial `atan2`; no `Math.random`; no key-order iteration in an order-sensitive path; N/E/S/W neighbour order; total-order comparators tie-broken on entity id.

**the tick order** — §142.5 *(supersedes §26)*

Twenty-four steps, held as DATA in `src/data/tickorder.ts`, with `core/loop` generated from it. §26 wrote eighteen and twenty-two behaviours were added afterwards, fourteen with no step at all.

**the time-scale** — §142.4 *(supersedes §9, §17, §99.3)*

A TICK GATE — target interval `16.67 ms / scale` — never a `dt` multiplier. §30's input buffer is therefore SIX TICKS rather than 100 ms, and §149.3 runs the gate upward at x50 for the e2e harness.

**the clock's home** — commit 8 *(supersedes commit 5)*

`TICK_MS` and its neighbours live in `core/tick`, a leaf. Defining them in the generated loop put every simulation module that integrates a delta on an import of the loop that imports them — the cycle §145.4 exists to forbid, and Node named it on the first run.

**input quantisation** — commit 8

Axes are quantised to 127 steps AT THE BOUNDARY and the simulation sees the quantised value. Compressing the log afterwards would make it differ from the run it recorded, which is §26's desync with a codec in front of it.

**replay code size** — commit 8 *(supersedes §41.1)*

MEASURED at 16,904 characters for a smooth stick, 22,028 for a keyboard and 22,592 for random input at §41.1's own event rate — about eight times its predicted ~2,500. The two-tier decision is unaffected and strengthened: the summary is the paste and the full replay is a FILE.

**sweep sharding** — §143.5 *(supersedes §40.3, §63.5)*

A function of the policy mix: release 16 shards, balance 8. lookahead-1 is 3.9x a normal run, which put the release tier at 6.56 h/shard against Actions' 6-hour ceiling.

**CI cadence** — §149.4 *(supersedes §17, §40.3, §63.5)*

Push tier (~4 min): unit, solver, e2e, perf/build and every static check. Smoke (200 runs, ~18 min) follows `src/data/` rather than the commits. Phase boundary (~25 min) adds the nine sweep lines. Release (10,000 runs) twice in the project's life.

**the repository stays private** — §63.5

A public repository would give unlimited Actions minutes and make the project's authorship publicly discoverable, which §18 chose not to lead with. The overage is paid — ~$40-80 across the project (§149.5) — and the reason was never about money.

**the four products** — §148.1

playtest, web, Steam demo, Steam full — with twenty-three behaviours differing between them, declared in `src/data/builds.ts` with NO DEFAULT, because a default is how telemetry reaches the paid build.

**generated files are not committed** — §147.2 · verified against commit 7

The three emitted files are named individually in `.gitignore` rather than the directory being ignored, because §19's tree puts the hand-written procedural generators in `src/gen/` too — ignoring the directory would have deleted `gen/shapes.ts` the first time it was written.

**a STEP declaration is a claim to be wired** — commit 10 *(supersedes §142.6)*

`tools/emit.ts` now fails on a module that declares a STEP and exports no `step()`. §142.1 counted twenty-two tick-ordered behaviours added since §26 with FOURTEEN having no step; the mirror failure is a step with no module, which reads as scheduled and generates an import of a function nobody wrote. `grid/heat` therefore declares no step at commit 10 — the board is beside the world rather than inside it, so there is no world attribute for it to own — and `gen/loop`'s PENDING list is the honest record until there is.

**document sources are not partitions** — commit 9

Laws, decisions, strings, the asset manifest and the schedule are specification and are not constants, so they live in a second registry: out of Appendix A, out of §16's content hash, and out of the shipped bundle. Folding them in would bury eighty gameplay numbers under three hundred rows of prose, make a reworded law invalidate every replay in existence, and — measured — add 58 KB to a build whose whole argument is that it loads in a second.

**the build manifest is not simulation data** — commit 9 *(supersedes commit 2)*

§148.4's four products and twenty-three flags moved out of the content hash, because §80.2 promises web and Steam play the IDENTICAL daily: a flag matrix inside the hash gives one seed a different fingerprint per product, and §119.8's fairness check would then fail on two runs that agree. It also carried every forbidden symbol's NAME into the web bundle, which A-014 caught on the day it was written.

**the determinism lint reads code, not prose** — commit 9 *(supersedes commit 4)*

String literals and trailing comments are stripped before the scan. `laws.ts` states the rule verbatim and `decisions.ts` records the decision that established it, and both were flagged the moment they existed — a lint that fires on the document describing the lint teaches a session to sprinkle exception comments, which is how a rule stops meaning anything.


### ui — 8

**the run clock** — §105.1 *(supersedes §3)*

Elapsed time plus a marker filling toward the next named encounter, amber at ten seconds, counting DOWN from 18:00 — and during THE FOUNDRY the fight's elapsed time alone, since §48.1 leaves nothing to count toward and that figure is what §126.4's score reads. The run is built entirely of time gates and had no clock for a hundred sections.

**the level-up offer** — §103.2 *(supersedes §9, §28)*

Three cards in the bezel at 20% time, never a modal, no timeout — each showing glyph, the exact level delta, draw and cells, the projected slot as a ghost, the region-heat delta there, and evolution progress. §28 is titled for the interaction and specified only its statistics.

**no main menu** — §101.2

The Hall is the home screen. §55.3 made the loadout screen the graveyard for thematic reasons and deleted the main menu without saying so.

**three navigation idioms** — §101.3

List, grid cursor, walked space — and no screen may invent a fourth. `B` always goes exactly one level up. That makes gamepad completeness a property of the construction rather than a test result, which matters because §100.6 submits for Deck Verification at the end of phase 4.

**the screen graph has three entry points** — commit 10 *(supersedes §101.6)*

§101.3 drew three arrows into the graph — a cold launch, a crash, and a share link from outside the game entirely — and the registry modelled one, leaving `recovery` and `shareLanding` reachable from nowhere. Each entry now carries the reason something OUTSIDE the graph puts the player there, so declaring an entry can never become the way an orphaned screen passes the reachability check.

**one board, two tabs** — commit 10 *(supersedes §82.2)*

The RUN tab and the WORKBENCH tab share ONE board object, so the difference between them is not the machine but what drives its engagement: the crowd, or your hand. §82.2 asked for "one link, two tabs" and two prototypes would have been the obvious reading and the wrong one — the demonstration §51.2 is owed is that heat tracks the WAR rather than the layout, and it only lands if the machine on both sides is the same machine. It costs a tab rather than a second build.

**the prototype carries its own tick gate** — commit 10

The workbench advances heat on whole DT steps against an interval of TICK_MS / 0.2, because §9 runs the board at 20% time and §142.4 makes a time-scale a TICK GATE rather than a `dt` multiplier. A prototype with no world still obeys the rule the world obeys, so the heat curve a playtester sees at the gate is the curve the loop will produce when it wires the board — and nothing here has to be un-learned later.

**a screen title is a label, its contents are prose** — commit 9

The two lists may not share an id. Found by A-044 on the day it was written: BUILD REPORT is a label the player navigates to and the narration inside it is 120 words a human writes, and they had collided on one id — which is the cheapest possible demonstration that §102.2's boundary is checkable rather than rhetorical.


### meta — 4

**mount points** — §53.3

You own every upgrade you buy and may install only 2-4 per run, chosen at the loadout against a known core and anomaly. Without it, spending optimally beat spending as badly as possible by 2.7% — a purchase screen with no decision in it.

**the duty ladder** — §120.4 *(supersedes §11)*

Ten upward rungs re-spread to the same total in steps of +0.04 to +0.09, every one inside the run. Four of §11's original ten did not raise difficulty at all and rung 10 alone carried half the total.

**the downward rungs** — §123.4 *(supersedes §99.3, §107.3)*

-20% contact damage, -8% enemy speed, -15% enemy speed with i-frames 0.5 to 0.9 s. All HANDS, none touching the board, so the puzzle at duty -3 is bit-for-bit the puzzle at duty 0. The old first rung cut required DPS by 15%, handing board relief to a player asking for relief from the reflex layer.

**assist earns content** — §107.4 *(supersedes §99.4)*

Negative rungs earn every unlock a duty-0 run earns and do not earn claims. §79.2's unlocks are COMPONENTS, so the old rule read: you are finding this hard, so you may not have more of the thing that makes it easier.


### economy — 1

**salvage drop rate** — §96.1 *(supersedes §9)*

4%, and §11's formula gains its FIELD SALVAGE term. At 10% the field was 67% of all income and appeared in no formula anywhere, so every meta-pacing judgement had been made against a third of the actual economy.


### pickups — 3

**pickup cap** — §96.2 *(supersedes §9)*

250 live, oldest-first DESPAWN, never auto-collected. At 600 with auto-collect a third of everything created by minute 20 was granted for not being reached, which deleted Salvage Magnet and blew the draw budget by 350.

**XP seeks, salvage does not** — §105.3 *(supersedes §9, §96.2)*

XP is the pacing spine and must land the cap at 20:00 regardless of skill; salvage is optional income and the detour stays the cost. Gating the spine on movement would compound with §88.2's already-multiplicative axes.

**repair cadence** — §96.4 *(supersedes §95.1)*

One every 60 seconds, one live at a time, 15% of max integrity. §95.1's 20-second cadence healed 162% of all damage taken in a run, so integrity never depleted across a run at all.


<!-- END GENERATED: decisions -->
