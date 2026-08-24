import type { ProvenanceRecord } from './meta.ts'

/** Player constants (Appendix A). Integrity rather than hit points — §54.2. */
export const PLAYER_INTEGRITY = 100
export const PLAYER_SPEED = 150            // units/second
export const PLAYER_HITBOX = 8
export const IFRAME_SECONDS = 0.5          // §37.2 — GLOBAL, not per enemy
export const DASH_DURATION = 0.2
export const DASH_SPEED = 700              // 140 u travelled
export const DASH_COOLDOWN = 5             // §95.2 — 3 s made dashing on cooldown optimal
export const DASH_VENT = -5                // §95.2, distributed per §111.2
export const INPUT_BUFFER_TICKS = 6        // §142.4 — TICKS, not 100 ms
export const CAMERA_LOOKAHEAD = 0.12
export const CAMERA_HALF_DIAGONAL = 367

export const provenance: ProvenanceRecord = {
  PLAYER_INTEGRITY: { kind: 'authored', system: 'meta', axes: [], source: '§9', derivedFrom: 'surrogate' },
  PLAYER_SPEED: { kind: 'authored', system: 'field', axes: [], source: '§9', derivedFrom: 'surrogate' },
  PLAYER_HITBOX: { kind: 'authored', system: 'field', axes: [], source: '§38.2', derivedFrom: 'surrogate' },
  IFRAME_SECONDS: { kind: 'authored', system: 'field', axes: [], source: '§37.2', derivedFrom: 'surrogate' },
  DASH_DURATION: { kind: 'authored', system: 'field', axes: [], source: '§9', derivedFrom: 'surrogate' },
  DASH_SPEED: { kind: 'authored', system: 'field', axes: [], source: '§9', derivedFrom: 'surrogate' },
  DASH_COOLDOWN: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§95.2', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/dash.ts — the smallest cooldown at which dashing on cooldown is NOT strictly optimal',
  },
  DASH_VENT: {
    kind: 'solved', system: 'heat', axes: ['heat'], source: '§95.2', derivedFrom: 'surrogate',
    solvedBy: 'tools/solve/dash.ts — 1.7 rungs instantly, where one rung is 3.0 equilibrium heat',
  },
  INPUT_BUFFER_TICKS: { kind: 'authored', system: 'ui', axes: [], source: '§30, §142.4', derivedFrom: 'definition' },
  CAMERA_LOOKAHEAD: { kind: 'authored', system: 'render', axes: [], source: '§12', derivedFrom: 'surrogate' },
  CAMERA_HALF_DIAGONAL: {
    kind: 'solved', system: 'render', axes: [], source: '§37.3', derivedFrom: 'definition',
    solvedBy: 'half-diagonal of the fixed 640x360 play area: sqrt(320^2 + 180^2)',
  },
}
