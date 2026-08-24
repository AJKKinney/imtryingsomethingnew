<!-- BEGIN GENERATED: appendix-a -->

# APPENDIX A — CANONICAL CONSTANTS (generated)

> **Do not edit.** `src/data/` is the single source of truth and this file is emitted
> from it by `tools/gendocs.ts` (§63.3). CI fails if the committed copy differs from the
> generated one. Where the narrative and this file disagree, this file wins, because it
> is the code.

**Model versions (§61.5)** — a bump fails the build for every constant not re-derived since:

| Axis | Version |
|---|---|
| heat | 3 |
| damage | 4 |
| positioning | 1 |
| bands | 4 |
| provenance | 1 |

## player

| Constant | Value | Provenance |
|---|---|---|
| `CAMERA_HALF_DIAGONAL` | 367 | solved · render · axes — · definition · §37.3 · half-diagonal of the fixed 640x360 play area: sqrt(320^2 + 180^2) |
| `CAMERA_LOOKAHEAD` | 0.12 | authored · render · axes — · surrogate · §12 |
| `DASH_COOLDOWN` | 5 | solved · heat · axes heat · surrogate · §95.2 · tools/solve/dash.ts — the smallest cooldown at which dashing on cooldown is NOT strictly optimal |
| `DASH_DURATION` | 0.2 | authored · field · axes — · surrogate · §9 |
| `DASH_SPEED` | 700 | authored · field · axes — · surrogate · §9 |
| `DASH_VENT` | -5 | solved · heat · axes heat · surrogate · §95.2 · tools/solve/dash.ts — 1.7 rungs instantly, where one rung is 3.0 equilibrium heat |
| `IFRAME_SECONDS` | 0.5 | authored · field · axes — · surrogate · §37.2 |
| `INPUT_BUFFER_TICKS` | 6 | authored · ui · axes — · definition · §30, §142.4 |
| `PLAYER_HITBOX` | 8 | authored · field · axes — · surrogate · §38.2 |
| `PLAYER_INTEGRITY` | 100 | authored · meta · axes — · surrogate · §9 |
| `PLAYER_SPEED` | 150 | authored · field · axes — · surrogate · §9 |

## heat

| Constant | Value | Provenance |
|---|---|---|
| `DISSIPATION_K` | 0.666667 | solved · heat · axes heat · surrogate · §31.1 · the k giving a 1.5 s time constant — responsive enough to feel live, slow enough to manage |
| `EQUILIBRIUM_FACTOR` | 1.5 | solved · heat · axes heat · definition · §31.1 · 1 / DISSIPATION_K, by the steady state of dH/dt = G - kH |
| `OVERCLOCK_DAMAGE_MULTIPLIER` | 1.5 | authored · heat · axes damage · surrogate · §8 |
| `OVERCLOCK_RATE_MULTIPLIER` | 1.5 | authored · heat · axes heat+damage · surrogate · §8 |
| `PASSIVE_GENERATION` | 1 | authored · heat · axes heat · definition · §60.2 |
| `REGION_CELLS_MAX` | 9 | solved · heat · axes — · definition · §15 · (2r+1)^2 for the Chebyshev block; clipped to 4 at a corner and 6 at an edge (§133.1) |
| `REGION_RADIUS` | 1 | authored · heat · axes — · definition · §15 |
| `RUNG` | 3 | solved · heat · axes heat · definition · §58.5 · the equilibrium cost of one average emitter: mean generation 2.08 x 1.5 ~= 3.0 |
| `WORK_BASE` | 0.3 | solved · heat · axes heat · surrogate · §51.4 · tools/solve/heat.ts — with WORK_PER_TARGET, puts a 5-wide at 22.0 against meltdown 22 at 20:00 |
| `WORK_PER_TARGET` | 0.12 | solved · heat · axes heat · surrogate · §51.4 · tools/solve/heat.ts — the pair is the primary tuning handle for the whole risk economy |

## cores

| Constant | Value | Provenance |
|---|---|---|
| `CORES` | { lattice: { id: `lattice`, name: `Lattice`, output: 6, cells: _(25 entries)_, expansion: _(4 entries)_, corePosition: _(object)_, overclock: 10, meltdown: 22, overclockExpanded: 10, meltdownExpanded: 22, unlock: `start` }, spindle: { id: `spindle`, name: `Spindle`, output: 6, cells: _(13 entries)_, expansion: _(4 entries)_, corePosition: _(object)_, overclock: 7, meltdown: 19, overclockExpanded: 7, meltdownExpanded: 19, unlock: _(object)_ }, ring: { id: `ring`, name: `Ring`, output: 9, cells: _(16 entries)_, expansion: _(4 entries)_, corePosition: _(object)_, overclock: 7, meltdown: 17, overclockExpanded: 7, meltdownExpanded: 19, unlock: _(object)_ } } | solved · board · axes heat · surrogate · §8.1, §58.5, §108.3 · tools/solve/ladder.ts — each threshold pair is emitted from the core's max region occupancy; §58.7 re-runs the ladder over all six board states (3 cores x 2 sizes) |
| `EXPANSION_CELLS` | 4 | authored · board · axes — · surrogate · §5.2B |

## enemies

| Constant | Value | Provenance |
|---|---|---|
| `CHARGER_DASH_DURATION` | 0.5 | authored · field · axes — · surrogate · §38.2 |
| `CHARGER_DASH_SPEED` | 400 | authored · field · axes — · surrogate · §38.2 |
| `CHARGER_TELEGRAPH` | 0.8 | authored · field · axes — · surrogate · §38.2 |
| `ELITE` | { hpMultiplier: 5, speedMultiplier: 1.25, contactMultiplier: 1.5, tierMultiplier: 5, baseRate: 0.005, dutyRung7Rate: 0.022222, dutyRung7FromMinute: 5, scavengerDropChance: 0.3 } | solved · field · axes damage+bands · surrogate · §132.2, §135.1A · tools/solve/elite.ts — dutyRung7Rate reproduces §120.4's +0.048 as a NET load delta, with the x5 tier value's XP side counted |
| `ENEMIES` | { swarmer: { id: `swarmer`, hp: 8, speed: 170, hitbox: 6, contact: 5, tierValue: 1, salvageValue: 1 }, brute: { id: `brute`, hp: 60, speed: 60, hitbox: 14, contact: 15, tierValue: 6, salvageValue: 5 }, shooter: { id: `shooter`, hp: 20, speed: 80, hitbox: 8, contact: 8, tierValue: 3, salvageValue: 3 }, splitter: { id: `splitter`, hp: 30, speed: 95, hitbox: 10, contact: 10, tierValue: 3, salvageValue: 3 }, phaser: { id: `phaser`, hp: 25, speed: 130, hitbox: 8, contact: 8, tierValue: 3, salvageValue: 3 }, charger: { id: `charger`, hp: 35, speed: 100, hitbox: 9, contact: 12, tierValue: 5, salvageValue: 3 } } | authored · field · axes damage · surrogate · §10, §37.1, §118.3 |
| `SHOOTER_SHOT_SPEED` | 260 | authored · field · axes — · surrogate · §38.1 |
| `SHOOTER_STANDOFF` | 200 | authored · field · axes — · surrogate · §10 |
| `WAVE_MIX` | [{ fromMinute: 0, toMinute: 3, mix: _(1 entries)_ }, { fromMinute: 3, toMinute: 6, mix: _(3 entries)_ }, { fromMinute: 6, toMinute: 10, mix: _(5 entries)_ }, { fromMinute: 10, toMinute: 18, mix: _(6 entries)_ }, { fromMinute: 18, toMinute: 20, mix: _(6 entries)_ }] | solved · field · axes damage+heat · surrogate · §118.2 · tools/solve/mix.ts — solved against four standing constraints rather than chosen: §48.4 denser-and-softer, §37 Swarmer dominance, §89 bubble reach, §51.2 heat tracking targets hit |
| `meanTierValue` | _(derived function)_ | solved · pickups · axes damage · definition · §118.3 · mix-weighted mean of ENEMIES[].tierValue |
| `mixAtMinute` | _(derived function)_ | solved · field · axes — · definition · §118.2 · band lookup over WAVE_MIX |

## waves

| Constant | Value | Provenance |
|---|---|---|
| `APPROACH_SPAWN_FALLOFF` | 0.45 | authored · field · axes damage · surrogate · §78.2 |
| `APPROACH_START_MINUTE` | 18 | authored · field · axes — · surrogate · §78.2 |
| `DAMAGE_SCALE_PER_MINUTE` | 0.08 | authored · field · axes damage · surrogate · §10 |
| `DESPAWN_RADIUS` | 551 | solved · field · axes — · definition · §31.2 · 1.5 x the camera half-diagonal of 367 |
| `HP_SCALE_PER_MINUTE` | 0.115 | solved · field · axes damage · surrogate · §61.3 · tools/autobalance.ts — the ×1.205 rise split between density and toughness to protect §31.3's entity headroom |
| `RUN_SPAWN_STOP_MINUTE` | 20 | authored · field · axes — · surrogate · §48.1 |
| `SPAWN_BASE` | 2 | solved · field · axes damage · surrogate · §61.3 · tools/autobalance.ts — fitted so §45.3's load ratio stays in 0.4–0.9 from 3:00 |
| `SPAWN_PER_MINUTE` | 2.2 | solved · field · axes damage · surrogate · §61.3 · tools/autobalance.ts — same fit; the wave curve is a function of the power curve (§45.3) |
| `SPAWN_RING` | 400 | authored · field · axes — · surrogate · §10, §37.3 |
| `damageScale` | _(derived function)_ | solved · field · axes damage · definition · §10 · 1 + DAMAGE_SCALE_PER_MINUTE * t |
| `hpScale` | _(derived function)_ | solved · field · axes damage · definition · §10 · 1 + HP_SCALE_PER_MINUTE * t |
| `spawnRate` | _(derived function)_ | solved · field · axes damage · definition · §10, §78.2 · the director curve with §78.2's approach falloff applied from 18:00 |

## encounters

| Constant | Value | Provenance |
|---|---|---|
| `ARENA_HEIGHT` | 900 | authored · field · axes — · surrogate · §12, §96.5 |
| `ARENA_WIDTH` | 1400 | authored · field · axes — · surrogate · §12, §96.5 |
| `ENCOUNTERS` | { sentinel: { id: `sentinel`, name: `Sentinel`, minute: 3, hp: 4900, targetSeconds: 25, phases: _(0 entries)_ }, breaker: { id: `breaker`, name: `Breaker`, minute: 6, hp: 10600, targetSeconds: 30, phases: _(0 entries)_ }, regulator: { id: `regulator`, name: `Regulator`, minute: 10, hp: 30000, targetSeconds: 45, phases: _(1 entries)_ }, sentinelPrime: { id: `sentinelPrime`, name: `Sentinel Prime`, minute: 13, hp: 29000, targetSeconds: 35, phases: _(0 entries)_ }, breakerPrime: { id: `breakerPrime`, name: `Breaker Prime`, minute: 16, hp: 35600, targetSeconds: 35, phases: _(0 entries)_ }, foundry: { id: `foundry`, name: `THE FOUNDRY`, minute: 20, hp: 215300, targetSeconds: 100, phases: _(2 entries)_ } } | solved · field · axes damage · surrogate · §32.1, §48.3, §61.3 · tools/solve/bosses.ts — hp = DPS(t) x 0.6 x targetSeconds, the Foundry at x1.0 because §48.1 stops spawning |
| `FOUNDRY_ESCALATION_FACTOR` | 1.5 | solved · field · axes bands · surrogate · §129.1 · the smallest factor that never fires on the intended winning run at any duty rung |
| `FOUNDRY_ESCALATION_INTERVAL` | 15 | authored · heat · axes heat · surrogate · §127.2 |
| `FOUNDRY_ESCALATION_STEP` | 1 | authored · heat · axes heat · surrogate · §127.2 |
| `FOUNDRY_VENT_HEAT` | 4 | authored · heat · axes heat · surrogate · §122.5 |
| `PRIME_ORB_HEAT` | 1 | authored · heat · axes heat · surrogate · §120.5 |
| `PRIME_ORB_HEAT_CAP` | 3 | authored · heat · axes heat · surrogate · §120.5 |
| `REGULATOR_BEAM_SWEEP` | 15 | authored · field · axes — · surrogate · §38.4 |
| `RELEASE_BEAT_SECONDS` | 20 | authored · field · axes — · surrogate · §2.2B, §73.1 |

## tickorder

| Constant | Value | Provenance |
|---|---|---|
| `TICK_ORDER` | [{ index: 1, id: `timescale`, module: `core/loop`, system: `core`, note: `§142.4 — a TICK GATE: target interval 16.67 ms / scale. At scale 0, no tick occurs. Never a dt multiplier, which would make §14 a function of frame timing.` }, { index: 2, id: `input`, module: `core/input`, system: `core`, note: `Consume the recorded snapshot: movement, dash, board commits, offer selection — each stamped with this tick.` }, { index: 3, id: `lifecycle`, module: `core/lifecycle`, system: `core`, note: `Pause check and accumulator clamp (§3.B) — handhelds get their lids closed constantly.` }, { index: 4, id: `board`, module: `grid/board`, system: `board`, note: `§142.3 — place, MOVE (carrying level and heat, §112.4), rotate, scrap, undo. Before everything that reads the board.` }, { index: 5, id: `power`, module: `grid/power`, system: `power`, note: `§142.2 — recompute iff a POWER INPUT changed: occupancy, core output, or cell mask. "When the board changes" could not fire §131.5's blackout.` }, { index: 6, id: `player`, module: `game/player`, system: `field`, note: `Movement and dash resolution; the vent-dash writes its -5 into the per-cell store here, before this tick's generation (§111.2).` }, { index: 7, id: `spawn`, module: `game/spawner`, system: `field`, note: `§132.2 elite roll, §48.1's 20:00 stop — and a boss arrival deferred one tick if an offer card is open (§127.6).` }, { index: 8, id: `derelicts`, module: `game/derelicts`, system: `field`, note: `§110.3 — the channel is cancelled by movement this tick and unaffected by damage; progress resets.` }, { index: 9, id: `enemyai`, module: `game/enemies`, system: `field`, note: `AI and movement.` }, { index: 10, id: `spatialhash`, module: `core/spatialhash`, system: `core`, note: `Rebuild. Cell size 64 u.` }, { index: 11, id: `separation`, module: `game/enemies`, system: `field`, note: `Soft repulsion, capped at 8 neighbours per enemy per tick.` }, { index: 12, id: `weapons`, module: `game/weapons`, system: `field`, note: `Fire, iterating components in stable (row, col) order — §14 forbids a comparator that can return 0 for distinct entities.` }, { index: 13, id: `projectiles`, module: `game/projectiles`, system: `field`, note: `Movement.` }, { index: 14, id: `collision`, module: `game/damage`, system: `field`, note: `Collision and damage. §37.2 — global i-frames, single highest overlapping contact value.` }, { index: 15, id: `envheat`, module: `game/environment`, system: `heat`, note: `§120.5's orbs against the step-6 position, §127.2's escalating P3 vents.` }, { index: 16, id: `heat`, module: `grid/heat`, system: `heat`, note: `(a) accumulate generation (b) recompute regions over the dirty set (c) resolve overclock crossings — enter at >=, leave at <, no exit value (§110.2) (d) resolve meltdowns: wear at the transition (§130.2), Failsafe consuming its single suppression (§130.4), §131.5's blackout setting core output to 0 and flagging step 5, and §135.1C's Siphon volley.` }, { index: 17, id: `pickups`, module: `game/pickups`, system: `pickups`, note: `Magnetism and collection. XP seeks from anywhere on screen; salvage does not (§105.3).` }, { index: 18, id: `xp`, module: `game/economy`, system: `economy`, note: `XP applied, level-ups QUEUED, support rank recomputed as ceil(level/8) effective next tick (§122.6).` }, { index: 19, id: `deaths`, module: `game/world`, system: `field`, note: `Deaths and pool returns.` }, { index: 20, id: `bossphase`, module: `game/boss`, system: `field`, note: `Phase transitions — §120.5's Regulator +4 flags step 5.` }, { index: 21, id: `offers`, module: `game/economy`, system: `draft`, note: `§110.4 — at most one card, FIFO, "+1 pending" rather than a second card.` }, { index: 22, id: `announce`, module: `ui/announce`, system: `ui`, note: `§128.2 — tray delivery, support rank-up, overflow conversion. A reward not announced is a balance change.` }, { index: 23, id: `telemetry`, module: `growth/telemetry`, system: `build`, note: `Accumulation only. Web build only (§98.4).` }, { index: 24, id: `tickend`, module: `core/loop`, system: `core`, note: `tick++. Level-ups resolve at end of tick, so a component added this frame cannot fire this frame.` }] | authored · build · axes provenance · definition · §26, §142.5 |

## builds

| Constant | Value | Provenance |
|---|---|---|
| `FORBIDDEN_SYMBOLS` | { playtest: [], web: [`__MELTLINE_TEST_TIMESCALE__`, `__MELTLINE_MARKERS__`], steamDemo: [`__MELTLINE_TEST_TIMESCALE__`, `__MELTLINE_MARKERS__`, `__MELTLINE_TELEMETRY_ENDPOINT__`], steamFull: [`__MELTLINE_TEST_TIMESCALE__`, `__MELTLINE_MARKERS__`, `__MELTLINE_TELEMETRY_ENDPOINT__`, `__MELTLINE_RUN_CAP__`] } | authored · build · axes provenance · definition · §148.4, §149.3 |
| `TARGETS` | { playtest: { dailySeed: true, par: true, acceptsShareLinks: true, runCapMinutes: null, coresAvailable: `all`, renderProfile: `full`, telemetry: false, steamPlateInBezel: false, wishlistButton: false, emitsTransferCode: false, acceptsTransferCode: false, saveMedium: `localStorage`, dailyLeaderboard: false, graveyard: false, achievements: false, rebinding: `keyboardSixAction`, cjkFace: `lazyFetch`, autoplayGate: true, playtestMarkers: true, deployGate: `none`, bundleCeilingBytes: null, testTimeScale: true }, web: { dailySeed: true, par: true, acceptsShareLinks: true, runCapMinutes: 10, coresAvailable: `lattice`, renderProfile: `lowSpec`, telemetry: true, steamPlateInBezel: true, wishlistButton: true, emitsTransferCode: true, acceptsTransferCode: false, saveMedium: `localStorage`, dailyLeaderboard: false, graveyard: false, achievements: false, rebinding: `keyboardSixAction`, cjkFace: `lazyFetch`, autoplayGate: true, playtestMarkers: false, deployGate: `stableTagPlusFlagSet`, bundleCeilingBytes: 700000, testTimeScale: false }, steamDemo: { dailySeed: true, par: true, acceptsShareLinks: true, runCapMinutes: 10, coresAvailable: `lattice`, renderProfile: `lowSpec`, telemetry: false, steamPlateInBezel: false, wishlistButton: true, emitsTransferCode: true, acceptsTransferCode: false, saveMedium: `file`, dailyLeaderboard: false, graveyard: false, achievements: false, rebinding: `steamInput`, cjkFace: `bundled`, autoplayGate: false, playtestMarkers: false, deployGate: `steamDepot`, bundleCeilingBytes: null, testTimeScale: false }, steamFull: { dailySeed: true, par: true, acceptsShareLinks: true, runCapMinutes: null, coresAvailable: `all`, renderProfile: `auto`, telemetry: false, steamPlateInBezel: false, wishlistButton: false, emitsTransferCode: false, acceptsTransferCode: true, saveMedium: `fileAndSteamCloud`, dailyLeaderboard: true, graveyard: true, achievements: true, rebinding: `steamInput`, cjkFace: `bundled`, autoplayGate: false, playtestMarkers: false, deployGate: `steamDepot`, bundleCeilingBytes: null, testTimeScale: false } } | authored · build · axes provenance · definition · §148.1, §148.4 |

<!-- END GENERATED: appendix-a -->
