/**
 * §12's six neon hues on near-black, and §46.2's friend/foe axis as data.
 *
 * The warm/cool split is the load-bearing part: cyan-to-white against amber-to-red
 * lies on the blue-yellow axis, which protanopia and deuteranopia preserve. Where it
 * fails — tritanopia — §15's form channel carries the whole read by itself, which is
 * why `gen/shapes.ts` makes symmetry the faction rather than a decoration on it.
 *
 * §104.5 gives the player eight COOL choices for their core, so the machine is
 * recognisably theirs in the Hall, in a share link and in a stranger's field, and
 * the faction read is untouched because every option is on the same side of the axis.
 */

export const BACKGROUND = '#05070b'
/** §46.2 — the circuit substrate the field and the board are both drawn on. */
export const SUBSTRATE = '#101a26'

/** §104.5 — player-chosen, travels with the machine, all on the cool side. */
export const CORE_HUES: readonly string[] = Object.freeze([
  '#5ff2ff', '#4fe0c8', '#a8e8ff', '#8fa8bf', '#7ff2b0', '#5aa8ff', '#a98fff', '#eaf6ff',
])

export const PLAYER = CORE_HUES[0] ?? '#5ff2ff'

/** The corruption: warm, and hotter the more dangerous the entity (§10's roster). */
export const CORRUPTION: readonly string[] = Object.freeze([
  '#ffb347', // swarmer
  '#ff6b3d', // brute
  '#ffd166', // shooter
  '#ff8f5a', // splitter
  '#ff5fa2', // phaser
  '#ff4040', // charger
])

/** §12's ambient heat ramp — cyan to deep red, and the board's cell fill (§85.2). */
export const HEAT_RAMP: readonly string[] = Object.freeze([
  '#3fd0ff', '#7fe0b0', '#ffe066', '#ffa040', '#ff5a2a', '#e01010',
])

export const enemyHue = (kind: number): string => CORRUPTION[kind] ?? CORRUPTION[0] ?? '#ffb347'
