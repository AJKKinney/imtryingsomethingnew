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
  BEZEL_BOARD_DRAWS, boosted, dashesFor, drawBoard, frameOf, heatTint, traceWidth,
  type BoardView,
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
    // The substrate dot is 2 px square whatever the cell is; a heat fill is inset.
    if (w <= 4) continue
    const cell: Cell = {
      x: Math.round((x - view.x) / view.cell),
      y: Math.round((y - view.y) / view.cell),
    }
    out.set(key(cell), colour)
  }
  return out
}

const rampIndex = (colour: string): number => HEAT_RAMP.indexOf(colour)

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
    expect(fills.get(key(at))).toBe(heatTint(board, regionHeat(board, at)))
    expect(fills.get(key(at))).not.toBe(HEAT_RAMP[0])
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
    const overclockTint = rampIndex(heatTint(board, t.overclock))
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
