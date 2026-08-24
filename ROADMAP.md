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

Nothing. **Commit 9 landed green**: the eight canonical documents, their four generators,
and the sentinel check that keeps them honest in both directions.

Three of the five new checks found something on the day they were written, which is the
only evidence worth having that a check is real. **A-044** found a screen title and the
prose inside it sharing one id — the cheapest possible demonstration that §102.2's
boundary is checkable rather than rhetorical. **A-014** found the laws, the decisions,
the schedule and the asset manifest riding into the web bundle for **58 KB**, in a build
whose whole argument is that it loads in a second. And chasing that found §148.4's build
manifest inside §16's content hash — which would have given the same daily seed a
different fingerprint on web and on Steam, failing §119.8's fairness check on two runs
that agree.

**Next: commit 10 — the board.** Grid, 0-1 BFS power, region heat rendered as the derived
3×3 sum (§134.2), placement, the move verb (§112.2), scrapping, inspect mode, causal
placement juice, gamepad cursor, and an engagement slider in place of enemies — shipped as
a playable link. **§9's gate runs there**, at session 3 rather than session 5–7 (§81.3):
four qualitative criteria (§82.1), twenty minutes with the board and four questions rather
than eight runs (§82.3), and §73.2's calibration set asked *before* it so the result can be
read correctly.

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
phase 1: 22/23 implemented · 23 planned (seeded)
phase 2: 0/25 implemented · 41 planned (25 seeded)
phase 3: 0/0 implemented · 148 planned (0 seeded)
phase 4: 0/0 implemented · 26 planned (0 seeded)
phase 5: 0/0 implemented · 18 planned (0 seeded)
phase 6: 0/0 implemented · 12 planned (0 seeded)
total:   22/48 implemented · 268 planned
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

**Before that checkpoint, one thing is asked once (§73.2):** which of a bracketing spread —
a survivors-like, a spatial build-craft game, an engine-builder, a bullet hell — you have
put twenty-plus hours into, and which you bounced off. It makes one person's feedback
*interpretable* rather than merely authoritative: *"the board is a chore"* from a
build-craft player is a design emergency, and from someone who bounced off Opus Magnum it
is a data point about audience fit.

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
