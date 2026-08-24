/**
 * Auto-placement — §15's enumerate-and-score, and the two things it is load-bearing
 * for beyond convenience.
 *
 * **It is the hands-only route** (§123.2): a player who never opens the board gives up
 * about a tenth of a searched board's value, which is enough for §2.4's authorship
 * metric to have something to measure and little enough that ignoring the board is a
 * route rather than a penalty. And **it is the accessibility position** (§114.3):
 * auto-placement plus §99.3's paused board time-scale is what let DRAFT MODE be cut,
 * because that mode offered a player who cannot work a spatial layer in real time a
 * LESSER game and these two offer them the same one.
 */
import { describe, expect, it } from 'vitest'
import { autoPlace, candidates, ROTATIONS, type Score } from '../../src/grid/autoplace.ts'
import { createBoard, expand, key, legal, place, shapeOf } from '../../src/grid/board.ts'
import { CORES, type CoreId } from '../../src/data/cores.ts'
import { AMPLIFIERS, EMITTERS, SUPPORT, type ComponentId } from '../../src/data/emitters.ts'

const CORE_IDS = Object.keys(CORES) as CoreId[]
const ALL: ComponentId[] = [
  ...Object.keys(EMITTERS), ...Object.keys(AMPLIFIERS), ...Object.keys(SUPPORT),
] as ComponentId[]

/** A score that is constant, so every candidate ties and only the tie-break decides. */
const flat: Score = () => 1

describe('A-027 · §15 auto-placement enumerates legal pairs and breaks ties deterministically', () => {
  it('offers only legal (cell, rotation) pairs, on every core and both sizes', () => {
    for (const core of CORE_IDS) {
      for (const expanded of [false, true]) {
        const board = createBoard(core)
        if (expanded) expand(board)
        place(board, 'arc', CORES[core].cells[0] ?? { x: 0, y: 0 }, 0)
        for (const id of ALL) {
          for (const at of candidates(board, id)) {
            expect(legal(board, id, at.anchor, at.rotation), `${core} ${id}`).toEqual({ ok: true })
          }
        }
      }
    }
  })

  it('offers every legal pair, so the placer never quietly narrows the board', () => {
    // The other direction, and the one a hand-rolled enumeration gets wrong: a
    // candidate list that misses placements makes the auto-placer worse than the
    // player by an amount nothing measures, which is exactly what §123.2's 85-95%
    // band would then be measuring.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 2, y: 2 }, 0)
    for (const id of ALL) {
      const offered = new Set(candidates(board, id).map((c) => `${key(c.anchor)}r${c.rotation}`))
      let expected = 0
      for (const c of CORES.lattice.cells) {
        for (const r of ROTATIONS) {
          if (r !== 0 && shapeOf(id).length === 1) continue
          if (!legal(board, id, c, r).ok) continue
          expected++
          expect(offered.has(`${key(c)}r${r}`), `${id} ${key(c)}r${r}`).toBe(true)
        }
      }
      expect(offered.size, id).toBe(expected)
    }
  })

  it('gives a one-cell component exactly one rotation', () => {
    // Enumerating four would make the tie-break depend on a symmetry rather than on
    // the board — and since the tie-break is lowest rotation it would still pick 0,
    // so the defect would be invisible in the output and visible only in the cost.
    const board = createBoard('lattice')
    const single = candidates(board, 'arc')
    expect(new Set(single.map((c) => c.rotation))).toEqual(new Set([0]))
    expect(single.length).toBe(CORES.lattice.cells.length)
  })

  it('breaks a tie on lowest (row, col, rotation), every time', () => {
    // Determinism is not optional here. §14's replays, §124.5's PAR and §80.2's
    // identical daily all run through this function, so a tie broken by iteration
    // order is a desync waiting for a different engine — §14's own failure mode,
    // arriving through the one system that looks like a convenience.
    for (const core of CORE_IDS) {
      const board = createBoard(core)
      const first = candidates(board, 'lance')[0]
      expect(autoPlace(board, 'lance', flat), core).toEqual(first)
      // And the enumeration itself is sorted row-major, which is what makes "first"
      // mean "lowest (row, col, rotation)" rather than "whatever the mask yielded".
      const order = candidates(board, 'lance')
        .map((c) => [c.anchor.y, c.anchor.x, c.rotation] as const)
      for (let i = 1; i < order.length; i++) {
        const a = order[i - 1]
        const b = order[i]
        if (a === undefined || b === undefined) continue
        expect(a[0] < b[0] || (a[0] === b[0] && (a[1] < b[1] || (a[1] === b[1] && a[2] < b[2]))))
          .toBe(true)
      }
    }
  })

  it('is insensitive to the order the cell mask happens to yield (§14)', () => {
    // A Set's iteration order is an implementation detail and §14 forbids depending
    // on one in an order-sensitive path. Placing the same components in a different
    // ORDER changes the mask's internal layout and must change nothing here.
    const forwards = createBoard('lattice')
    const backwards = createBoard('lattice')
    const spots = [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 2, y: 1 }, { x: 1, y: 3 }]
    for (const c of spots) place(forwards, 'orbiter', c, 0)
    for (const c of [...spots].reverse()) place(backwards, 'orbiter', c, 0)
    expect(autoPlace(forwards, 'flak', flat)).toEqual(autoPlace(backwards, 'flak', flat))
  })

  it('takes the strict maximum, so an equal score never displaces the earlier candidate', () => {
    // `>` rather than `>=`: with `>=` the LAST tied candidate wins, which is still
    // deterministic and is not what §15 specifies — and the difference only shows up
    // on a board where the tie matters, which is every board a flat evaluator sees.
    const board = createBoard('lattice')
    const target = { x: 3, y: 1 }
    const score: Score = (_b, _id, at) => (key(at.anchor) === key(target) ? 2 : 1)
    expect(autoPlace(board, 'arc', score)?.anchor).toEqual(target)
    const twoWay: Score = (_b, _id, at) =>
      (key(at.anchor) === key(target) || key(at.anchor) === key({ x: 4, y: 4 }) ? 2 : 1)
    expect(autoPlace(board, 'arc', twoWay)?.anchor).toEqual(target)
  })

  it('returns nothing when the board cannot hold the component', () => {
    const board = createBoard('lattice')
    for (const c of CORES.lattice.cells) place(board, 'orbiter', c, 0)
    expect(candidates(board, 'arc')).toEqual([])
    expect(autoPlace(board, 'arc', flat)).toBeUndefined()
  })
})
