/**
 * §101.6 — the fifth canonical home, and the only one the player ever sees.
 *
 * §75.2 found that constants, assertions, progress and decisions each needed a home
 * because prose drifts. The interface got none: it was **one line of the file tree**
 * for a hundred sections, while forty passes promised seventeen settings one at a
 * time and fifteen screens accumulated with **no navigation graph anywhere** — in a
 * project whose primary venue is judged on gamepad reachability.
 *
 * Writing the list out settled one screen by omission: **there is no main menu.**
 * §55.3 made the Hall the loadout screen for thematic reasons — you walk to a machine
 * to begin — and in doing so deleted the main menu without saying so. The Hall is
 * home, and the game's front page is its graveyard.
 *
 * §101.3's structural move is the one that matters: gamepad completeness is a
 * property of the CONSTRUCTION rather than a test result. Every screen is exactly one
 * of three idioms, all three already specified elsewhere, and no screen may invent a
 * fourth — which is the same shape as §60.2's heat floor and §35.3's rule that an
 * invariant survives retuning where a value does not.
 */

export type Idiom =
  /** A vertical focus ring: up/down moves, left/right changes a value IN PLACE. */
  | 'list'
  /** §3.G's snapping cell cursor: A places, X rotates, Y scraps, B closes. */
  | 'gridCursor'
  /** §55.3's Hall: the stick moves YOU, A interacts with what you are standing at. */
  | 'walkedSpace'

export type ScreenId =
  | 'title' | 'hall' | 'loadout' | 'metaShop' | 'run' | 'boardView'
  | 'pause' | 'settings' | 'runEnd' | 'daily' | 'workshop' | 'goals'
  | 'codex' | 'recovery' | 'transfer' | 'shareLanding'

export interface Screen {
  readonly id: ScreenId
  readonly idiom: Idiom
  /**
   * Where `B` goes — **exactly one level up, always** (§101.3). That rule is only
   * sayable because the graph is a tree with three named cross-edges, and it is the
   * single thing that stops twenty memoryless sessions producing twenty different
   * back-button behaviours.
   */
  readonly parent: ScreenId | null
  /** Everything reachable from here that is not the parent. */
  readonly reaches: readonly ScreenId[]
  readonly why: string
}

const s = (
  id: ScreenId, idiom: Idiom, parent: ScreenId | null, reaches: readonly ScreenId[], why: string,
): Screen => ({ id, idiom, parent, reaches, why })

export const SCREENS: Readonly<Record<ScreenId, Screen>> = Object.freeze({
  title: s('title', 'list', null, ['hall'],
    'Frame one of the cold open. The required keypress is the IGNITION rather than a wall in front of it (§64.3) — and it is what resumes the AudioContext (§139.2), so the demo is not silent for the audience that decides.'),
  hall: s('hall', 'walkedSpace', null, ['loadout', 'metaShop', 'workshop', 'codex', 'settings', 'daily', 'goals', 'transfer'],
    'HOME. §55.3 made the loadout screen the graveyard — you walk to a machine to begin — which deleted the main menu without saying so, and means every run starts by passing your dead.'),
  loadout: s('loadout', 'list', 'hall', ['run'],
    'Mount points, the core, the announced anomaly, and §107.3\'s duty rating from -3 to +10. A real recurring decision worth a 23.8% spread (§53.3), made against known conditions.'),
  metaShop: s('metaShop', 'list', 'hall', [],
    'Locked entries render as silhouettes (§6.4), because wanting them is the point.'),
  run: s('run', 'gridCursor', null, ['boardView', 'pause', 'runEnd'],
    'The game (§9). It has no B parent because a run is not a place you navigated INTO: it is left by pausing or by ending, and a back button that abandoned it would put §7\'s unstable salvage one keypress from being thrown away.'),
  boardView: s('boardView', 'gridCursor', 'run', [],
    '`TAB` at 20% time, never paused (§9). Inspect mode lives here and so does §112.2\'s move verb.'),
  pause: s('pause', 'list', 'run', ['settings', 'runEnd'],
    'RESUME - SETTINGS - ABANDON, plus §98.4\'s telemetry line in the web build. The board is deliberately NOT reachable from here: routing it through pause would hand the player the true pause §3 declined.'),
  settings: s('settings', 'list', 'hall', [],
    'Five groups, seventeen rows, ONE screen with two entry points (§101.4). Reachable from the Hall and from Pause — the first of three named cross-edges.'),
  runEnd: s('runEnd', 'list', 'hall', [],
    '§78.3\'s four beats, one input each: the peak clip, the build report ending on the fault trace, naming, then totals and the share link. Never seven panels at once.'),
  daily: s('daily', 'list', 'hall', ['run'],
    'One seed, one scored attempt (§125.5), §124.5\'s par shown beside your own score — which is the only rank a web player can ever have.'),
  workshop: s('workshop', 'gridCursor', 'hall', [],
    '§81.3\'s board prototype shipped as a mode (§99.3), with §115.5\'s live engagement slider. It grants nothing and banks nothing, and it is the only practice surface for positioning and dash timing.'),
  goals: s('goals', 'list', 'hall', [],
    '§97.3 — the remaining first-time achievements as a visible goal list, which is what fills runs 8-13, the emptiest stretch of the career and exactly the review window.'),
  codex: s('codex', 'list', 'hall', [],
    '§103.4 — components, field, synergies, career. §69.2 promised a permanent list in one sentence and gave it no home for thirty-four sections.'),
  recovery: s('recovery', 'list', 'hall', ['run'],
    '§16 — resume from the last good snapshot, plus a copyable error code. Because the sim is deterministic, a pasted code replays directly to the crash.'),
  transfer: s('transfer', 'list', 'hall', [],
    '§65.2 — the code every capped product emits, because there is no shared save path between a browser and Steam and §30\'s carryover was void for the whole funnel.'),
  shareLanding: s('shareLanding', 'gridCursor', null, ['run'],
    '§76.5 — a share link opens ON the board, run not started, inspect mode live. Click a link, see a machine, poke at it, then press to run it: looking at a thing is a far lower ask than playing one.'),
})

export const SCREEN_ORDER: readonly ScreenId[] = Object.freeze([
  'title', 'hall', 'loadout', 'metaShop', 'run', 'boardView', 'pause', 'settings',
  'runEnd', 'daily', 'workshop', 'goals', 'codex', 'recovery', 'transfer', 'shareLanding',
])

/** §101.3 — the three cross-edges, named, because they are why `B` still works. */
export const CROSS_EDGES: readonly string[] = Object.freeze([
  'settings — from the Hall and from Pause',
  'runEnd — from death and from abandoning',
  'hall — from run end, recovery and transfer',
])

/**
 * **Three entry points, not one.** §101.3 drew all three arrows — a launch, a crash
 * and a share link — and the first version of this registry modelled the launch and
 * left the other two unreachable from anywhere, which is how a screen gets built and
 * never seen.
 *
 * Each is an entry because something OUTSIDE the graph puts the player there, and
 * each carries the reason, so "make it an entry" can never become the way an
 * accidentally-orphaned screen passes the reachability check.
 */
export const ENTRIES: Readonly<Record<string, string>> = Object.freeze({
  title: 'A cold launch. §64.3 makes it frame one of the cold open rather than a wall in front of it.',
  recovery: '§16 — an uncaught exception at the loop boundary. The player did not navigate here and cannot navigate back to where they were.',
  shareLanding: '§76.5 — a link from outside the game entirely, which is §62.3\'s whole funnel: the post IS the game.',
})

/** The default entry, and the only one a player reaches by choosing to play. */
export const ENTRY: ScreenId = 'title'
