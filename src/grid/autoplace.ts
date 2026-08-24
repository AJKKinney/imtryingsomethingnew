/**
 * Auto-placement — §15's enumerate-and-score, and the reason §9 can promise that no
 * placement is ever forced on the player under pressure.
 *
 * Two things about it are load-bearing beyond convenience. **It is the hands-only
 * route** (§123.2): a player who never opens the board gives up about a tenth of a
 * searched board's value, which is enough for §2.4's authorship metric to have
 * something to measure and little enough that ignoring the board is a route rather
 * than a penalty. And **it is the accessibility position** (§114.3): auto-placement
 * plus §99.3's paused board time-scale is what let DRAFT MODE be cut — that mode
 * offered a player who cannot work a spatial layer in real time a LESSER game, and
 * these two offer them the same one.
 *
 * The scoring function is a parameter rather than a constant here, and deliberately:
 * §143.3 makes the evaluator ONE function shared by the placer, §103.3's offer ghost,
 * the four bot policies and §67.3's fault-trace solver, and it lands in phase 3a with
 * the terms it needs. What phase 1 owes is the enumeration and the tie-break.
 */
import type { Cell } from '../data/cores.ts'
import { legal, mask, shapeOf, type Board, type Rotation } from './board.ts'
import type { ComponentId } from '../data/emitters.ts'

export interface Candidate {
  readonly anchor: Cell
  readonly rotation: Rotation
}

export const ROTATIONS: readonly Rotation[] = Object.freeze([0, 1, 2, 3])

/**
 * Every legal (cell, rotation) pair, in a stable order: row, then column, then
 * rotation. §15 caps this at 29 x 4 = 116 candidates, which is what makes running it
 * for all three offer cards BEFORE the choice (§103.3's ghost) the same computation
 * moved one step earlier rather than a new cost.
 */
export const candidates = (board: Board, id: ComponentId): readonly Candidate[] => {
  const cells = [...mask(board)]
    .map((at) => {
      const [x = 0, y = 0] = at.split(',').map(Number)
      return { x, y }
    })
    // §14 forbids relying on Set iteration order in anything order-sensitive, and a
    // tie-break is exactly that. Sorted by row then column, explicitly.
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))

  const out: Candidate[] = []
  const shape = shapeOf(id)
  for (const anchor of cells) {
    for (const rotation of ROTATIONS) {
      // A one-cell component has one distinct rotation; enumerating four would make
      // the tie-break depend on a symmetry rather than on the board.
      if (rotation !== 0 && shape.length === 1) continue
      if (legal(board, id, anchor, rotation).ok) out.push({ anchor, rotation })
    }
  }
  return out
}

export type Score = (board: Board, id: ComponentId, at: Candidate) => number

/**
 * The maximum, ties broken on lowest (row, col, rotation).
 *
 * Determinism is not optional here: §14's replays, §124.5's PAR and §80.2's identical
 * daily all run through this function, so a tie broken by iteration order is a desync
 * waiting for a different engine — the failure mode §14 exists to make impossible,
 * arriving through the one system that looks like a convenience.
 */
export const autoPlace = (
  board: Board, id: ComponentId, score: Score,
): Candidate | undefined => {
  let best: Candidate | undefined
  let bestScore = -Infinity
  for (const at of candidates(board, id)) {
    const s = score(board, id, at)
    if (s > bestScore) {
      bestScore = s
      best = at
    }
  }
  return best
}
