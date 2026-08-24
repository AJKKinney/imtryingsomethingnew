/**
 * The prototype's view of the board, re-exported.
 *
 * §145.4's layering makes `grid/` a simulation system and `ui/` a layer above
 * `render/`, so a UI module reading the board reads it through one declared surface
 * rather than reaching into `grid/` from a dozen call sites. `tools/deps.ts` enforces
 * the rule; this is what makes the rule cheap to obey.
 */
export {
  cellsOf, createBoard, drawOf, key, mask, move, place, scrap, thresholds,
} from '../grid/board.ts'
export type { Board, Rotation, Placement } from '../grid/board.ts'
export type { Cell } from '../data/cores.ts'
export type { ComponentId } from '../data/emitters.ts'
