import type { ProvenanceRecord } from './meta.ts'

/**
 * The wave director. Refit four times — §25, §45, §48, and §61.3 when §58–60 raised
 * achievable DPS by 21.5%. The rise was split between density and toughness rather
 * than taken in spawn rate alone, because entity count is what pays for the Deck.
 *
 * §131.7 — it stays a PURE FUNCTION OF t and reads no world state, deliberately:
 * §80.2 requires the daily's curve to be identical for every player on a date, and
 * §120.6 declined adaptive difficulty for that reason among two others.
 */
export const SPAWN_BASE = 2
export const SPAWN_PER_MINUTE = 2.2
export const HP_SCALE_PER_MINUTE = 0.115
export const DAMAGE_SCALE_PER_MINUTE = 0.08

export const SPAWN_RING = 400              // 33 u beyond the camera's 367 u half-diagonal
export const DESPAWN_RADIUS = 551          // §9, §31.2 — despawn grants nothing
export const RUN_SPAWN_STOP_MINUTE = 20    // §48.1 — the field empties and THE FOUNDRY walks in
export const APPROACH_START_MINUTE = 18    // §78.2 — the only time the curve bends DOWN

/** §78.2 — from 18:00 spawning thins rather than thickens. */
export const APPROACH_SPAWN_FALLOFF = 0.45

export const spawnRate = (t: number): number => {
  if (t >= RUN_SPAWN_STOP_MINUTE) return 0
  const base = SPAWN_BASE + SPAWN_PER_MINUTE * t
  if (t < APPROACH_START_MINUTE) return base
  const through = (t - APPROACH_START_MINUTE) / (RUN_SPAWN_STOP_MINUTE - APPROACH_START_MINUTE)
  return base * (1 - APPROACH_SPAWN_FALLOFF * through)
}

export const hpScale = (t: number): number => 1 + HP_SCALE_PER_MINUTE * t
export const damageScale = (t: number): number => 1 + DAMAGE_SCALE_PER_MINUTE * t

export const provenance: ProvenanceRecord = {
  SPAWN_BASE: { kind: 'solved', system: 'field', axes: ['damage'], source: '§61.3', derivedFrom: 'surrogate', solvedBy: 'tools/autobalance.ts — fitted so §45.3\'s load ratio stays in 0.4–0.9 from 3:00' },
  SPAWN_PER_MINUTE: { kind: 'solved', system: 'field', axes: ['damage'], source: '§61.3', derivedFrom: 'surrogate', solvedBy: 'tools/autobalance.ts — same fit; the wave curve is a function of the power curve (§45.3)' },
  HP_SCALE_PER_MINUTE: { kind: 'solved', system: 'field', axes: ['damage'], source: '§61.3', derivedFrom: 'surrogate', solvedBy: 'tools/autobalance.ts — the ×1.205 rise split between density and toughness to protect §31.3\'s entity headroom' },
  DAMAGE_SCALE_PER_MINUTE: { kind: 'authored', system: 'field', axes: ['damage'], source: '§10', derivedFrom: 'surrogate' },
  SPAWN_RING: { kind: 'authored', system: 'field', axes: [], source: '§10, §37.3', derivedFrom: 'surrogate' },
  DESPAWN_RADIUS: { kind: 'solved', system: 'field', axes: [], source: '§31.2', derivedFrom: 'definition', solvedBy: '1.5 x the camera half-diagonal of 367' },
  RUN_SPAWN_STOP_MINUTE: { kind: 'authored', system: 'field', axes: [], source: '§48.1', derivedFrom: 'surrogate' },
  APPROACH_START_MINUTE: { kind: 'authored', system: 'field', axes: [], source: '§78.2', derivedFrom: 'surrogate' },
  APPROACH_SPAWN_FALLOFF: { kind: 'authored', system: 'field', axes: ['damage'], source: '§78.2', derivedFrom: 'surrogate' },
  spawnRate: { kind: 'solved', system: 'field', axes: ['damage'], source: '§10, §78.2', derivedFrom: 'definition', solvedBy: 'the director curve with §78.2\'s approach falloff applied from 18:00' },
  hpScale: { kind: 'solved', system: 'field', axes: ['damage'], source: '§10', derivedFrom: 'definition', solvedBy: '1 + HP_SCALE_PER_MINUTE * t' },
  damageScale: { kind: 'solved', system: 'field', axes: ['damage'], source: '§10', derivedFrom: 'definition', solvedBy: '1 + DAMAGE_SCALE_PER_MINUTE * t' },
}
