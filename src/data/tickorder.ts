import type { ProvenanceRecord, System } from './meta.ts'

/**
 * §26 stated the stakes and then sat in a paragraph for a hundred and fifteen passes:
 * "ordering IS the simulation's semantics and a reordering is a silent desync."
 * §142 counted twenty-two tick-ordered behaviours added since, FOURTEEN with no step.
 *
 * So the order is DATA and `core/loop` is generated from it (§142.6): a system cannot
 * be added without choosing a step, and §14's golden hash certifies the order the
 * manifest STATES rather than the order the code drifted into.
 */
export interface TickStep {
  readonly index: number
  readonly id: string
  readonly module: string
  readonly system: System | 'core'
  readonly note: string
}

export const TICK_ORDER: readonly TickStep[] = Object.freeze([
  { index: 1,  id: 'timescale',    module: 'core/loop',        system: 'core',    note: '§142.4 — a TICK GATE: target interval 16.67 ms / scale. At scale 0, no tick occurs. Never a dt multiplier, which would make §14 a function of frame timing.' },
  { index: 2,  id: 'input',        module: 'core/input',       system: 'core',    note: 'Consume the recorded snapshot: movement, dash, board commits, offer selection — each stamped with this tick.' },
  { index: 3,  id: 'lifecycle',    module: 'core/lifecycle',   system: 'core',    note: 'Pause check and accumulator clamp (§3.B) — handhelds get their lids closed constantly.' },
  { index: 4,  id: 'board',        module: 'grid/board',       system: 'board',   note: '§142.3 — place, MOVE (carrying level and heat, §112.4), rotate, scrap, undo. Before everything that reads the board.' },
  { index: 5,  id: 'power',        module: 'grid/power',       system: 'power',   note: '§142.2 — recompute iff a POWER INPUT changed: occupancy, core output, or cell mask. "When the board changes" could not fire §131.5\'s blackout.' },
  { index: 6,  id: 'player',       module: 'game/player',      system: 'field',   note: 'Movement and dash resolution; the vent-dash writes its -5 into the per-cell store here, before this tick\'s generation (§111.2).' },
  { index: 7,  id: 'spawn',        module: 'game/spawner',     system: 'field',   note: '§132.2 elite roll, §48.1\'s 20:00 stop — and a boss arrival deferred one tick if an offer card is open (§127.6).' },
  { index: 8,  id: 'derelicts',    module: 'game/derelicts',   system: 'field',   note: '§110.3 — the channel is cancelled by movement this tick and unaffected by damage; progress resets.' },
  { index: 9,  id: 'enemyai',      module: 'game/enemies',     system: 'field',   note: 'AI and movement.' },
  { index: 10, id: 'spatialhash',  module: 'core/spatialhash', system: 'core',    note: 'Rebuild. Cell size 64 u.' },
  { index: 11, id: 'separation',   module: 'game/separation',  system: 'field',   note: 'Soft repulsion, capped at 8 neighbours per enemy per tick. Its own module because a step is one module: §142.5 fixes the ORDER and the id, and the file a step lives in is not part of the order.' },
  { index: 12, id: 'weapons',      module: 'game/weapons',     system: 'field',   note: 'Fire, iterating components in stable (row, col) order — §14 forbids a comparator that can return 0 for distinct entities.' },
  { index: 13, id: 'projectiles',  module: 'game/projectiles', system: 'field',   note: 'Movement.' },
  { index: 14, id: 'collision',    module: 'game/damage',      system: 'field',   note: 'Collision and damage. §37.2 — global i-frames, single highest overlapping contact value.' },
  { index: 15, id: 'envheat',      module: 'game/environment', system: 'heat',    note: '§120.5\'s orbs against the step-6 position, §127.2\'s escalating P3 vents.' },
  { index: 16, id: 'heat',         module: 'grid/heat',        system: 'heat',    note: '(a) accumulate generation (b) recompute regions over the dirty set (c) resolve overclock crossings — enter at >=, leave at <, no exit value (§110.2) (d) resolve meltdowns: wear at the transition (§130.2), Failsafe consuming its single suppression (§130.4), §131.5\'s blackout setting core output to 0 and flagging step 5, and §135.1C\'s Siphon volley.' },
  { index: 17, id: 'pickups',      module: 'game/pickups',     system: 'pickups', note: 'Magnetism and collection. XP seeks from anywhere on screen; salvage does not (§105.3).' },
  { index: 18, id: 'xp',           module: 'game/economy',     system: 'economy', note: 'XP applied, level-ups QUEUED, support rank recomputed as ceil(level/8) effective next tick (§122.6).' },
  { index: 19, id: 'deaths',       module: 'game/world',       system: 'field',   note: 'Deaths and pool returns.' },
  { index: 20, id: 'bossphase',    module: 'game/boss',        system: 'field',   note: 'Phase transitions — §120.5\'s Regulator +4 flags step 5.' },
  { index: 21, id: 'offers',       module: 'game/economy',     system: 'draft',   note: '§110.4 — at most one card, FIFO, "+1 pending" rather than a second card.' },
  { index: 22, id: 'announce',     module: 'ui/announce',      system: 'ui',      note: '§128.2 — tray delivery, support rank-up, overflow conversion. A reward not announced is a balance change.' },
  { index: 23, id: 'telemetry',    module: 'growth/telemetry', system: 'build',   note: 'Accumulation only. Web build only (§98.4).' },
  { index: 24, id: 'tickend',      module: 'core/loop',        system: 'core',    note: 'tick++. Level-ups resolve at end of tick, so a component added this frame cannot fire this frame.' },
])

export const provenance: ProvenanceRecord = {
  TICK_ORDER: {
    kind: 'authored', system: 'build', axes: ['provenance'], source: '§26, §142.5', derivedFrom: 'definition',
  },
}
