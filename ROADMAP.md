# MELTLINE — ROADMAP

**A bullet-heaven roguelite where your build is a circuit board you route power through.**
Power wants your build compact and close to the core. Heat wants it spread out. Every
placement trades one against the other, and no layout wins both.

This file is the first thing a session with no memory reads (§63.4). Four of its sections
are **generated** and live between sentinels; everything else is authored, and a generator
that writes outside its region fails CI in the same breath as a hand edit inside one
(§147.2).

**Read order for a session (§63.4, partitioned per §135.3):** this file → the
`DECISIONS.md` index plus the rows for the systems the slice touches → `CLAUDE.md` → the
`src/data/` partitions for those systems → `LAWS.md`'s judgment half → `src/ui/screens.ts`.
**Appendix A is generated from `src/data/` — never transcribe it, generate it.**

---

## IN PROGRESS:

Nothing. **§9's gate ran at session 3 (§81.3) and it failed.** §70.3's ladder is
pre-committed for exactly this — *first failure → redesign the board UX once and re-gate* —
and this commit is that redesign. The re-gate has not been run yet; that is the next thing
that happens, and it is the only thing that decides whether the ladder advances.

**The report, in the tester's words: *"I have no idea what I am doing or what is happening
in the game."*** Against §82.1's diagnostic, all three failures were present at once — *I
could not read the picture · I could read it but had no move · I could act but saw no
consequence* — which is not three complaints but one: nothing on the surface said what any
of it was. §73.2's calibration makes the reading unambiguous rather than merely
authoritative: this is a tester fluent in all four bracketing genres who bounced off none,
so there is no audience-fit escape hatch and the verdict is craft.

**Five causes, and four of them are defects rather than omissions.** They are worth
separating, because only the first was a missing feature.

**1. The board said nothing because the verbs were not on it.** The controls existed in
prose the tester never reached. They are now printed on the canvas, the HOLDING block names
the part with its cells and its draw, the AFTER line states the exact projected power and
the heat before and after, a KEY names five channels with the swatches drawn beside them,
the engagement slider is labelled FIGHT / LULL / CRUSH, and **WORKBENCH opens by default** —
§85.3 splits the board into a status light and an instrument, and the link was opening on
the status light.

**2. The core was never drawn — A-053.** Every one of §85.1's seven channels describes a
*placement*, so `drawBoard` used the core's position as a trace ORIGIN and never rendered
the origin. That is invisible for exactly as long as there is a trace to infer it from, and
`createBoard` returns no placements: **run one, every share link and every WORKBENCH session
opened on a grid of substrate dots with nothing in the middle of them**, in a game whose
hook is *power flood-fills from the core*. It is one stroked path, at both levels of detail,
because §39.1 budgets the bezel board at *25 cells + 24 traces + the core* and the core's
share of that 50 is one draw. **§131.5's BLACKOUT is the one state that changes its shape**:
the outer ring opens into four brackets, because an open outline is the corruption's half of
§46.2's form channel and therefore survives total colour loss.

**3. Every word in the game carried a stray mark, and `/` printed as `\` — A-054.** A stroke
is centred on its path, so a glyph inked at column 0 painted half a line width OUTSIDE its
packed cell and into whatever the shelf packer had put beside it — and because the packer
sorts by height, which sliver a glyph picked up was arbitrary. An `I` acquired a stem and
read as an `E`; an `O` acquired one and read as a `D`; every whole-word label ended in a tick
nobody wrote. **The face had three checks and all three passed**: where it comes from, how
many bytes it costs, whether every coordinate is on the 7×9 grid. None of them looks at what
a *blit contains* — which is §85.4's shape exactly, auditing that a channel survives colour
loss and never that it carries the right number. The fix costs **no atlas pixels**: §140.2's
grid is seven columns and the ink occupies 0–4, so the slack was already paid for and
§147.1's 0.8 MB does not move. Separately, both slashes were authored as the same stroke, so
every ratio printed as `6\2` — guarded now by an **asymmetry** (§133.6) rather than a value,
because each glyph was individually on the grid and individually legible.

**4. The cursor and the core were the same object.** Both cyan, both a square, both at
`max(2, cell × 0.08)`, and the cursor started **on** the core's own cell. The cursor is now
white — §104.5's eighth core hue, so §46.2's cool side is untouched and what changed is
*which* cool — thin, at the cell's boundary rather than inside it, and it opens on the cell
**above** the core, which is where the first placement wants to go anyway.

**5. The substrate dot was two pixels at every cell size.** That is §83.2's finding one level
down: §76.4 asserted a 120×120 board against a bezel band nobody had measured, and a fixed
dot is the same mistake at the smaller scale. At the bezel's 14.4 px cell two pixels is a
seventh of the cell and reads; at the workbench's 52 px it is a twenty-sixth, so **the board's
shape** — §108.3's explicit per-core geometry, the thing that says where a player may place at
all — stopped being visible. It scales, with a floor that leaves §86.2's measured bezel
exactly where it was.

**6. The bullet heaven rendered no weapons — A-055.** Reported separately, in four words:
*I cannot see any weapons firing.* §46.2 required a distinct **firing signature** per emitter
in the same pass that required distinct silhouettes, and only the silhouettes were built —
`renderFrame` drew the substrate, the enemies and the player, and that was all of it. Arc
resolves instantly (§38.2), so a shot left no projectile behind, **and `world.arc` held a
cooldown and nothing else**, so there was nothing a renderer could have drawn even if one had
tried. Three shots a second, and the only visible consequence of firing was an enemy that
stopped existing. The simulation now stamps the tick, the aim and every enemy it hurt; the
renderer draws the **cone** rather than a beam to the target, because §121.5 measures Arc's
coverage at **0.17 of the circle** against 1.00 for five of the roster and coverage is exactly
the axis §33.3's DPS table cannot see — a beam says a shot happened, the wedge says what the
weapon *is* — and it is drawn from §14's own half-angle constant, so the picture and the
predicate are one object (§134.6). The hit flash costs no draw at all: it changes the stroke
of a silhouette already being drawn.

**And the first fix was not visible either, which is the finding.** Shipped as a 2 px stroked
outline held for six ticks, the cone was *present* and rare: at 3 shots a second a six-tick
flash leaves the weapon dark in **77% of frames**, and an outline in a frame already holding
hundreds of stroked silhouettes is a shape to interpret rather than a discharge. Measured over
1,800 ticks of the real simulation — 84 shots, and the wedge on screen in 23% of frames. It is
now **filled as well as stroked and held for ten ticks**, which covers half of Arc's own
cadence and puts it on screen in **42%** of frames; the assertion states that band rather than
the integer, because six was never wrong as a *value* — it was wrong against a cadence nobody
had divided it by. Both are render constants, so §14's golden hash does not move.

**7. And then the redesign's own fix became the thing §11 forbids — A-065.** The verbs were
printed on the canvas because a tester could read the board and had no move, which was the
right fix for that report and **the wrong object**: two permanent lines naming eight bindings
is §11's *text wall* by name, read once and thereafter furniture, still there on run forty.
It is now a **sequence** — one line, one verb, chosen by what is true at the cursor, retired
for good the moment the player performs it, ending empty. Measured through the real
prototype: **five lines across a whole workbench session, never two at once**, and two on the
run tab, where movement and §95.2's dash — the game's only real-time verbs (§111.1) — had no
surface at all. Every verb is an existing label and every key a keycap legend, so §102.2's
prose budget does not move; the label budget does, by one, because `DASH` had no row.

**§82.1's fourth criterion needs reading, not changing.** *They move something without being
asked to* is the gate's sharpest question and the coach eventually **asks** — `ENTER MOVE` is
the third lesson. So the criterion is read against the order rather than against the session:
MOVE sits behind PLACE and HOLDING and is offered only on a cell that already holds something,
which leaves a real window in which an unprompted move is an unprompted move. **What is
recorded is whether the tester moved before that line appeared**, and the coach makes that
answerable because it retires a lesson on use — a tester who never saw `ENTER MOVE` learned it
themselves. That is a reading instruction rather than an instrument, and it is written down
here so the next session does not score the criterion against a build that answers it.

**Next: re-gate.** §82.1's four criteria, asked again, on this build: *tool or chore?* ≥ 3/5 ·
every cell and rotation reachable on a gamepad · **the tester can predict a placement's
consequence before making it** · and **they move something without being asked to**. §70.3's
second rung — reduce the board's interaction cost, never its existence — is what happens if
it fails again, and the third is a §68.5 stop-condition event rather than a redesign. Then
commit 11 and phase 2: the free tray, auto-placement's `AUTO` tag and its ten-second undo,
§103.2's offer cards, and the board wired into the world at steps 4, 5 and 16.

*A session that must stop mid-slice replaces this block with the files it touched and the
invariant currently broken. A session that ends silently mid-change leaves the next one
archaeology it has no context to perform.*

---

<!-- BEGIN GENERATED: roadmap-run -->

## The run

_Generated from the encounter table, the wave curve and the state manifest — so a beat
this page names is a beat `src/data/` contains (§136.2)._

Spawn rate is `2 + 2.2t` per second until **18:00**, where the
curve bends **down** for the only time in the run: spawning thins, derelicts stop
appearing, the horizon structures brighten and the clock counts down. At **20:00**
spawning stops entirely, the field empties, and the thing you have been building toward
walks in.

| Time | Encounter | HP | Target | Phase ticks |
|---|---|---|---|---|
| 3:00 | Sentinel | 4900 | 25 s | — |
| 6:00 | Breaker | 10600 | 30 s | — |
| 10:00 | Regulator | 30000 | 45 s | 50% |
| 13:00 | Sentinel Prime | 29000 | 35 s | — |
| 16:00 | Breaker Prime | 35600 | 35 s | — |
| 20:00 | THE FOUNDRY | 215300 | 100 s | 66% · 33% |

Every boss kill banks salvage and starts a **20-second release beat** — spawning stops,
heat drains, and the field's wrecks become visible at the edge of vision, named and
ageing, some of them yours. It is also where the bezel's board tile brightens, because
twenty seconds of free hands is where ten seconds of wanted head belong.

THE FOUNDRY's third phase vents **+4 region heat** into your board, and from
**1.5x the fight's target length** it steps +1 every 15 seconds, uncapped. That is
the fight's only end condition, and a competent player never learns it exists.

<!-- END GENERATED: roadmap-run -->

---

<!-- BEGIN GENERATED: roadmap-coverage -->

## Assertion coverage

```
phase 1: 31/32 implemented · 32 planned (seeded)
phase 2: 23/34 implemented · 44 planned (34 seeded)
phase 3: 0/0 implemented · 148 planned (0 seeded)
phase 4: 0/0 implemented · 26 planned (0 seeded)
phase 5: 0/0 implemented · 18 planned (0 seeded)
phase 6: 0/0 implemented · 12 planned (0 seeded)
total:   54/66 implemented · 280 planned
```

<!-- END GENERATED: roadmap-coverage -->

---

<!-- BEGIN GENERATED: roadmap-schedule -->

## The schedule

_Generated from the deliverable list in `src/data/plan.ts` (§145.6). §21 stated 19-24
sessions while its own rows summed to 20-26, and twenty passes then added 7.3-10.6
sessions of scope while declaring the total unchanged. **An addition is costed against
the increment, never against the total.**_

| Phase | | Sessions | Deliverables |
|---|---|---|---|
| 1 | Core loop | 3–4 | 9 |
| 2 | The hook | 4–6 | 7 |
| 3a | Content and balance | 5–7 | 7 |
| 3b | Reconciliation and the storefront | 4–5 | 5 |
| 4 | Feel and accessibility | 5–7 | 8 |
| 5 | Growth | 2–3 | 4 |
| 6 | Ship — Early Access launch | 4–6 | 6 |
| 7 | Content drop 1 | 3–4 | 3 |
| 8 | Content drop 2 | 2–4 | 3 |
| 9 | Content drop 3 | 3–4 | 3 |
| 10 | 1.0 | 3–4 | 3 |
| | **To Early Access** | **27–38** | 46 |
| | **To 1.0** | **38–54** | 58 |

### The items

| Phase | Sessions | Deliverable | Added by |
|---|---|---|---|
| 1 | 0.3–0.4 | Repo skeleton, empty dependencies, strict TypeScript, Vite, CI green on an empty test | §17 |
| 1 | 0.4–0.5 | src/data/ partitioned by system, tools/gendocs.ts, the appendix-drift check | §63.3 |
| 1 | 0.3–0.4 | tests/assertions.ts seeded, and CI failing in both directions | §71.2 |
| 1 | 0.4–0.5 | core/rng, core/fixedmath with a baked sine table, the no-transcendentals lint | §14 |
| 1 | 0.4–0.6 | core/loop generated from src/data/tickorder.ts, core/pool, core/spatialhash | §142.6 |
| 1 | 0.5–0.7 | render/canvas2d behind render/renderer, the bezel, the generated stroke face and boot atlas, friend/foe language | §140.2 |
| 1 | 0.3–0.4 | Player movement, vent-dash, Arc, Swarmers — the first playable | §71.4 |
| 1 | 0.2–0.3 | core/input recording, replay, the golden-hash test, core/lifecycle and snapshots | §14 |
| 1 | 0.2–0.2 | The eight canonical documents, written once there is something to describe | §136.3 |
| 2 | 0.8–1 | The grid, 0-1 BFS power propagation, and the power-input recompute rule | §15 |
| 2 | 0.6–0.8 | Region heat as the derived 3x3 sum, rendered as the cell fill | §134.2 |
| 2 | 0.7–1 | Placement, rotation, the move verb, scrapping, undo | §112.2 |
| 2 | 0.5–1 | Inspect mode and the placement ghost — the board is not a decision until its numbers are visible | §69.3 |
| 2 | 0.7–1 | Offer cards in the bezel at 20% time, the projected-slot ghost, and the CODEX | §103.2 |
| 2 | 0.4–0.6 | The screen registry, three navigation idioms, and the B-goes-up-one-level rule | §101.6 |
| 2 | 0.3–0.6 | Meltdown as an active crisis, ambient and haptic heat, causal placement juice | §2.2A |
| 3a | 1.2–1.6 | All fourteen drafted components, five levels each, ten evolutions | §131.2 |
| 3a | 1–1.4 | Six enemies, six encounters including the escalating P3 vents | §10 |
| 3a | 0.5–0.7 | Board expansion, naming, starting-emitter choice | §8 |
| 3a | 0.8–1.1 | Banking, the Hall, derelicts, own-wreck seeding | §56 |
| 3a | 0.7–1 | Synergies, anomalies, elites, the reveal | §4 |
| 3a | 0.5–0.8 | Wave director, meta, cold open, onboarding, release beats | §11 |
| 3a | 0.3–0.4 | The evaluator, the four bot policies, and tools/autobalance.ts | §143.3 |
| 3b | 1.2–1.5 | Port every surrogate analysis to tools/ against the real simulation, and record each disagreement | §72.5 |
| 3b | 0.6–0.7 | Telemetry: web analytics, the write-only Worker, TELEMETRY.md, the in-game opt-out | §98.3 |
| 3b | 0.6–0.8 | growth/capsule.ts and the store assets it feeds | §20 |
| 3b | 0.7–0.8 | The capped demo, share links, and the deploy gate | §62.2 |
| 3b | 0.9–1.2 | The daily seed, the tiered score, and the PAR worker | §124 |
| 4 | 0.7–0.9 | The settings screen — five groups, seventeen rows — and the pause menu | §101.4 |
| 4 | 0.6–0.8 | Colourblind variants, reduce flashing, type scale, battery and fps options | §12 |
| 4 | 1–1.4 | The WebGL sprite-batch backend — budgeted, not contingent | §39.3 |
| 4 | 0.7–1 | WORKSHOP with the live engagement slider, and the duty ladder from -3 to +10 | §99.3 |
| 4 | 0.4–0.6 | The Electron shell: a desktop binary of the same bundle, a depot, two apps from two flag sets | §148.3 |
| 4 | 0.4–0.6 | The throttled perf profile and the first Deck Verification submission | §100.6 |
| 4 | 1–1 | One session whose entire budget is things no assertion requires — pre-committed so it is not what gets cut | §74.5 |
| 4 | 0.2–0.7 | The auto-captured peak moment and the event-cache render refactor | §140.5 |
| 5 | 0.7–1 | Clip recorder and the replay-link viewer | §21 |
| 5 | 0.3–0.5 | Hall sharing | §21 |
| 5 | 0.6–0.9 | The achievement-icon and library-asset generators over src/data/assets.ts | §140.3 |
| 5 | 0.4–0.6 | The Next Fest build, taken with whatever exists | §146.4 |
| 6 | 1.4–2 | The Steamworks integration: achievements, cloud saves, leaderboards, Steam Input, Rich Presence | §19 |
| 6 | 0.8–1.2 | The i18n runtime, five locales, and the +30% expansion layout | §141.3 |
| 6 | 0.4–0.6 | The library asset set and client icon, checked against the partner site | §140.4 |
| 6 | 0.6–0.9 | Store page, Early Access questionnaire, ratings, content survey, depot setup | §138.2 |
| 6 | 0.4–0.6 | Deck Verification, second pass | §100.6 |
| 6 | 0.4–0.7 | Early Access launch | §20 |
| 7 | 0.8–1 | Drop 1: the Ring core | §21 |
| 7 | 1.2–1.5 | Drop 1: the daily leaderboard and the GRAVEYARD | §66.4 |
| 7 | 1–1.5 | Drop 1: one emitter and one amplifier | §80.3 |
| 8 | 0.8–1.5 | Drop 2: the replay viewer UI | §21 |
| 8 | 0.6–1.2 | Drop 2: duty ratings 4-10, with the ladder sweep re-run | §49.2 |
| 8 | 0.6–1.3 | Drop 2: an anomaly set | §91.4 |
| 9 | 0.8–1 | Drop 3: three anomalies | §21 |
| 9 | 0.7–1 | Drop 3: achievements 20 to 30 | §19 |
| 9 | 1.5–2 | Drop 3: a fourth core — a geometry, a threshold pair, a ladder and a sweep | §50.1 |
| 10 | 1.5–2 | 1.0: the Substrate biome | §138.5 |
| 10 | 0.8–1 | 1.0: the 10,000-run release sweep across 16 shards | §40.3 |
| 10 | 0.7–1 | 1.0: the price rise to $12.99, and the store refresh | §144.5 |

<!-- END GENERATED: roadmap-schedule -->

---

<!-- BEGIN GENERATED: roadmap-commits -->

## The first ten commits

_Ordered by dependency. Commits 1-3 contain no gameplay on purpose: they are the three
machines that make every later session cheap — the external signal, the source of
truth, and the contract._

1. **Repo skeleton, empty `dependencies`, strict `tsconfig`, Vite, CI green on an empty test** — §17: the build going red is the only external signal that exists, and it must exist before there is anything to break
2. **`src/data/` partitioned by system, `tools/gendocs.ts`, the appendix-drift check, the state manifest, the formula-term inventory, distributions as weighted objects** — §63.3: the specification's home, before any code reads a constant
3. **`tests/assertions.ts` seeded with the manifest, `expected-fail` and `quirk` flags, and the both-directions CI check** — §71.2: the contract, before the work
4. **`core/rng`, `core/fixedmath` with a baked sine table, `gen/strokefont` from the same emitter, the no-transcendentals lint** — §14: retrofitting determinism is the expensive mistake
5. **`core/loop` generated from `src/data/tickorder.ts`, `core/pool`, `core/spatialhash` with its brute-force test** — §142.6: a system cannot be added without choosing a step, and the time-scale is a tick gate
6. **`render/canvas2d` behind `render/renderer`, the bezel, `gen/atlas` and the no-`fillText` rule, friend/foe language** — §46.5: readability is phase 1, not polish
7. **Player movement, vent-dash, Arc, Swarmers — the first playable** — The smallest thing that is a game
8. **`core/input` recording, replay, the golden-hash test, `core/lifecycle` and snapshots** — §14's payoff, and the `SessionStart` hook lands with it
9. **The eight canonical documents: `CLAUDE.md` `DECISIONS.md` `ROADMAP.md` `LAWS.md` `PIPELINE.md` `TELEMETRY.md` `STORE.md` `VOICE.md`** — §63.4 and §75.3: written once there is something to describe
10. **The board — grid, 0-1 BFS power, region heat as the derived sum, placement, the move verb, scrapping, inspect mode, causal juice, gamepad cursor, engagement slider — shipped as a playable link** — §81.3: the one question that can veto the project, asked at session 3 instead of session 5-7

### The canonical homes

_§135.4: a canonical home is a **budget**, not just a location._

| File | Holds | Source | Token ceiling | Generated |
|---|---|---|---|---|
| `src/data/` | Constants — and Appendix A is a rendered view of it | §63.3 | 6000 | no |
| `tests/assertions.ts` | Assertions, with tier, phase, cadence, status and why | §71.2 | 5000 | no |
| `ROADMAP.md` | Where the project is, and what the run is like | §63.4 | 1500 | yes |
| `DECISIONS.md` | Every settled decision, its current owner, and what it supersedes | §75.3, §84.1 | 4000 | yes |
| `src/ui/screens.ts` | The screen registry, the three idioms, and the navigation graph | §101.6 | 500 | no |
| `LAWS.md` | What may never be done — the judgment half is what a session reads | §114.4 | 700 | yes |
| `VOICE.md` | The voice of the ~640 human-written words, and it ships none of them | §133.4 | 500 | no |
| `src/data/builds.ts` | Four products and every flag that differs between them, with no defaults | §148.4 | 800 | no |

<!-- END GENERATED: roadmap-commits -->

---

## Feedback log

*Authored. Every checkpoint link opens on a one-screen changelog naming what changed
because of the last report, marker by marker — `3:40 'unfair' → Chargers now telegraph
0.8 s instead of 0.5 s` (§82.4). The markers are already timestamped and categorised; what
was missing was ever showing them back, and reporting into silence is how a playtest habit
dies.*

Nothing yet — the first checkpoint is commit 10's playable link, and it is specified in its
own terms (§82.3): **twenty minutes with the board and four questions, not runs**, because
a board-only prototype has no runs in it and §9's five numeric thresholds cannot measure
one. They are measured at the phase-2 gate, in context.

**§73.2's calibration set, asked and answered before the first checkpoint:** twenty-plus
hours in **all four** of the bracketing spread — a survivors-like, a spatial build-craft
game, an engine-builder, a bullet hell — and **bounced off none of them**.

That is an unusually clean result and it cuts both ways, so both halves are written down
before any feedback arrives to be read against them.

**What it makes readable.** A complaint from this tester is *craft*, never taste. §73.2's
worked example — *"the board is a chore"* — has exactly one reading here: a player fluent
in Backpack Hero **and** Opus Magnum **and** Nova Drift saying the board is a chore is
§9's gate failing, and §70.3's ladder is the response. There is no audience-fit escape
hatch, which is the strongest possible state for a veto to be measured in.

**What it cannot answer.** This tester sits *above* the split §68.2 positioned against, so
they cannot tell us whether the build-craft audience stays while the survivors audience
bounces. Approval is real and is not evidence of fit. §98.6 already draws that line and it
is now load-bearing rather than decorative: **a population says *minute seven loses
people*, and only a person says *because the board felt like a chore*.** The population
half arrives at phase 3b and nothing before it substitutes.

**Checkpoint 1, answered — and §9's gate failed on it.** *"To be honest I have no idea what
I am doing or what is happening in the game."* Against §82.1's diagnostic the tester marked
all three: **I could not read the picture · I could read it but had no move · I could act but
saw no consequence.** Only *the point* of the thing landed.

**What changed because of it**, marker by marker, per §82.4:

| The marker | What changed |
|---|---|
| *could not read the picture* | The core is drawn at last (A-053) · every word stopped carrying a stray mark and `/` stopped printing as `\` (A-054) · the substrate dot scales with the cell, so the board has a visible shape |
| *could read it but had no move* | The verbs are printed on the canvas · the cursor is white and no longer sits inside the core · it opens adjacent to the core, where the first placement wants to go |
| *could act but saw no consequence* | The AFTER line states the exact projected power and the heat before and after, for the cell under the cursor, before the commit |

**Checkpoint 1, second report: *"I cannot see any weapons firing."*** Four words, and the
cheapest possible demonstration that a *feature* and a *frame* are different objects. The
weapon fired at 3/s throughout — 84 shots over the 30 seconds this repository now measures —
and §46.2 asked for a **firing signature** in the pass that asked for silhouettes, so the
absence was specified rather than overlooked (A-055).

| The marker | What changed |
|---|---|
| *no weapons firing* | The simulation records the shot — its tick, its aim, and every enemy it hurt — where `world.arc` previously held a cooldown and nothing else · the renderer draws the **damage volume** as a fading cone, from the same half-angle constant the damage test uses · a hit enemy flashes white, for free |
| *still no weapons firing* | The wedge is **filled** rather than outlined, and held for **ten ticks rather than six** — half of Arc's own cadence, which takes it from 23% of frames to 42%. Six was never wrong as a value; it was wrong against a cadence nobody had divided it by |

**The second half of that row is the more useful finding.** The first fix was correct, tested,
and reported as a failure — because a channel is only a channel at the rate the player meets
it, and §52.3's effect-size floor has a perceptibility half (§117.5) that no pass had ever
pointed at a *render* constant. The assertion now states the **band** — a signature covers at
least half its weapon's cadence and never more than all of it — rather than the integer.

**The link did not fail before this and it did not "work" either**, which is the distinction
worth keeping: three fault reports earlier in the same checkpoint found a render-blocking
font link and §3's *presence is not permission* (A-052), and fixing both produced a board
that drew. **A board that draws and says nothing is a different failure from a board that
does not draw**, and only a person could have told the two apart.

**A pass over the whole build for bugs, asked for directly.** Four defects, every one
confirmed by running the real code rather than by reading it, and every one now pinned by
an assertion that fails without the fix.

| | What was wrong | How it was measured |
|---|---|---|
| **A-056** | `world.over` was written by step 19 and **read by nothing**, so a dead run kept ticking — and the host persisted that world and restored it, with no restart path anywhere, so the first death bricked the link for that browser | dead at tick 792, still running at 7,200 with **−1,160 integrity and 479 kills** |
| **A-057** | `spawn` hands back a recycled slot and sets only the id; the spawner set every field except the one added last, so §46.2's hit flash arrived on enemies that had never been hit | **45 of 185 spawns** born inside the flash window, wearing the player's white |
| **A-058** | `carrying` is an array index and `scrap` splices, so any scrap below it moved the wrong component — and a scrap above it left the index past the end, where `move` fails silently and never clears | pick up the Orbiter, scrap the Arc, confirm: **the Mine moves and the Orbiter stays put**, then the board stops accepting input |
| **A-059** | The heat tick read the region field *inside* the accumulation loop, interleaving §142.5's step 16 (a) and (c), so **placement order became a property of the arrangement** | identical four-Arc layouts, different build order: **5.8649 against 5.8653** |

**Two of the four are the process rather than the pass.** A-056's first fix guarded only the
`advance()` call and **A-011's ×50-against-×1 symmetry check caught it** — a death can land
mid-batch, so the gate belongs in the catch-up loop too, and that is an assertion written
seventy sections earlier doing exactly the job it was written for. And landing A-056 turned
three *passing* loop tests into an eleven-minute spin: they drove a standing player inside
64 Swarmers to 600 ticks and that world dies at 582. **A gate that correctly stops a dead
world is a hang for every unbounded `while (tick < n)` above it**, so every one of them is
now bounded by `!world.over` and asserts the tick it reached — a legible failure instead of
a silent timeout.

**And the smallest one is the most characteristic.** A-059's divergence is 0.0004 heat,
invisible in play and unreachable by any current test — because the board is not in the
world yet. §14's golden hash would have made it permanent the day it arrived there, which
is §26's silent desync waiting with a date on it.

**A second pass, asked for on the same build.** Four more, and they share a shape the first
four did not: every one is a quantity the simulation computes **correctly** and a consumer
reads at the wrong moment, in the wrong unit, for the wrong verb, or through the wrong
mapping. Nothing here is a bad number; four things are bad *readings* of good ones.

| | What was wrong | How it was measured |
|---|---|---|
| **A-060** | The player step decrements `iframes` and `dashTicks` together, and collision reads i-frames at step 14 — so a cover taken from the already-decremented count is spent early **and spent twice** | the dash's closing ticks ran with `iframes` at 0 while the player was still committed and travelling at **700 u/s** |
| **A-061** | `equilibrium` takes a **generation** and the inspect panel handed it a **heat**, so the one number a placement decision turns on printed as `heat × 1.5` | a region settling at **23.78** announced **35.67**; two Arcs settled at 8.9 against a line of 10 read **13.4** |
| **A-062** | The preview projected a **place** of the tray part while `apply` resolves a **move** first, so the ghost, the HOLDING panel and the AFTER line all described an act the game would not perform | a carried component still holds its old cells, so a legal one-cell move projected **`AFTER BLOCKED`** and then succeeded |
| **A-063** | The heat ramp was linear in `heat ÷ meltdown` against thresholds §58.5 made **geometry-relative**, so a fixed fraction of the span never lands on a threshold | on Lattice the overclock tint began at **8.81 against a line of 10** — the whole band drew overclocked and simulated safe |

**The last one is the one the existing test should have caught, and could not.** A-050 already
asserts *the set drawn at or above the overclock tint is the set the simulation reports
overclocked* — and it passed, because it sampled **one** board whose regions never landed in
the 8.81–10 gap. A-063 is therefore not a stronger version of A-050 but a different claim:
A-050 asks **which quantity** the fill carries and A-063 asks **what the colour means**, and
it sweeps all six board states rather than testing a point. §133.6 wrote the rule two passes
before the defect existed — *a mapping is guarded by an asymmetry over the whole range, never
by a value at a point* — and this is the first time it has been paid.

**And a fifth, asked for after the other four.** §142.5's step 2 states the distinction in
its own comment — *a dash is an EDGE the simulation consumes, a held key is a STATE it
samples* — and the host wrote both as a state, setting the dash bit on every `keydown`. An
OS auto-repeats a held key about thirty times a second.

| | What was wrong | How it was measured |
|---|---|---|
| **A-064** | Holding Shift re-set the dash bit before every tick, so a dash fired the instant §95.2's cooldown expired — for ever | **12 dashes a minute, exactly the ceiling the 5 s cooldown permits**, against **1** for a press |
| | The same event restarts a finished run, so any key held on the death screen rebuilt the world on every repeat | the run never got past its first frame while a key was down |
| | …and §12's board bindings apply a command per repeat | **one press of Enter held for a second is 31 counted decisions**, against §121.4's band of **8–15 a run** |

**The last row is the one worth keeping.** §121.4's decision count is the number §9's gate is
scored on, and the pad path — ten lines below the board bindings — already reads edges and
says exactly why: *"a repeat would make §121.4's decision count a function of how long a
thumb rested."* The keyboard beside it did not, so the sentence describing the defect sat
under the code containing it.

**Each fix was verified by reverting it.** All four tests fail on the pre-fix source and pass
on the fixed one, which is the only evidence that an assertion tests anything.

**Then: "make sure the game has proper tutorialization."** §11 specifies ninety seconds of
teaching-by-play with **no text walls**, and §64.5 permits **exactly one prompt** in the whole
game — *"one prompt across a twenty-minute game is not what that warning is about."* What the
build had was the opposite of both: **two permanent lines naming eight bindings**, printed
above the workbench for ever, and **nothing at all on the run tab.**

| | What was wrong | How it was measured |
|---|---|---|
| **A-065** | The workbench printed every binding it had, always — the text wall §11 forbids by name — and a wall is read once and then becomes furniture | **8 bindings on screen from the first frame to the last**, and the count never fell |
| | The run tab taught nothing: movement and §95.2's dash, which are two of the game's eleven verbs and **both of its real-time ones** (§111.1), had no surface anywhere | **0 lines**, against a dash the tester has to discover by pressing an unlabelled key |
| | §102.2's label budget was **144 of 144** with no row for `DASH`, so the one verb §5.2D calls the game's skill expression could not be *named* even if something had wanted to | the budget assertion fails on the 145th label until the ceiling moves with it |

**The fix is a sequence rather than a card, which is the whole of §11's method.** `ui/coach.ts`
holds an ordered list of lessons, shows **one line at a time**, and drops each the moment the
player performs it. Driven through the real prototype rather than described:
`ENTER PLACE` → `Q E HOLDING` → `ENTER MOVE` → `[ ] FIGHT` → `BACKSPACE SCRAP` → **nothing** —
**five lines, never two at once, and the sequence ends empty.** On the run tab `WASD MOVE` →
`SHIFT DASH` → nothing. `R ROTATE` is the sixth and appears only while the held part has a
footprint rotation would change — **two of the eight tray parts**, so it waits for a shape it
is true of rather than printing beside one it is not. **A returning player sees no line on the
first frame**, because what has been learned is persisted; a pad player is told `A PLACE`
rather than `ENTER PLACE`, from the same table.

**Three properties are worth stating, because each was a defect the probe found and the tests
did not.** A lesson is offered only when it is **available** — `MOVE` never appears on an empty
cell, `SCRAP` never before there is something to scrap, `ROTATE` never for a shape whose
rotations are identical, `FIGHT` never while a component is in the air. Carrying a component
**suppresses every lesson but the one that puts it down**, so the coach cannot advise a verb
the board will refuse. And `MOVE` is marked learned on the **put-down**, not the pick-up,
because picking a component up is `PLACE`'s own input and would otherwise teach itself.

**What this is not.** It is not a tutorial mode, not a modal, not a script; it adds no state
the simulation can see and it never blocks an input. It is §69.6's one honest interaction —
*the prompt fires on a placement that visibly has a consequence* — generalised from one beat
to the six verbs the board actually has, and it obeys §69.2 exactly: **the line names a verb
the player already possesses, and disappears the moment they possess it in the other sense.**

**And the tester's answer to all of that: *"I can't tell what the workbench is doing still
and I never saw any tutorialization."*** Two findings, neither of them a missing feature, and
the second is the one worth leading with: **the line was on screen, correct, and measured.**
It was drawn every frame, at the top-left, exactly as designed. This was the first pass to
answer a report by opening the build in a browser and **looking at it** rather than by reading
the source, and both causes were visible in the first screenshot.

| | What was wrong | How it was measured |
|---|---|---|
| **A-066** | §85.2's own words are *"an empty cell is near-black with a faint dotted **outline**"*, and the code drew **a single dot at the cell's centre** — a plausible neighbour of the spec that every existing check passed | 25 points floating in black: the tester could see the dots and **could not see a cell, its size, or where the board stopped** |
| | The instruction was drawn at `LABEL_SCALE`, in the same weight and colour as the six inspect lines and the KEY | on screen in **100% of frames** and read as a seventh status field |
| | §102.2's `hud.here` had been in the label table since it was written and was **drawn by nothing**, so the panel answering *what is true at the cursor* sat unlabelled between two labelled ones | three blocks of identical small text, and no way to know which the numbers belonged to |
| | The page's own masthead asserted **26 test files · 301 tests · 139 kB** by hand | against **30 · 366 · 147** — §136.5's law unpaid at the one artifact a checkpoint is judged on |

**The first row is §85.4's blind spot, and it is the same blind spot A-054 found in the
face.** That check audits whether a channel **survives colour loss**; it has never audited
whether a channel **carries the right shape**. A dot marks *where* a cell is. An outline says
a cell **is**, how large it is, and where the board stops — which is §108.3's per-core
geometry, the thing that tells a player where they may place at all.

**The second row is A-055 one surface further on**, and that is the finding this pass
contributes. A-055 established that a firing signature present in **23% of frames** is not a
channel, and paid §117.5's perceptibility clause against a render constant for the first
time. This is the same debt at a surface present in **100%** of them: **a channel is only a
channel at the rate the player meets it, and it is only an instruction if it does not look
like a readout.** The atlas is a single-colour raster, so emphasis cannot be hue on the
glyphs — it is **size**, plus a bar in the cursor's own white — and the assertion states the
**relation** (the instruction is strictly larger than every label that reports) rather than
the integer, per §133.6.

**The outline is cheaper than the dot it replaces, which inverted a proxy.** Every empty
cell's dashes go into **one path, stroked once**, so the substrate is **1 draw against the 25
§39.1 budgeted** — and §85.3's *instrument versus status light* had been asserted as
`fullDraws > bezelDraws`, which is now false while the claim is more true than ever. The
band is restated in **geometry**, which is the unit §85.3 was always about; the bezel keeps
its dot and §86.2's measurement does not move.

**Each fix was verified by reverting it**, and by a second screenshot rather than only by a
test: three tests fail on the pre-fix source and pass on the fixed one, and the picture the
tester will open now shows a 5×5 grid of cells with `▌ENTER PLACE` above it at twice the size
of anything else on the canvas.


---

## What is true so far

Measured, not asserted — every figure below is a number this repository prints.

- **Determinism holds over the real simulation** (§14): 10,000 ticks, golden hash, with two
  negative controls — a different seed and a different input log both diverge — because a
  golden constant that only agrees with itself proves nothing.
- **The time-scale is a tick gate, never a `dt` multiplier** (§142.4): bit-identical at
  100%, 20%, 5%, paused, and ×50. The last of those is what §149.3 spends to take the e2e
  tier from eleven minutes of game time to twenty-five seconds.
- **`core/loop` is generated** from `src/data/tickorder.ts`'s twenty-four steps (§142.6), so
  a system cannot be added without choosing a step.
- **The bundle carries zero font bytes and zero asset bytes** (§139.1, §140.2): the 7×9
  stroke face is emitted at build time by the tool that bakes §14's sine table.
- **The board draws the derived field, and the picture is the predicate** (§134.2): the
  cells filled at or above the overclock tint are *exactly* the cells the simulation
  reports overclocked, checked against a counting stub rather than a browser. The two
  readings are both called "heat" and both are in §15, which is why no cross-reference
  could have caught it.
- **The bezel board holds §86.2's fifty-draw allowance** and the `TAB` view costs more,
  measured through the same stub — because §96.3 found both render profiles over ceiling
  from the pass that wrote them, and the counts were estimates.
- **`dependencies` is empty and CI fails if it is not.**

## What is a prior, and says so

§72 draws the line this project cannot afford to blur: **every balance number here was
measured against a surrogate that shares my assumptions**, and is a prior rather than an
observation until phase 3b's reconciliation ports each analysis to the real simulation and
records every disagreement. §72.4's prediction is written down *in advance* — direction by
direction — so that sweep reads as confirmation rather than catastrophe.

Two things are already corrected against measurement rather than argument, and both are in
the commit log: §41.1's *~2,500-character replay code* is **16,000–24,000**, wrong by ~8×
and reported rather than tuned (§121.5); and the shape-grammar symmetry band was set at the
measured 1e-5 rather than the asserted 1e-12, because a baked sine table's interpolation
error is a real quantity and §92.2 forbids moving a baseline to accommodate the thing it
measures.
