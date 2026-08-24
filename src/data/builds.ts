import type { ProvenanceRecord } from './meta.ts'

/**
 * §148 — the plan said "web build" 84 times, "the demo" 64 and "Steam build" 11,
 * and the words `build target`, `build matrix` and `feature flag` appeared zero
 * times in eighteen thousand lines. Twenty-three behaviours differ between four
 * products, every one decided correctly inside the pass that needed it and never
 * once collected — in the category where a wrong flag is SILENT.
 *
 * Every flag is declared for every target. There is no default, because a default
 * is how §98.4's telemetry ends up in the paid build.
 */
export type TargetId = 'playtest' | 'web' | 'steamDemo' | 'steamFull'

export interface BuildFlags {
  /** §20 — the capped products stop at 10:00 including the Regulator. */
  readonly runCapMinutes: number | null
  readonly coresAvailable: 'all' | 'lattice'
  readonly renderProfile: 'full' | 'lowSpec' | 'auto'
  readonly telemetry: boolean                 // §98.4 — web only, opt-out, no identifiers
  readonly steamPlateInBezel: boolean         // §64.3 — web only
  readonly wishlistButton: boolean
  readonly acceptsShareLinks: boolean         // §74.1 — never into a campaign run
  readonly emitsTransferCode: boolean         // §65.2, §148.5 — every capped product
  readonly acceptsTransferCode: boolean
  readonly saveMedium: 'localStorage' | 'file' | 'fileAndSteamCloud'
  readonly dailySeed: boolean
  readonly dailyLeaderboard: boolean          // §66.4 — Steam full
  readonly graveyard: boolean                 // §104.4 — Steam full
  readonly par: boolean                       // §124.5 — everywhere; the only rank a web player has
  readonly achievements: boolean
  readonly rebinding: 'keyboardSixAction' | 'steamInput'
  readonly cjkFace: 'lazyFetch' | 'bundled'
  readonly autoplayGate: boolean              // §139.2 — browsers suspend AudioContext
  readonly playtestMarkers: boolean           // §41.1 — the channel between the user and me
  readonly deployGate: 'none' | 'stableTagPlusFlagSet' | 'steamDepot'
  readonly bundleCeilingBytes: number | null  // §139.1 — a WEB ceiling (§148.4)
  /** §149.3 — the e2e fast-forward. A fast-forward reachable from a shipped build is a cheat. */
  readonly testTimeScale: boolean
}

const common = {
  dailySeed: true,
  par: true,
  acceptsShareLinks: true,
} as const

export const TARGETS: Readonly<Record<TargetId, BuildFlags>> = Object.freeze({
  playtest: {
    ...common,
    runCapMinutes: null, coresAvailable: 'all', renderProfile: 'full',
    telemetry: false, steamPlateInBezel: false, wishlistButton: false,
    emitsTransferCode: false, acceptsTransferCode: false, saveMedium: 'localStorage',
    dailyLeaderboard: false, graveyard: false, achievements: false,
    rebinding: 'keyboardSixAction', cjkFace: 'lazyFetch', autoplayGate: true,
    playtestMarkers: true, deployGate: 'none', bundleCeilingBytes: null,
    testTimeScale: true,
  },
  web: {
    ...common,
    runCapMinutes: 10, coresAvailable: 'lattice', renderProfile: 'lowSpec',
    telemetry: true, steamPlateInBezel: true, wishlistButton: true,
    emitsTransferCode: true, acceptsTransferCode: false, saveMedium: 'localStorage',
    dailyLeaderboard: false, graveyard: false, achievements: false,
    rebinding: 'keyboardSixAction', cjkFace: 'lazyFetch', autoplayGate: true,
    playtestMarkers: false, deployGate: 'stableTagPlusFlagSet', bundleCeilingBytes: 700_000,
    testTimeScale: false,
  },
  steamDemo: {
    ...common,
    runCapMinutes: 10, coresAvailable: 'lattice', renderProfile: 'lowSpec',
    telemetry: false, steamPlateInBezel: false, wishlistButton: true,
    emitsTransferCode: true, acceptsTransferCode: false, saveMedium: 'file',
    dailyLeaderboard: false, graveyard: false, achievements: false,
    rebinding: 'steamInput', cjkFace: 'bundled', autoplayGate: false,
    playtestMarkers: false, deployGate: 'steamDepot', bundleCeilingBytes: null,
    testTimeScale: false,
  },
  steamFull: {
    ...common,
    runCapMinutes: null, coresAvailable: 'all', renderProfile: 'auto',
    telemetry: false, steamPlateInBezel: false, wishlistButton: false,
    emitsTransferCode: false, acceptsTransferCode: true, saveMedium: 'fileAndSteamCloud',
    dailyLeaderboard: true, graveyard: true, achievements: true,
    rebinding: 'steamInput', cjkFace: 'bundled', autoplayGate: false,
    playtestMarkers: false, deployGate: 'steamDepot', bundleCeilingBytes: null,
    testTimeScale: false,
  },
})

/** §148.4 — symbols that must not appear in a given target's emitted bundle. */
export const FORBIDDEN_SYMBOLS: Readonly<Record<TargetId, readonly string[]>> = Object.freeze({
  playtest: [],
  web: ['__MELTLINE_TEST_TIMESCALE__', '__MELTLINE_MARKERS__'],
  steamDemo: ['__MELTLINE_TEST_TIMESCALE__', '__MELTLINE_MARKERS__', '__MELTLINE_TELEMETRY_ENDPOINT__'],
  steamFull: ['__MELTLINE_TEST_TIMESCALE__', '__MELTLINE_MARKERS__', '__MELTLINE_TELEMETRY_ENDPOINT__', '__MELTLINE_RUN_CAP__'],
})

export const provenance: ProvenanceRecord = {
  TARGETS: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§148.1, §148.4', derivedFrom: 'definition' },
  FORBIDDEN_SYMBOLS: { kind: 'authored', system: 'build', axes: ['provenance'], source: '§148.4, §149.3', derivedFrom: 'definition' },
}
