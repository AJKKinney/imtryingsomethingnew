<!-- BEGIN GENERATED: pipeline -->

# PIPELINE (generated from `src/data/`)

> **Do not edit.** §18 rests the disclosure position on a claim about *how every
> shipped thing was made*, and a claim is only auditable if it is enumerated. This is
> the enumeration, emitted from the manifests so it cannot describe a pipeline the
> project stopped having.

## The position

All art and audio are **algorithmic** — the seeded shape grammar, gradients, flood
fills and WebAudio oscillators. No model is sampled at build time or at runtime, and
no training data is involved. Valve's rule attaches to generative-AI content players
consume; the goal is that the game genuinely contains none, and that the form is
answered truthfully. **If anything ships that qualifies, it is disclosed.**

The one category §18 got wrong for eighty passes is text, and §102.1 is the correction:
§18 exempted machine names on the grounds that players write them, and §47.4 auto-names
every machine while §66.1 makes the *shared* name a procedural index — so the one
category it exempted is the category players never write. The word list is
player-consumed generated text and it is on the human side below.

## Generated code, which is never committed (§147.2)

Every typecheck, build and test re-emits first, so a fresh clone cannot lack it — and
the readable artifact is the **source**, not the emission.

- src/gen/sintable.ts — §14: a 4096-entry sine table, because Math.sin is implementation-defined
- src/gen/strokefont.ts — §140.2: a 7x9 stroke face, ~900 bytes, emitted by the tool that bakes the sine table
- src/gen/loop.ts — §142.6: core/loop, emitted from src/data/tickorder.ts so a system cannot be added without choosing a step

## Art derivation

| What | Derived from |
|---|---|
| Enemy and boss silhouettes | `gen/shapes.ts` — a seeded radial grammar: symmetry order, per-wedge vertices at perturbed radii, mirrored |
| Component glyphs | The same grammar, constrained symmetric, closed and axis-aligned — which *is* §46.2's friend/foe rule, one generator with the constraint as the faction |
| Rare variants / elites | The same grammar's asymmetric branch, plus an extra ring (§132.2) |
| Palette | `gen/palette.ts` — eight cool core hues, six warm corruption hues, a heat ramp |
| The board | `render/` over §85.2's grammar: power is the trace's **width**, heat is the cell fill of the **derived** region sum (§134.2) |
| Letterforms | `gen/strokefont.ts` — a 7x9 stroke table emitted at build time by the tool that bakes §14's sine table. **The bundle carries zero font bytes** |
| Text rendering | `gen/atlas.ts` — the locale-invariant glyph set at three scales plus §102.2's labels as whole words. No `fillText` on a frame that renders entities (§147.1) |
| Music and SFX | WebAudio oscillators and envelopes (§12, §29, §86.1). No sample, no recording, no licence, no bytes |

## The asset manifest (§140.4) — 11 rows

Every row is rendered by `growth/capsule.ts` from a scene and a seed, so the set
regenerates when the art it depicts does. **Sizes are claims about the world (§100.7)**:
they are verified at the partner site on upload, and an unverified row says so.

| Asset | Size | Target | Safe inset | Scene | Verified |
|---|---|---|---|---|---|
| `capsuleMain` | 616x353 | steam | 24 | peak: board deep red, traces blazing, one meltdown igniting | **unverified** |
| `capsuleSmall` | 231x87 | steam | 8 | peak, cropped to the board alone — the size everything else is validated at | **unverified** |
| `capsuleHeader` | 460x215 | steam | 16 | peak, wordmark left | **unverified** |
| `capsuleMainLarge` | 1920x620 | steam | 48 | peak, wide: board left, field right | **unverified** |
| `capsuleVertical` | 374x448 | steam | 16 | board vertical, the run clock at 18:00 | **unverified** |
| `libraryCapsule` | 600x900 | steam | 24 | the machine at rest, cool, fully powered | **unverified** |
| `libraryHero` | 3840x1240 | steam | 96 | the field at 18:00 — the approach, structures brightening | **unverified** |
| `libraryLogo` | 1280x720 | steam | 32 | wordmark: the letters drawn as conduit runs at full-power stroke width | **unverified** |
| `clientIcon` | 256x256 | steam | 8 | the core glyph on near-black | **unverified** |
| `favicon` | 32x32 | web | 2 | the core glyph on near-black | **unverified** |
| `communityIcon` | 184x184 | community | 8 | the core glyph on near-black | **unverified** |

## Achievement icons (§140.3) — 20 achievements, **40 icons** at 64x64

Steamworks takes an API name, a display name, a description and **two** icons per
achievement, achieved and unachieved. The unachieved variant is the same mark at low
luminance and desaturated, which satisfies §12's never-hue-alone rule by construction.
Every scene is an object the renderer already draws — which is what makes an
*illustrative* asset generable at all.

| API name | Scope | Unlocks | Scene |
|---|---|---|---|
| `SURVIVE_MELTDOWN` | run | lance | a 3x3 region at meltdown fill, rebooting cell by cell |
| `CLAIM_DERELICT` | run | tesla | a wreck silhouette in the corruption amber |
| `KILL_SENTINEL` | run | warden | the Sentinel silhouette, spiral mid-flight |
| `REACH_TEN` | run | bore | the run clock at 10:00 in the generated face |
| `OVERCLOCK_THREE` | run | damper | three overclock contours meeting at a seam |
| `KILL_REGULATOR` | run | gain | the Regulator, twin beams at the rim |
| `DISCOVER_SYNERGY` | lifetime | radiator | the corner notch a discovered synergy draws on its cells |
| `EVOLVE_COMPONENT` | lifetime | governor | an evolved glyph, mid-transition |
| `HOLD_OVERCLOCK_60` | run | siphon | one overclock contour with the run clock beside it |
| `FIRST_FOUNDRY_KILL` | run | — | THE FOUNDRY silhouette, amber hull with composited hues |
| `KILL_ON_SPINDLE` | run | — | the Spindle cell mask |
| `KILL_ON_RING` | run | — | the Ring cell mask |
| `TERMINAL_GOAL` | lifetime | — | all three core masks at duty +3 |
| `KILL_AT_DUTY_TEN` | run | — | the duty dial at its top rung |
| `BEAT_EXPERT_PAR` | run | — | the par bar with the player mark past it |
| `NO_MELTDOWN_RUN` | run | — | a board at rest, every region below the line |
| `ESCAPE_RUNAWAY` | run | — | a region mid-cycle, one component lifted out of it |
| `EVOLVE_ALL_TEN` | lifetime | — | a ring of ten evolved glyphs |
| `COLD_BUILD_WIN` | run | — | a 3-wide board, cool, walking through vent heat |
| `CLAIM_100_DERELICTS` | lifetime | — | a field of wrecks receding |

## String provenance (§102.6)

Every player-visible string is on exactly one of these lists, and CI fails on a string
that is on neither. The test §102.2 drew: **a label names a thing the player manipulates
and could be an icon or an id; prose is written to be read.**

**Labels — mine: 128 of §102.2's 131.**

| Group | Count | Labels |
|---|---|---|
| emitter | 10 | ARC · LANCE · FLAK · ORBITER · TESLA · MINE · PULSE · WARDEN · BORE · SIPHON |
| amplifier | 4 | GAIN · CLOCK · FOCUS · GOVERNOR |
| support | 5 | WIRE · BUS · SINK · RADIATOR · DAMPER |
| evolution | 10 | CASCADE · RAILGUN · CLUSTER · HALO · STORM · MINEFIELD · SHOCKWAVE · BASTION · LATHE · CRUCIBLE |
| enemy | 7 | SWARMER · BRUTE · SHOOTER · SPLITTER · PHASER · CHARGER · ELITE |
| boss | 6 | SENTINEL · BREAKER · REGULATOR · SENTINEL PRIME · BREAKER PRIME · THE FOUNDRY |
| core | 3 | LATTICE · SPINDLE · RING |
| anomaly | 8 | COLD START · SURGE · SALVAGE RUN · MIRROR · DEAD CELL · RESONANCE FIELD · OVERPRESSURE · SCAVENGER |
| synergy | 6 | PULSE / MINE · TESLA / ORBITER · LANCE / FLAK · OVERCLOCKED CONDUIT · RESONANCE · FLASH-FREEZE |
| meta | 9 | REINFORCED CASING · SERVO TUNING · POWER SURGE · COOLANT RESERVE · SALVAGE MAGNET · FABRICATOR · FAILSAFE · SCRAP BAY · MOUNT POINT |
| hud | 18 | INTEGRITY · CYCLE · DUTY RATING · BANKED · UNSTABLE · HEAT · POWER · DRAW · CELLS · OVERCLOCK · MELTDOWN · REGION · CLEAR WEAR · REPAIR · PENDING · AUTO · PAR · STANDING |
| action | 9 | PLACE · MOVE · ROTATE · SCRAP · UNDO · INSPECT · CLOSE · PRIORITISE · CLAIM |
| setting | 17 | RENDER PROFILE · FRAME CAP · BATTERY SAVER · LANGUAGE · MASTER · MUSIC · SFX · RUMBLE · GLYPHS · CONTROLS · COLOURBLIND · REDUCE FLASHING · TYPE SCALE · BOARD TIME · ASSIST · TELEMETRY · SHOW STANDING |
| screen | 16 | MELTLINE · THE FOUNDRY HALL · LOADOUT · FABRICATION · BOARD · PAUSED · SETTINGS · RUN END · DAILY · WORKSHOP · GOALS · CODEX · RECOVERY · TRANSFER · SCHEMATIC · BUILD REPORT |

**Prose — human-written: 640 words against §102.2's ~640.**

§18 requires every one of these to be written by a person. `VOICE.md` is what they are
written to, and it ships no string of its own.

| Surface | Words | Due | Voice |
|---|---|---|---|
| The machine-name word list — 64 prefixes, 32 roots, 32 numerals | 128 | phase 3b | One semantic register, industrial and thermal (§134.4). ANY prefix must combine with ANY root, because all 65,536 ship and none can be vetoed after §102.3 freezes the format. Numerals read as part numbers, never counts. |
| FAULT TRACE, both variants (§67.3, §74.2, §107.2) | 60 | phase 6 | The machine's telemetry, never the game's verdict. When there was no point of no return it says so, and THAT IS THE COMPLIMENT. It says "found" rather than "existed", because the solver's search is bounded and the sentence must not outrun it. |
| The build-report template (§2.2C, §137.4's novelty line) | 120 | phase 6 | Narrates cause from quantities the simulation already has. Names the overflow conversion and the scrap refund as a refund rather than as income (§128.3, §130.1). |
| 20 achievement names and descriptions (§19, §124.6) | 180 | phase 6 | Each names an object the renderer draws, because §140.3 generates its two icons from that object. |
| 8 anomaly announcement lines (§4) | 64 | phase 6 | The name on first encounter; the real numbers on every encounter after (§109.6). |
| Death copy (§2.2F, §78.3's four beats) | 12 | phase 6 | Leads with the machine you built. THE VICTORY SHIPS ZERO STRINGS (§134.3) — §4.4 defines the reveal as the one deliberately languageless moment in the game, and any sentence arriving with that camera move is a sentence explaining the image. |
| Crash-recovery and error copy (§16) | 40 | phase 6 | States what was recovered and hands over a copyable error code. A crash is a fault the machine reports, which is the one place the voice is literally true. |
| The onboarding beat and the game's single prompt (§11, §69.6) | 36 | phase 6 | One prompt in twenty minutes. It fires on a placement that visibly has a consequence, so it names a key and not a lesson. |


<!-- END GENERATED: pipeline -->
