/**
 * The board's verbs — §112's inventory, and the one that was missing for a hundred
 * and eleven sections.
 *
 * §112.2 counted the board's operational verbs and found **place, rotate-while-placing,
 * scrap, undo and close, and no move.** In a game whose premise is spatial
 * arrangement, the only way to change a layout was to destroy part of it — at ~3.9
 * picks of 40, roughly a tenth of a run's entire progression, per average component.
 * Nobody pays that, so nobody does it, so the board was append-only after placement
 * and §44.4's strongest problem generator (re-pack at the 10:00 expansion) was
 * impossible.
 */
import { describe, expect, it } from 'vitest'
import {
  addHeat, cellsOf, createBoard, expand, key, legal, mask, move, place, rotate, scrap,
  shapeOf, totalHeat, SCRAP_SALVAGE,
} from '../../src/grid/board.ts'
import { regionHeat } from '../../src/grid/heat.ts'
import { CORES, type CoreId } from '../../src/data/cores.ts'
import { EMITTERS, SHAPE_ELL3, SHAPE_LINE2, SHAPE_SINGLE } from '../../src/data/emitters.ts'

const CORE_IDS = Object.keys(CORES) as CoreId[]

describe('the board', () => {
  it('rotates a shape and re-anchors it, so the cursor keeps the cell it pointed at', () => {
    // Without the re-anchor a rotated shape drifts off the cell the player selected,
    // which reads as the board refusing a placement it accepted a moment ago — §2's
    // *confused*, produced by arithmetic rather than by design.
    for (const shape of [SHAPE_SINGLE, SHAPE_LINE2, SHAPE_ELL3]) {
      for (const r of [0, 1, 2, 3] as const) {
        const turned = rotate(shape, r)
        expect(turned.length).toBe(shape.length)
        expect(Math.min(...turned.map(([x]) => x))).toBe(0)
        expect(Math.min(...turned.map(([, y]) => y))).toBe(0)
        // A rotation is a bijection: no two offsets may collapse onto one cell.
        expect(new Set(turned.map(([x, y]) => `${x},${y}`)).size).toBe(shape.length)
      }
    }
  })

  it('keeps the offset index stable under rotation, which is what carries per-cell heat', () => {
    // §112.4's heat array is indexed by the SHAPE's offset order, so index i must mean
    // the same corner of the component at every rotation. If a rotation reordered the
    // offsets, moving a component would silently permute its own heat across its own
    // cells — a change nothing downstream can detect and every replay inherits.
    // Turning by r and then by 4-r must return the shape unchanged, index for index.
    for (const shape of [SHAPE_LINE2, SHAPE_ELL3]) {
      for (const [there, back] of [[1, 3], [2, 2], [3, 1]] as const) {
        expect(rotate(rotate(shape, there), back)).toEqual(shape)
      }
    }
  })

  it('refuses a placement that leaves the mask or overlaps an occupant', () => {
    const board = createBoard('lattice')
    expect(place(board, 'arc', { x: 0, y: 0 }, 0)).toBe(true)
    expect(legal(board, 'orbiter', { x: 0, y: 0 }, 0)).toEqual({ ok: false, reason: 'occupied' })
    expect(legal(board, 'orbiter', { x: -1, y: 0 }, 0)).toEqual({ ok: false, reason: 'offBoard' })
    expect(legal(board, 'orbiter', { x: 1, y: 0 }, 0)).toEqual({ ok: true })
  })

  it('grows by exactly four cells, along each core’s own geometry (§108.3)', () => {
    // "The board expands by 4 cells" appears eight times in the plan and WHICH four
    // was never stated — while §58.7 makes the heat ladder depend on it. Ring is the
    // core that proves the shape matters: outward at the side midpoints takes its max
    // region 4 -> 5, where inward at the inside corners would take it to 6.
    for (const id of CORE_IDS) {
      const board = createBoard(id)
      const before = mask(board).size
      expand(board)
      const after = mask(board)
      expect(after.size - before).toBe(4)
      // Every added cell must be reachable: orthogonally adjacent to a cell already
      // on the board, or power can never reach it and it is decoration.
      for (const c of CORES[id].expansion) {
        const near = [[0, -1], [1, 0], [0, 1], [-1, 0]]
          .some(([dx = 0, dy = 0]) => mask(createBoard(id)).has(key({ x: c.x + dx, y: c.y + dy })))
        expect(near, `${id} expansion ${key(c)}`).toBe(true)
      }
    }
  })
})

describe('A-025 · §112.4 a moved component keeps its level and carries its heat', () => {
  const hot = () => {
    const board = createBoard('lattice')
    place(board, 'arc', { x: 0, y: 0 }, 0, 4)
    place(board, 'lance', { x: 2, y: 0 }, 0, 3)
    const [arc, lance] = board.placements
    if (arc === undefined || lance === undefined) throw new Error('unreachable')
    addHeat(arc, 6)
    addHeat(lance, 9)
    return board
  }

  it('carries the level through a move', () => {
    const board = hot()
    expect(move(board, 0, { x: 4, y: 4 }, 0)).toBe(true)
    expect(board.placements[0]?.level).toBe(4)
  })

  it('carries the heat through a move, cell for cell', () => {
    const board = hot()
    const before = [...(board.placements[1]?.heat ?? [])]
    expect(move(board, 1, { x: 0, y: 3 }, 1)).toBe(true)
    expect(board.placements[1]?.heat).toEqual(before)
  })

  it('conserves total board heat under every sequence of moves', () => {
    // Heat owned by the CELL would make shuffling free cooling — §60.1's off switch
    // arriving by a different route, in the one game whose premise is that
    // arrangement costs something. The price of rearranging is exposure at 20% time
    // and the heat you brought with you, and this is the second half.
    const board = hot()
    const start = totalHeat(board)
    expect(start).toBeCloseTo(15, 10)
    const moves: [number, number, number, 0 | 1 | 2 | 3][] = [
      [0, 4, 4, 0], [1, 0, 3, 1], [0, 2, 2, 0], [1, 3, 3, 0], [0, 0, 0, 0], [1, 1, 4, 3],
    ]
    for (const [index, x, y, rotation] of moves) {
      move(board, index, { x, y }, rotation)
      expect(totalHeat(board)).toBeCloseTo(start, 10)
    }
  })

  it('lets a scrap remove exactly the scrapped component’s heat and no more', () => {
    // The seeded statement read "no sequence of moves OR SCRAPS lowers total board
    // heat", which is false as written: scrapping removes a component, and its heat
    // goes with it. That is not laundering — it is paying ~10% of a run's
    // progression — so the checkable invariant is the precise one: a move conserves
    // exactly, and a scrap debits exactly the piece removed and never a neighbour's.
    const board = hot()
    const start = totalHeat(board)
    const lanceHeat = (board.placements[1]?.heat ?? []).reduce((a, b) => a + b, 0)
    expect(scrap(board, 1)).toEqual({ ok: true, salvage: SCRAP_SALVAGE })
    expect(totalHeat(board)).toBeCloseTo(start - lanceHeat, 10)
  })

  it('moves a multi-cell component’s heat with its cells rather than its anchor', () => {
    const board = createBoard('lattice')
    place(board, 'lance', { x: 0, y: 0 }, 0)
    const lance = board.placements[0]
    if (lance === undefined) throw new Error('unreachable')
    lance.heat = [5, 1]
    const before = regionHeat(board, { x: 0, y: 0 })
    expect(before).toBeCloseTo(6, 10)
    // Rotate in place: the same two cells become a column, and the hot END travels.
    expect(move(board, 0, { x: 0, y: 0 }, 1)).toBe(true)
    expect(cellsOf(lance).length).toBe(2)
    expect(board.placements[0]?.heat).toEqual([5, 1])
  })
})

describe('A-026 · §57.2 the last emitter cannot be scrapped', () => {
  it('refuses the scrap and leaves the board untouched', () => {
    // Not a softlock: a slow unwinnable death with no feedback explaining why, which
    // is worse — the player has no damage output and nothing tells them the game is
    // over. §7.2B makes cells owned; §57.2 is the one exception, and it is a guard
    // clause rather than a warning.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 0, y: 0 }, 0)
    place(board, 'gain', { x: 1, y: 0 }, 0)
    place(board, 'sink', { x: 2, y: 0 }, 0)
    expect(scrap(board, 0)).toEqual({ ok: false, reason: 'lastEmitter' })
    expect(board.placements.length).toBe(3)
  })

  it('allows it while a second emitter is placed, and refuses again once it is gone', () => {
    const board = createBoard('lattice')
    place(board, 'arc', { x: 0, y: 0 }, 0)
    place(board, 'orbiter', { x: 1, y: 0 }, 0)
    expect(scrap(board, 1).ok).toBe(true)
    expect(scrap(board, 0)).toEqual({ ok: false, reason: 'lastEmitter' })
  })

  it('never blocks a support or amplifier scrap, whatever the emitter count', () => {
    // The guard is about OUTPUT, not about the board emptying: a player who scraps
    // every conduit has made a bad board and is allowed to.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 0, y: 0 }, 0)
    place(board, 'wire', { x: 1, y: 0 }, 0)
    expect(scrap(board, 1).ok).toBe(true)
    expect(board.placements.length).toBe(1)
  })

  it('counts emitters by the roster, not by whether the component draws power', () => {
    // Every drafted emitter must be caught by the guard, including the four that
    // arrived twenty-three passes after §57.2 was written (§92.3, §113.3, §131.3).
    for (const id of Object.keys(EMITTERS)) {
      const board = createBoard('lattice')
      // Lattice's 5x5 fits every shipped emitter shape at the origin.
      expect(place(board, id as never, { x: 0, y: 0 }, 0), id).toBe(true)
      expect(scrap(board, 0), id).toEqual({ ok: false, reason: 'lastEmitter' })
      expect(shapeOf(id as never).length, id).toBeGreaterThan(0)
    }
  })
})
