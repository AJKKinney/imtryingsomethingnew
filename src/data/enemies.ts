import { distribution, mean, type ProvenanceRecord, type Weighted } from './meta.ts'

export type EnemyId = 'swarmer' | 'brute' | 'shooter' | 'splitter' | 'phaser' | 'charger'

export interface Enemy {
  readonly id: EnemyId
  readonly hp: number
  readonly speed: number
  readonly hitbox: number
  readonly contact: number
  /** §118.3 — shards and salvage are valued by TIER, not rolled. A Brute is six Swarmers. */
  readonly tierValue: number
  readonly salvageValue: number
}

/**
 * §37.1 was the most fundamental error the arithmetic passes found: every enemy was
 * slower than the player's 150 u/s, so the horde could never close and the entire
 * threat model was decorative. The Swarmer at 170 is the correction, and §94.1 makes
 * it a CAPABILITY assertion rather than a behavioural one.
 */
export const ENEMIES: Readonly<Record<EnemyId, Enemy>> = Object.freeze({
  swarmer:  { id: 'swarmer',  hp: 8,  speed: 170, hitbox: 6,  contact: 5,  tierValue: 1, salvageValue: 1 },
  brute:    { id: 'brute',    hp: 60, speed: 60,  hitbox: 14, contact: 15, tierValue: 6, salvageValue: 5 },
  shooter:  { id: 'shooter',  hp: 20, speed: 80,  hitbox: 8,  contact: 8,  tierValue: 3, salvageValue: 3 },
  splitter: { id: 'splitter', hp: 30, speed: 95,  hitbox: 10, contact: 10, tierValue: 3, salvageValue: 3 },
  phaser:   { id: 'phaser',   hp: 25, speed: 130, hitbox: 8,  contact: 8,  tierValue: 3, salvageValue: 3 },
  charger:  { id: 'charger',  hp: 35, speed: 100, hitbox: 9,  contact: 12, tierValue: 5, salvageValue: 3 },
})

/**
 * §14 forbids iteration over object keys in an order-sensitive path, so the roster's
 * order is declared rather than discovered. `Entity.kind` is an index into this, and
 * an index is what keeps a pooled entity a flat record of numbers (§30).
 */
export const ENEMY_ORDER: readonly EnemyId[] = Object.freeze([
  'swarmer', 'brute', 'shooter', 'splitter', 'phaser', 'charger',
])

export const enemyAt = (kind: number): Enemy => ENEMIES[ENEMY_ORDER[kind] ?? 'swarmer']

/** §38 — projectile speeds. A shot slower than the player can never hit a fleeing one. */
export const SHOOTER_SHOT_SPEED = 260
export const SHOOTER_STANDOFF = 200
export const CHARGER_TELEGRAPH = 0.8
export const CHARGER_DASH_DURATION = 0.5
export const CHARGER_DASH_SPEED = 400

/**
 * §132.2 — the rare variant IS the elite. One element rated 0 and one rated 1
 * became one rated 5: an entity three systems depended on and none defined.
 */
export const ELITE = Object.freeze({
  hpMultiplier: 5, speedMultiplier: 1.25, contactMultiplier: 1.5, tierMultiplier: 5,
  baseRate: 1 / 200,                 // §15's rare-variant rate, unchanged
  dutyRung7Rate: 1 / 45,             // §135.1A — re-solved against the NET load delta
  dutyRung7FromMinute: 5,
  scavengerDropChance: 0.3,          // 26.7 elites x 0.3 = 8.0 against §92.1's 7.72
})

/** §118.2 — PROPORTIONS, not availability windows. Three readings spanned 3.4x. */
export interface MixBand {
  readonly fromMinute: number
  readonly toMinute: number
  readonly mix: readonly Weighted<EnemyId>[]
}

export const WAVE_MIX: readonly MixBand[] = Object.freeze([
  { fromMinute: 0, toMinute: 3, mix: distribution<EnemyId>([{ value: 'swarmer', weight: 1.0 }]) },
  { fromMinute: 3, toMinute: 6, mix: distribution<EnemyId>([
      { value: 'swarmer', weight: 0.70 }, { value: 'brute', weight: 0.16 }, { value: 'shooter', weight: 0.14 }]) },
  { fromMinute: 6, toMinute: 10, mix: distribution<EnemyId>([
      { value: 'swarmer', weight: 0.58 }, { value: 'brute', weight: 0.14 }, { value: 'shooter', weight: 0.12 },
      { value: 'splitter', weight: 0.09 }, { value: 'phaser', weight: 0.07 }]) },
  { fromMinute: 10, toMinute: 18, mix: distribution<EnemyId>([
      { value: 'swarmer', weight: 0.50 }, { value: 'brute', weight: 0.14 }, { value: 'shooter', weight: 0.12 },
      { value: 'splitter', weight: 0.10 }, { value: 'phaser', weight: 0.08 }, { value: 'charger', weight: 0.06 }]) },
  // §118.2 — the only band that hardens in composition while §78.2's curve bends down.
  { fromMinute: 18, toMinute: 20, mix: distribution<EnemyId>([
      { value: 'swarmer', weight: 0.44 }, { value: 'brute', weight: 0.16 }, { value: 'shooter', weight: 0.12 },
      { value: 'splitter', weight: 0.10 }, { value: 'phaser', weight: 0.08 }, { value: 'charger', weight: 0.10 }]) },
])

export const mixAtMinute = (t: number): readonly Weighted<EnemyId>[] => {
  for (const band of WAVE_MIX) if (t >= band.fromMinute && t < band.toMinute) return band.mix
  return WAVE_MIX[WAVE_MIX.length - 1]!.mix
}

/** §118.3 — mix-weighted mean shard value; §105.3 needs 2.458 for the cap to land at 20:00. */
export const meanTierValue = (t: number): number =>
  mean(mixAtMinute(t).map((w) => ({ value: ENEMIES[w.value].tierValue, weight: w.weight })))

export const provenance: ProvenanceRecord = {
  ENEMY_ORDER: { kind: 'authored', system: 'field', axes: [], source: '§14', derivedFrom: 'definition' },
  enemyAt: { kind: 'solved', system: 'field', axes: [], source: '§30', derivedFrom: 'definition', solvedBy: 'ENEMY_ORDER indexed by Entity.kind' },
  ENEMIES: { kind: 'authored', system: 'field', axes: ['damage'], source: '§10, §37.1, §118.3', derivedFrom: 'surrogate' },
  SHOOTER_SHOT_SPEED: { kind: 'authored', system: 'field', axes: [], source: '§38.1', derivedFrom: 'surrogate' },
  SHOOTER_STANDOFF: { kind: 'authored', system: 'field', axes: [], source: '§10', derivedFrom: 'surrogate' },
  CHARGER_TELEGRAPH: { kind: 'authored', system: 'field', axes: [], source: '§38.2', derivedFrom: 'surrogate' },
  CHARGER_DASH_DURATION: { kind: 'authored', system: 'field', axes: [], source: '§38.2', derivedFrom: 'surrogate' },
  CHARGER_DASH_SPEED: { kind: 'authored', system: 'field', axes: [], source: '§38.2', derivedFrom: 'surrogate' },
  ELITE: {
    kind: 'solved', system: 'field', axes: ['damage', 'bands'], source: '§132.2, §135.1A', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/elite.ts — dutyRung7Rate reproduces §120.4\'s +0.048 as a NET load delta, with the x5 tier value\'s XP side counted',
  },
  WAVE_MIX: {
    kind: 'solved', system: 'field', axes: ['damage', 'heat'], source: '§118.2', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/mix.ts — solved against four standing constraints rather than chosen: §48.4 denser-and-softer, §37 Swarmer dominance, §89 bubble reach, §51.2 heat tracking targets hit',
  },
  mixAtMinute: { kind: 'solved', system: 'field', axes: [], source: '§118.2', derivedFrom: 'definition', solvedBy: 'band lookup over WAVE_MIX' },
  meanTierValue: { kind: 'solved', system: 'pickups', axes: ['damage'], source: '§118.3', derivedFrom: 'definition', solvedBy: 'mix-weighted mean of ENEMIES[].tierValue' },
}
