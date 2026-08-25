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
phase 1: 24/25 implemented · 25 planned (seeded)
phase 2: 18/29 implemented · 42 planned (29 seeded)
phase 3: 0/0 implemented · 148 planned (0 seeded)
phase 4: 0/0 implemented · 26 planned (0 seeded)
phase 5: 0/0 implemented · 18 planned (0 seeded)
phase 6: 0/0 implemented · 12 planned (0 seeded)
total:   42/54 implemented · 271 planned
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

**The link did not fail before this and it did not "work" either**, which is the distinction
worth keeping: three fault reports earlier in the same checkpoint found a render-blocking
font link and §3's *presence is not permission* (A-052), and fixing both produced a board
that drew. **A board that draws and says nothing is a different failure from a board that
does not draw**, and only a person could have told the two apart.

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
