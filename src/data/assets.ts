import type { ProvenanceRecord } from './meta.ts'

/**
 * §140.4 — the assets that are not the game.
 *
 * §139.1 claims zero asset bytes and §18 rests the disclosure position on "all art
 * and audio are algorithmic". Both were audited for a hundred and thirty-nine passes
 * against the art INSIDE THE SIMULATION, which is the art the mechanics passes were
 * interested in. The sweep that found the gap is one line: `typeface`, `font`,
 * `achievement icon`, `library capsule`, `client icon`, `wordmark`, `logo` and
 * `favicon` appeared ZERO times in sixteen thousand lines — in a game that renders
 * 131 labels, ~640 words of prose and a 120-entry graveyard.
 *
 * Two of those are not optional in the sense a style choice is optional:
 * **Steamworks will not accept an achievement without two icons**, achieved and
 * unachieved, so §19's twenty have been unshippable since pass 19; and Steam's
 * LIBRARY set plus the client icon is a second required category §20 never listed.
 *
 * Everything here is rendered by `growth/capsule.ts` — §21's own consolidation, the
 * renderer pointed elsewhere, arriving for a fourth time — from a scene and a seed,
 * so **the set regenerates when the art it depicts does** (§136.5) and an icon can
 * never depict a component that has been rebalanced out from under it.
 *
 * §100.7 governs the sizes: Valve's required dimensions are a CLAIM ABOUT THE WORLD,
 * verified at the partner site on upload and never reasoned about here. That is why
 * they are data with a `verifiedAgainst` field rather than constants in a renderer —
 * a size Valve adds is a row, not a session.
 */

export type AssetKind = 'capsule' | 'library' | 'mark' | 'icon'
export type Target = 'steam' | 'web' | 'community'

export interface Asset {
  readonly id: string
  readonly kind: AssetKind
  readonly width: number
  readonly height: number
  /** The scene `growth/capsule.ts` renders. Never a file; always a view of the game. */
  readonly scene: string
  readonly target: Target
  /** §20 — every capsule is validated at the smallest size it will ever be seen at. */
  readonly safeInset: number
  /**
   * §100.7 — the date the dimension was checked against the partner site. Absent
   * means UNVERIFIED, and the phase-boundary sweep says so rather than assuming.
   */
  readonly verifiedAgainst?: string
}

const asset = (
  id: string, kind: AssetKind, width: number, height: number,
  scene: string, target: Target, safeInset: number,
): Asset => ({ id, kind, width, height, scene, target, safeInset })

export const ASSETS: readonly Asset[] = Object.freeze([
  // ── store capsules (§20). The main capsule is the peak moment, because a still
  //    image is what sells the game and §85.2's trace width is what reads at 231x87.
  asset('capsuleMain', 'capsule', 616, 353, 'peak: board deep red, traces blazing, one meltdown igniting', 'steam', 24),
  asset('capsuleSmall', 'capsule', 231, 87, 'peak, cropped to the board alone — the size everything else is validated at', 'steam', 8),
  asset('capsuleHeader', 'capsule', 460, 215, 'peak, wordmark left', 'steam', 16),
  asset('capsuleMainLarge', 'capsule', 1920, 620, 'peak, wide: board left, field right', 'steam', 48),
  asset('capsuleVertical', 'capsule', 374, 448, 'board vertical, the run clock at 18:00', 'steam', 16),
  // ── the library set (§140.4). What the buyer sees after they own it, forever.
  asset('libraryCapsule', 'library', 600, 900, 'the machine at rest, cool, fully powered', 'steam', 24),
  asset('libraryHero', 'library', 3840, 1240, 'the field at 18:00 — the approach, structures brightening', 'steam', 96),
  asset('libraryLogo', 'mark', 1280, 720, 'wordmark: the letters drawn as conduit runs at full-power stroke width', 'steam', 32),
  // ── marks (§140.4). One glyph, rendered at every size anything asks for.
  asset('clientIcon', 'mark', 256, 256, 'the core glyph on near-black', 'steam', 8),
  asset('favicon', 'mark', 32, 32, 'the core glyph on near-black', 'web', 2),
  asset('communityIcon', 'mark', 184, 184, 'the core glyph on near-black', 'community', 8),
])

/**
 * §19's twenty at EA. Nine are §79.2's component unlocks and eleven are §124.6's
 * pride surface, mapped to §113.1's goal ladder rather than invented in phase 6.
 *
 * **Every one is about an object the renderer already draws**, which is what makes
 * §18's position hold at the upload form: an icon is illustrative, and a shape
 * grammar that emits seeded silhouettes produces twenty distinct marks that mean
 * nothing. Naming the scene is what turns the generator into a specification.
 */
export interface Achievement {
  /** The Steamworks API name. Frozen on upload: it is a key, not a label. */
  readonly api: string
  /** §102.2 — the display name and description are PROSE and human-written. */
  readonly scene: string
  readonly seed: number
  /** §19 — per-run or lifetime, explicitly, because §34.2 found one that is neither. */
  readonly scope: 'run' | 'lifetime'
  /** §79.2 — the nine that gate a component unlock. */
  readonly unlocks?: string
}

const achievement = (
  api: string, scene: string, seed: number, scope: 'run' | 'lifetime', unlocks?: string,
): Achievement => (unlocks === undefined ? { api, scene, seed, scope } : { api, scene, seed, scope, unlocks })

export const ACHIEVEMENTS: readonly Achievement[] = Object.freeze([
  // ── §79.2's nine: unlocks earned by first-time acts of play, not dispensed by a
  //    run counter — which is what guarantees runs 2 and 3 contain something new.
  achievement('SURVIVE_MELTDOWN', 'a 3x3 region at meltdown fill, rebooting cell by cell', 1, 'run', 'lance'),
  achievement('CLAIM_DERELICT', 'a wreck silhouette in the corruption amber', 2, 'run', 'tesla'),
  achievement('KILL_SENTINEL', 'the Sentinel silhouette, spiral mid-flight', 3, 'run', 'warden'),
  achievement('REACH_TEN', 'the run clock at 10:00 in the generated face', 4, 'run', 'bore'),
  achievement('OVERCLOCK_THREE', 'three overclock contours meeting at a seam', 5, 'run', 'damper'),
  achievement('KILL_REGULATOR', 'the Regulator, twin beams at the rim', 6, 'run', 'gain'),
  achievement('DISCOVER_SYNERGY', 'the corner notch a discovered synergy draws on its cells', 7, 'lifetime', 'radiator'),
  achievement('EVOLVE_COMPONENT', 'an evolved glyph, mid-transition', 8, 'lifetime', 'governor'),
  achievement('HOLD_OVERCLOCK_60', 'one overclock contour with the run clock beside it', 9, 'run', 'siphon'),
  // ── §124.6's eleven: the pride surface, on §113.1's ladder.
  achievement('FIRST_FOUNDRY_KILL', 'THE FOUNDRY silhouette, amber hull with composited hues', 10, 'run'),
  achievement('KILL_ON_SPINDLE', 'the Spindle cell mask', 11, 'run'),
  achievement('KILL_ON_RING', 'the Ring cell mask', 12, 'run'),
  achievement('TERMINAL_GOAL', 'all three core masks at duty +3', 13, 'lifetime'),
  achievement('KILL_AT_DUTY_TEN', 'the duty dial at its top rung', 14, 'run'),
  achievement('BEAT_EXPERT_PAR', 'the par bar with the player mark past it', 15, 'run'),
  achievement('NO_MELTDOWN_RUN', 'a board at rest, every region below the line', 16, 'run'),
  achievement('ESCAPE_RUNAWAY', 'a region mid-cycle, one component lifted out of it', 17, 'run'),
  achievement('EVOLVE_ALL_TEN', 'a ring of ten evolved glyphs', 18, 'lifetime'),
  achievement('COLD_BUILD_WIN', 'a 3-wide board, cool, walking through vent heat', 19, 'run'),
  achievement('CLAIM_100_DERELICTS', 'a field of wrecks receding', 20, 'lifetime'),
])

/**
 * §140.3 — Steamworks takes an API name, a display name, a description and TWO
 * icons per achievement. The unachieved variant is the same mark at low luminance
 * and desaturated, which satisfies §12's never-hue-alone rule by construction.
 */
export const ICON_SIZE = 64
export const ICON_COUNT: number = ACHIEVEMENTS.length * 2

/** §140.2 — the face is emitted at build time, so the bundle carries zero font bytes. */
export const GENERATED_ASSETS: readonly string[] = Object.freeze([
  'src/gen/sintable.ts — §14: a 4096-entry sine table, because Math.sin is implementation-defined',
  'src/gen/strokefont.ts — §140.2: a 7x9 stroke face, ~900 bytes, emitted by the tool that bakes the sine table',
  'src/gen/loop.ts — §142.6: core/loop, emitted from src/data/tickorder.ts so a system cannot be added without choosing a step',
])

export const provenance: ProvenanceRecord = {
  ASSETS: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.4', derivedFrom: 'definition' },
  ACHIEVEMENTS: { kind: 'authored', system: 'meta', axes: ['provenance'], source: '§19, §79.2, §124.6', derivedFrom: 'definition' },
  ICON_SIZE: { kind: 'authored', system: 'render', axes: [], source: '§140.3', derivedFrom: 'definition' },
  ICON_COUNT: { kind: 'solved', system: 'render', axes: ['provenance'], source: '§140.3', derivedFrom: 'definition', solvedBy: 'two icons per achievement — achieved and unachieved — because Steamworks requires both and neither was ever counted' },
  GENERATED_ASSETS: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§147.2', derivedFrom: 'definition' },
}
