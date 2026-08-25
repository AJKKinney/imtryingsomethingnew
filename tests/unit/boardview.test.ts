/**
 * The board's grammar, measured against a counting stub rather than a browser.
 *
 * §85 is the pass that found the board — the game's face since §68, on the capsule,
 * permanently in the bezel, and the first thing a share link opens on — had no visual
 * specification at all. §134.2 then found the one channel that named the wrong
 * quantity, and the reason it survived is worth keeping in front of whoever edits
 * this file: **both readings are called "heat" and both are in §15.** The channel
 * table said *region heat*; the prose thirty lines later said *the cell's fill*. No
 * cross-reference could catch that, and §85.4's colourblind audit checked that the
 * channel survives total colour loss — never that it carries the right number.
 */
import { describe, expect, it } from 'vitest'
import { stubSurface } from '../surface.ts'
import {
  BEZEL_BOARD_DRAWS, boosted, dashesFor, drawBoard, frameOf, heatAlpha, heatFill,
  drawCore, heatTint, traceWidth, type BoardView,
} from '../../src/render/boardview.ts'
import { addHeat, cellsOf, createBoard, key, place, thresholds } from '../../src/grid/board.ts'
import { cellHeat, regionHeat } from '../../src/grid/heat.ts'
import { HEAT_RAMP, SUBSTRATE } from '../../src/gen/palette.ts'
import type { Cell } from '../../src/data/cores.ts'

const VIEW: BoardView = { x: 0, y: 0, cell: 40, detail: 'full' }
const BEZEL: BoardView = { x: 0, y: 0, cell: 72 / 5, detail: 'bezel' }

/** The stub records every fill as `x, y, w, h, colour`; this reads them back as cells. */
const fillsByCell = (
  fills: readonly (number | string)[], view: BoardView,
): Map<string, string> => {
  const out = new Map<string, string>()
  for (let i = 0; i + 4 < fills.length; i += 5) {
    const x = Number(fills[i])
    const y = Number(fills[i + 1])
    const w = Number(fills[i + 2])
    const colour = String(fills[i + 4])
    // A substrate dot scales with the cell and stays small; a heat fill nearly fills it.
    if (w < view.cell * 0.5) continue
    const cell: Cell = {
      x: Math.round((x - view.x) / view.cell),
      y: Math.round((y - view.y) / view.cell),
    }
    out.set(key(cell), colour)
  }
  return out
}

/** The ramp index a composited fill was built from — hue, independent of alpha. */
const rampIndex = (colour: string): number =>
  HEAT_RAMP.findIndex((hue) => colour.startsWith(huePrefix(hue)))

const huePrefix = (hex: string): string => {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return `rgba(${r}, ${g}, ${b},`
}

describe('A-050 · §134.2 the cell fill renders the DERIVED region heat', () => {
  it('tints a cold cell that a hot neighbour’s region reaches', () => {
    // The whole finding in one board: two adjacent components, all the stored heat on
    // one of them. Under §85.2's prose reading the second cell draws as cold; under
    // §85.1's table reading it draws at the SUM, which is the number every threshold
    // in the game is tested against.
    const board = createBoard('lattice')
    expect(place(board, 'arc', { x: 1, y: 2 }, 0)).toBe(true)
    expect(place(board, 'wire', { x: 2, y: 1 }, 0)).toBe(true)
    const arc = board.placements[0]
    const wire = board.placements[1]
    if (arc === undefined || wire === undefined) throw new Error('placement failed')
    addHeat(arc, 12)

    const stored = cellHeat(board)
    const at = cellsOf(wire)[0]
    if (at === undefined) throw new Error('no cell')
    expect(stored.get(key(at)) ?? 0).toBe(0)
    expect(regionHeat(board, at)).toBeCloseTo(12, 6)

    const surface = stubSurface(400, 400)
    drawBoard(surface, board, VIEW, frameOf(board))
    const fills = fillsByCell(surface.fills, VIEW)
    expect(fills.get(key(at))).toBe(heatFill(board, regionHeat(board, at)))
    expect(rampIndex(fills.get(key(at)) ?? '')).toBeGreaterThan(0)
  })

  it('fills exactly at the overclock tint for exactly the overclocked cells', () => {
    // §2's watchlist names "cheated" as the one review-converting emotion, and a board
    // that looks safe and melts is that, on the surface §68 calls the product. So the
    // picture and the predicate must be one object: the SET drawn at or above the
    // overclock tint is the SET the simulation reports overclocked, with no third
    // category on either side.
    const board = createBoard('lattice')
    for (const c of [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 3, y: 3 }]) {
      expect(place(board, 'arc', c, 0)).toBe(true)
    }
    for (const p of board.placements) addHeat(p, p.anchor.x === 3 ? 1 : 5)

    const t = thresholds(board)
    const overclockTint = HEAT_RAMP.indexOf(heatTint(board, t.overclock))
    expect(overclockTint).toBeGreaterThan(0)

    const surface = stubSurface(400, 400)
    drawBoard(surface, board, VIEW, frameOf(board))
    const fills = fillsByCell(surface.fills, VIEW)

    const drawnHot = [...fills].filter(([, colour]) => rampIndex(colour) >= overclockTint)
      .map(([at]) => at).sort()
    const simulationHot = board.placements.flatMap(cellsOf)
      .filter((c) => regionHeat(board, c) >= t.overclock)
      .map(key).sort()

    expect(drawnHot).toEqual([...new Set(simulationHot)].sort())
    expect(drawnHot.length).toBeGreaterThan(0)
    // And it is a contour rather than a highlight of the components themselves: the
    // cold Arc at (3,3) is not in it, and no empty cell is filled at all.
    expect(drawnHot).not.toContain(key({ x: 3, y: 3 }))
  })

  it('carries brightness monotone in heat, so the greyscale reading survives', () => {
    // §85.1 claims "hue AND brightness — brightness alone survives" and the ramp does
    // not deliver the second: its luminance RISES to the amber and FALLS to the red,
    // so under total colour loss a cold cell and a melting one are one mid-grey and
    // the cold one is the louder. The asymmetry is what is asserted, not the values —
    // §35.3, and §133.6 for the same reason a quirk is guarded by its shape.
    const board = createBoard('lattice')
    const t = thresholds(board)
    const steps = [0, t.overclock / 2, t.overclock, t.meltdown - 1, t.meltdown]
    const alphas = steps.map((heat) => heatAlpha(board, heat))
    for (let i = 1; i < alphas.length; i++) {
      expect(alphas[i] ?? 0, `heat ${steps[i]}`).toBeGreaterThan(alphas[i - 1] ?? 0)
    }
    expect(alphas[0]).toBeGreaterThan(0)
    expect(alphas[alphas.length - 1]).toBeCloseTo(1, 6)
    // Past meltdown it saturates rather than overshooting: a runaway region is already
    // as loud as the channel goes, and §116.4 gives it a state of its own to say so.
    expect(heatAlpha(board, t.meltdown * 4)).toBeCloseTo(1, 6)
  })

  it('draws an empty cell as substrate and never as a heat tint', () => {
    const board = createBoard('lattice')
    expect(place(board, 'arc', { x: 1, y: 1 }, 0)).toBe(true)
    const surface = stubSurface(400, 400)
    drawBoard(surface, board, VIEW, frameOf(board))
    const dots = []
    for (let i = 0; i + 4 < surface.fills.length; i += 5) {
      if (Number(surface.fills[i + 2]) <= 4) dots.push(String(surface.fills[i + 4]))
    }
    expect(dots.length).toBeGreaterThan(20)
    expect(new Set(dots)).toEqual(new Set([SUBSTRATE]))
  })
})

describe('A-050 · §85.2 the seven channels, none of them hue', () => {
  it('encodes power as the trace’s WIDTH, monotone in delivered ÷ draw', () => {
    // The decision that carries the whole grammar: a thickness is legible at the
    // bezel's 14.4 px cell, in every colourblind profile, and through the compression
    // §3's spectator venue puts on a stream — where a colour ramp is legible in none.
    const widths = [0, 0.33, 0.67, 1].map((rate) => traceWidth(VIEW, rate))
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i] ?? 0).toBeGreaterThan(widths[i - 1] ?? 0)
    }
    expect(traceWidth(VIEW, -1)).toBe(traceWidth(VIEW, 0))
    expect(traceWidth(VIEW, 9)).toBe(traceWidth(VIEW, 1))
  })

  it('encodes wear as trace TEXTURE, in proportion to the penalty and capped', () => {
    // §54.3 made wear the mechanic that decides whether a run ends at minute sixteen
    // and then specified no display for it, so the quantity that ends the run was
    // invisible until it had already ended it. A line STYLE survives colour loss.
    expect(dashesFor(0)).toBe(0)
    expect(dashesFor(0.075)).toBeGreaterThan(0)
    expect(dashesFor(0.25)).toBe(4)
    expect(dashesFor(0.9)).toBe(dashesFor(0.25))
  })

  it('links an amplifier to the emitters it boosts, N/E/S/W and nothing else', () => {
    const board = createBoard('lattice')
    expect(place(board, 'gain', { x: 2, y: 2 }, 0)).toBe(true)
    expect(place(board, 'arc', { x: 2, y: 1 }, 0)).toBe(true)
    expect(place(board, 'arc', { x: 1, y: 1 }, 0)).toBe(true)
    const gain = board.placements[0]
    if (gain === undefined) throw new Error('no amplifier')
    const links = boosted(board, gain)
    expect(links.map((p) => key(p.anchor))).toEqual([key({ x: 2, y: 1 })])
  })

  it('holds the bezel level of detail inside §86.2’s measured allowance', () => {
    // §140.5 recounted the bezel and found it at 162 draws against a row budgeted at
    // seven, putting the full profile at 2,602 against a 2,600 ceiling. The status
    // light is three channels; the instrument is seven, and it is not drawn at 14 px.
    const board = createBoard('lattice')
    for (const c of [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 1, y: 2 }]) {
      place(board, 'arc', c, 0)
    }
    const bezel = stubSurface(120, 120)
    const bezelDraws = drawBoard(bezel, board, BEZEL, frameOf(board))
    const full = stubSurface(400, 400)
    const fullDraws = drawBoard(full, board, VIEW, frameOf(board))
    expect(bezelDraws).toBeLessThanOrEqual(BEZEL_BOARD_DRAWS)
    expect(fullDraws).toBeGreaterThan(bezelDraws)
  })
})

describe('A-053 · §85.2 the core, which is the only thing on an empty board', () => {
  // Every one of §85.1's seven channels describes a PLACEMENT, so `drawBoard` took the
  // core's position as a trace origin and never rendered the origin. That is invisible
  // for exactly as long as there is a trace to infer it from — and `createBoard`
  // returns no placements, so run one, every share link and every WORKSHOP session
  // opened on a grid of substrate dots with nothing in the middle of it.
  const CENTRE = { x: 100, y: 100 }  // at(VIEW, lattice's (2,2))

  const outline = (segments: readonly number[], points: number): { x: number; y: number }[] =>
    Array.from({ length: points }, (_, i) => ({
      x: segments[i * 2] ?? Number.NaN, y: segments[i * 2 + 1] ?? Number.NaN,
    }))

  it('draws something at the core on a board with no placements at all', () => {
    const board = createBoard('lattice')
    expect(board.placements).toHaveLength(0)

    const surface = stubSurface(400, 400)
    const draws = drawBoard(surface, board, VIEW, frameOf(board))

    // 25 substrate dots and one stroked path, and the path is the core.
    expect(surface.paths).toBe(1)
    expect(draws).toBe(surface.fills.length / 5 + 1)
    const xs = surface.segments.filter((_, i) => i % 2 === 0)
    const ys = surface.segments.filter((_, i) => i % 2 === 1)
    expect(Math.min(...xs)).toBeLessThan(CENTRE.x)
    expect(Math.max(...xs)).toBeGreaterThan(CENTRE.x)
    // Symmetric about the core, which is §85.2's constraint on everything the machine
    // draws and §46.2's friend/foe language rather than a decoration on it.
    expect(Math.min(...xs) + Math.max(...xs)).toBeCloseTo(CENTRE.x * 2, 6)
    expect(Math.min(...ys) + Math.max(...ys)).toBeCloseTo(CENTRE.y * 2, 6)
  })

  it('costs one draw at both levels of detail, which is its share of §39.1’s 50', () => {
    const board = createBoard('lattice')
    expect(drawCore(stubSurface(400, 400), board, VIEW)).toBe(1)
    expect(drawCore(stubSurface(120, 120), board, BEZEL)).toBe(1)
  })

  it('draws a closed outline while powered and an open one during a BLACKOUT', () => {
    // §131.5 — zero core output is reachable by exactly one path and takes the whole
    // board dark, which is the moment the player most needs to know where to send
    // §2.2A's reboot order. The channel is FORM, not brightness: an open outline is
    // the corruption's half of §46.2's axis, so it survives total colour loss.
    const lit = createBoard('lattice')
    const litSurface = stubSurface(400, 400)
    drawCore(litSurface, lit, VIEW)
    const closed = outline(litSurface.segments, 5)
    expect(closed[0]).toEqual(closed[4])

    const dark = createBoard('lattice')
    dark.coreOutput = 0
    const darkSurface = stubSurface(400, 400)
    drawCore(darkSurface, dark, VIEW)

    // Four brackets rather than one perimeter: more points, and the outer run never
    // closes back on where it started.
    expect(darkSurface.paths).toBe(1)
    expect(darkSurface.segments.length).toBeGreaterThan(litSurface.segments.length)
    const broken = outline(darkSurface.segments, 12)
    expect(broken[0]).not.toEqual(broken[11])
    // Still symmetric, and still reaching the same four corners.
    const corners = broken.filter((p) =>
      Math.abs(Math.abs(p.x - CENTRE.x) - Math.abs(p.y - CENTRE.y)) < 1e-9)
    expect(corners).toHaveLength(4)
  })
})
