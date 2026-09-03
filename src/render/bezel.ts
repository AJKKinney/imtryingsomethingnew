/**
 * The machine bezel — §3's answer to a real error.
 *
 * 640x360 is 16:9 and the Steam Deck is 16:10, so the game would have shipped dead
 * black bars on its PRIMARY VENUE. The play area stays a fair, fixed 640x360 for
 * everyone and taller aspects fill the extra space with this: HUD, heat gauge,
 * salvage state, derelict markers, §105.1's run clock, §109.3's boss bar, §76.4's
 * live board and §103.2's offer cards.
 *
 * §140.5 counted what those five passes did to a budget that still gave the bezel
 * ONE cached row of 7 draws: 162, putting the full profile at 2,602 against a 2,600
 * ceiling — and that charged one draw per string, where §39.2 measured `fillText` at
 * 10-50x a blit. So the rule is stated once and obeyed here: **a surface that
 * changes on an EVENT renders offscreen and blits; a surface that changes on a TICK
 * draws live.** The chrome is an event surface. The clock is a tick surface.
 */
import { drawText, type Atlas, LABEL_SCALE } from './atlas.ts'
import { PLAY_HEIGHT, PLAY_WIDTH } from './camera.ts'
import { BACKGROUND, HEAT_RAMP, PLAYER, SUBSTRATE } from '../gen/palette.ts'
import { nextEncounter } from '../data/encounters.ts'
import { PLAYER_INTEGRITY } from '../data/player.ts'
import { LABELS } from '../data/strings.ts'
import { minutes, type World } from '../core/world.ts'

/** §102.6 — every player-visible string resolves from the label table, never a literal. */
const hud = (id: string): string => LABELS.find((l) => l.id === id)?.text ?? id
import type { Surface, SurfaceFactory } from './surface.ts'

/** §83.2 measured it: the Deck's band is 80 px, which is why the board is 72x72. */
export const DECK_BEZEL_HEIGHT = 80
export const BOARD_TILE = 72

export interface Bezel {
  /** The event surface: chrome and fixed labels, rendered once and blitted. */
  readonly chrome: Surface
  readonly height: number
}

/** `mm:ss`, in every locale — §141.4 forbids locale number formatting anywhere. */
export const clockText = (seconds: number): string => {
  const whole = Math.floor(seconds)
  const m = Math.floor(whole / 60)
  const s = whole - m * 60
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}

export const buildBezel = (make: SurfaceFactory, atlas: Atlas, height: number): Bezel => {
  const chrome = make(PLAY_WIDTH, height)
  chrome.clear()
  chrome.setStroke(SUBSTRATE, 1)
  chrome.beginPath()
  chrome.moveTo(0, 0.5)
  chrome.lineTo(PLAY_WIDTH, 0.5)
  chrome.stroke()
  drawText(chrome, atlas, 'INTEGRITY', LABEL_SCALE, 8, 10)
  drawText(chrome, atlas, 'NEXT', LABEL_SCALE, 240, 10)
  drawText(chrome, atlas, 'KILLS', LABEL_SCALE, 400, 10)
  return { chrome, height }
}

/**
 * The live row. Returns its draw count, because §39.3 gates on draws measured rather
 * than inferred, and the bezel is where §140.5 found the budget already spent.
 */
export const drawBezel = (target: Surface, atlas: Atlas, bezel: Bezel, world: World): number => {
  const before = target.draws
  target.blit(bezel.chrome, 0, 0, PLAY_WIDTH, bezel.height, 0, PLAY_HEIGHT)
  const top = PLAY_HEIGHT + 24

  // §54.2 — INTEGRITY, not hit points. A machine has structural margin, and the
  // player reads this word hundreds of times a run.
  const integrity = Math.max(0, Math.round(world.player.integrity))
  drawText(target, atlas, `${integrity}`, LABEL_SCALE, 8, top)

  // A bar as well as a number: §1.2 requires the danger be FELT without reading a
  // number, and §69.4 keeps the numeric channel for the deliberate act of looking.
  const fraction = integrity / PLAYER_INTEGRITY
  const band = Math.min(HEAT_RAMP.length - 1, Math.floor((1 - fraction) * HEAT_RAMP.length))
  target.setStroke(HEAT_RAMP[band] ?? PLAYER, 4)
  target.beginPath()
  target.moveTo(8, top + 16)
  target.lineTo(8 + 180 * fraction, top + 16)
  target.stroke()

  // §9 — the run ends when integrity does, and until this pass nothing said so: the
  // simulation recorded `over` and the bezel went on printing a countdown to an
  // encounter the player would never reach. A state and the affordance that leaves
  // it, in the space the clock occupies, because that is the row already reserved
  // for what the run is doing.
  if (world.over) {
    drawText(target, atlas, hud('runOver'), LABEL_SCALE, 240, top)
    drawText(target, atlas, `${world.kills}`, LABEL_SCALE, 400, top)
    return target.draws - before
  }

  const t = minutes(world)
  const next = nextEncounter(t)
  // §136.2 — past 20:00 there is nothing to count toward, and §127.2's escalation
  // must stay invisible, so the clock shows elapsed time alone.
  const label = next === undefined
    ? clockText(world.tick / 60)
    : `${next.name} ${clockText(next.minute * 60 - world.tick / 60)}`
  drawText(target, atlas, label, LABEL_SCALE, 240, top)
  drawText(target, atlas, `${world.kills}`, LABEL_SCALE, 400, top)

  return target.draws - before
}

export { BACKGROUND }
