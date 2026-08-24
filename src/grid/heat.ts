/**
 * Region heat — **derived, never stored** (§15, §111.5), and the field the whole game
 * is about.
 *
 * `heat` accumulates per component (§112.4); the per-cell store is that component's
 * heat spread across the cells it occupies; and a REGION's heat is the sum over the
 * 3x3 block centred on a cell, clipped at the board's edge. There are as many regions
 * as there are cells and they overlap, which is not a detail — four separate mechanics
 * rest on it (§111.3's seam dashing, §122.5's Governor, §131.5's blackout, §133.1's
 * corner economics) and none of them needs a channel of its own, because §134.2 draws
 * the derived sum and the shape draws itself.
 *
 * §133.1 is the quirk that has to survive a future session: **the window is CLIPPED
 * rather than normalised.** A corner sums four cells and a centre sums nine, which is
 * why §44.2 measured corner cells chosen 31 times against 78 — corners are thermally
 * cheap and power-poor. A session normalising by window size "so thresholds mean the
 * same thing everywhere" would delete that, and §58.7's ladder check would still pass,
 * because it tests occupancy and never position.
 */
import {
  DISSIPATION_K, LATE_TARGETS_HIT, OVERCLOCK_RATE_MULTIPLIER, PASSIVE_GENERATION,
  REGION_RADIUS,
  WORK_BASE, WORK_PER_TARGET,
} from '../data/heat.ts'
import { EMITTERS, type Emitter } from '../data/emitters.ts'
import type { Cell } from '../data/cores.ts'
import { cellsOf, key, mask, thresholds, type Board, type Placement } from './board.ts'

/**
 * §142.5's step 16 — (a) accumulate generation, (b) recompute the regions over the
 * dirty set, (c) resolve overclock crossings, (d) resolve meltdowns. This module owns
 * `board.placements[].heat` and nothing else writes it.
 *
 * It does not declare that step yet, and the omission is deliberate rather than an
 * oversight. §142.6 makes a `STEP` declaration a claim to be WIRED — `tools/emit.ts`
 * reads it and generates the call — and at commit 10 the board is not in the world:
 * §81.3's prototype holds it beside a run rather than inside one, so this module is a
 * pure function library over a `Board` and there is no world attribute for it to own.
 * Declaring the step early would generate a loop that imports a `step` nobody wrote,
 * which is the generator lying about what is wired. `src/gen/loop.ts`'s PENDING list
 * is the honest record until the board joins the world, and it shrinks on its own.
 */

export type RegionState = 'safe' | 'overclocked' | 'meltdown'

/**
 * §51.2 — `1.0 passive + (0.3 + 0.12 x targets hit)` **per shot**, so heat tracks the
 * work the machine is doing rather than its layout. That is the single rewrite this
 * whole file exists downstream of: under §31.1's static model a board's equilibrium
 * was fixed the moment it was built, so the optimal play was to pack to just under
 * meltdown and sit there — **heat was a constant, not a risk**, and the beat the
 * title refers to would essentially never have fired.
 */
export const emitterGeneration = (rate: number, targets: number, overclocked = false): number => {
  const perShot = WORK_BASE + WORK_PER_TARGET * targets
  const shots = overclocked ? rate * OVERCLOCK_RATE_MULTIPLIER : rate
  return PASSIVE_GENERATION + shots * perShot
}

/**
 * §60.2's invariant, and the reason it is a clamp rather than a coefficient: a
 * component's generation floors at its PASSIVE term and never at zero.
 *
 * §60.1 is what that prevents. The Sink's -3 per covered cell was set against the
 * static model, where it cancelled exactly one emitter; under the current one it
 * exceeds the entire generation of any emitter in the game, so a **rank-1** Sink
 * zeroed every component it touched — no overclock, no meltdown, no wear, no dread —
 * and §5.2A's free tray GUARANTEES delivery of one to every player by about level
 * four. The game did not merely permit the off switch; it handed it out.
 */
export const cooledGeneration = (generation: number, cooling: number): number => {
  const cooled = generation - cooling
  return cooled < PASSIVE_GENERATION ? PASSIVE_GENERATION : cooled
}

/**
 * The per-cell store, read off the placements. §15 says each occupied cell carries an
 * accumulating scalar and §112.4 says the heat is the COMPONENT's, and `Placement.heat`
 * is both at once: an array indexed by the shape's own offset order, so it survives a
 * rotation and travels through §112.2's move verb unchanged.
 */
export const cellHeat = (board: Board): ReadonlyMap<string, number> => {
  const out = new Map<string, number>()
  for (const p of board.placements) {
    cellsOf(p).forEach((c, i) => {
      out.set(key(c), (out.get(key(c)) ?? 0) + (p.heat[i] ?? 0))
    })
  }
  return out
}

/** The 3x3 block centred on a cell, clipped to the board (§133.1's asymmetry). */
export const window = (board: Board, centre: Cell): readonly Cell[] => {
  const legal = mask(board)
  const out: Cell[] = []
  for (let dy = -REGION_RADIUS; dy <= REGION_RADIUS; dy++) {
    for (let dx = -REGION_RADIUS; dx <= REGION_RADIUS; dx++) {
      const c = { x: centre.x + dx, y: centre.y + dy }
      if (legal.has(key(c))) out.push(c)
    }
  }
  return out
}

export const regionHeat = (board: Board, centre: Cell, store = cellHeat(board)): number => {
  let sum = 0
  for (const c of window(board, centre)) sum += store.get(key(c)) ?? 0
  return sum
}

/** Every region on the board, keyed by its centre cell. A full recomputation. */
export const regionField = (board: Board): ReadonlyMap<string, number> => {
  const store = cellHeat(board)
  const out = new Map<string, number>()
  for (const at of mask(board)) {
    const [x = 0, y = 0] = at.split(',').map(Number)
    out.set(at, regionHeat(board, { x, y }, store))
  }
  return out
}

/**
 * The incremental form: only the regions whose window contains a changed cell can
 * move, which is at most nine per cell. §15 calls this "O(29 x 9), which is free" —
 * and A-019 checks it equals the full recomputation, always, because a board that
 * looks safe and melts is §2's *cheated* on the one surface §68 calls the product.
 */
export const regionFieldIncremental = (
  board: Board, previous: ReadonlyMap<string, number>, dirty: readonly Cell[],
): ReadonlyMap<string, number> => {
  const store = cellHeat(board)
  const out = new Map(previous)
  const seen = new Set<string>()
  for (const cell of dirty) {
    for (const centre of window(board, cell)) {
      const at = key(centre)
      if (seen.has(at)) continue
      seen.add(at)
      out.set(at, regionHeat(board, centre, store))
    }
  }
  return out
}

export const stateOf = (board: Board, heat: number): RegionState => {
  const t = thresholds(board)
  if (heat >= t.meltdown) return 'meltdown'
  if (heat >= t.overclock) return 'overclocked'
  return 'safe'
}

/**
 * §110.2 — enter at `H >= threshold`, leave at `H <`, **no separate exit value and no
 * debounce.** The physics already provides both: overclocking raises the region's own
 * generation x1.26 (§58.1), so both crossings are self-reinforcing and both states
 * are stable for generation in [5.29, 6.67]. That is thermal momentum, it is
 * emergent, and **it looks exactly like a bug a future session would fix** (A-024).
 */
export const equilibrium = (generation: number): number => generation * 1.5

export const overclockedGeneration = (generation: number, passive = PASSIVE_GENERATION): number => {
  const work = generation - passive
  return passive + OVERCLOCK_RATE_MULTIPLIER * work
}

/** §51.3, §58.1 — the mean of the seven measured emitters, computed rather than typed. */
export const meanEmitterGeneration = (): number => {
  const ids = Object.keys(LATE_TARGETS_HIT)
  let sum = 0
  for (const id of ids) {
    const emitter = EMITTERS[id as keyof typeof EMITTERS]
    sum += emitterGeneration(emitter.rate, LATE_TARGETS_HIT[id] ?? 0)
  }
  return ids.length === 0 ? 0 : sum / ids.length
}

/**
 * A whole REGION's overclocked generation, which is not the single-component form.
 *
 * §58.1's feedback multiplier is x1.26 on average, and the average is over one
 * emitter: the passive term is what does not scale, so a region's multiplier depends
 * on **how much of its generation is passive**, which is one unit per emitter. A
 * region generating G at the measured mean holds `G / 2.08` emitters, so its passive
 * share is that many units and the rest is work.
 *
 * This is the term §110.2 needed and §8 and §58.1 never multiplied together: safe is
 * self-consistent while `1.5G < threshold` and overclocked while `1.5 x 1.26G >=
 * threshold`, so **both are stable across a band** — thermal momentum.
 */
export const overclockedRegionGeneration = (generation: number): number => {
  const mean = meanEmitterGeneration()
  const passive = mean === 0 ? 0 : (generation / mean) * PASSIVE_GENERATION
  return overclockedGeneration(generation, passive)
}

/**
 * §116.4 — a region whose EQUILIBRIUM exceeds meltdown does not melt once. It melts,
 * reboots at ~0 in five seconds, climbs back in ~3.1 s and melts again: 39% uptime,
 * 20% of max integrity every 8.1 seconds, dead in forty-one. §36.1 checked the reboot
 * heat and stopped there. The only escape is to spread the region, which §112.2's
 * move verb made possible four passes before anyone noticed it was load-bearing.
 */
export const isRunaway = (board: Board, generation: number): boolean =>
  equilibrium(generation) >= thresholds(board).meltdown

export interface Distribution {
  /** The change actually applied to each cell, keyed by cell. */
  readonly perCell: ReadonlyMap<string, number>
  /** The change the NAMED region moved by, which must equal the requested delta. */
  readonly applied: number
}

/**
 * §111.2 — a region-level change of Δ, distributed across the block's occupied cells
 * **in proportion to their current heat**, clamped at zero.
 *
 * Two effects in the game write to region heat — the vent-dash and THE FOUNDRY's
 * vents — and neither said how a change to a DERIVED sum maps back onto the per-cell
 * store it is derived from. Read as "-5 from each of the nine cells" the vent-dash is
 * -45; read as "-5 across the block" it is -5. **A factor of nine on the game's only
 * real-time thermal verb.**
 *
 * And defining it correctly creates a mechanic rather than closing a hole: regions
 * overlap, so cooling one region partially cools its neighbours by the fraction of
 * the block they share — **dashing at the seam between two hot clusters cools both.**
 *
 * §111.2 states the neighbour's movement as `Δ x shared / 9`, and that is the
 * UNIFORM case rather than the rule: heat is proportional here because the clamp at
 * zero makes it have to be — a cell with no heat cannot give any up. Where the block
 * is uniformly hot the two readings agree exactly, and where it is not, proportional
 * is the one that conserves Δ. Stated because §111.2 gives both sentences without
 * saying which is the mechanism, which is the same shape of ambiguity it was written
 * to close.
 */
export const distribute = (board: Board, centre: Cell, delta: number): Distribution => {
  const store = cellHeat(board)
  const cells = window(board, centre)
  const perCell = new Map<string, number>()
  let total = 0
  for (const c of cells) total += store.get(key(c)) ?? 0

  if (delta >= 0) {
    // Adding: spread evenly, because there is no "in proportion to" for a cold block
    // and an even spread is what makes the vents §122.5 prices land on every build.
    const each = cells.length === 0 ? 0 : delta / cells.length
    for (const c of cells) perCell.set(key(c), each)
    return { perCell, applied: each * cells.length }
  }

  const wanted = -delta
  const taken = wanted > total ? total : wanted
  let applied = 0
  for (const c of cells) {
    const at = key(c)
    const here = store.get(at) ?? 0
    const share = total === 0 ? 0 : (here / total) * taken
    perCell.set(at, -share)
    applied -= share
  }
  return { perCell, applied }
}

/**
 * Applies a distribution back onto the components that own those cells (§112.4).
 *
 * Cell by cell rather than component by component, which is what keeps §111.2 exact
 * for a component straddling the window's edge: the change lands on the cell that was
 * inside the region, and the cell outside it is untouched.
 */
export const applyDistribution = (board: Board, d: Distribution): void => {
  for (const p of board.placements) {
    cellsOf(p).forEach((c, i) => {
      const next = (p.heat[i] ?? 0) + (d.perCell.get(key(c)) ?? 0)
      p.heat[i] = next < 0 ? 0 : next
    })
  }
}


/**
 * One tick of `dH/dt = generation - (2/3)H`, integrated per cell.
 *
 * `engagement` is the fraction of a late-run crowd each emitter is currently
 * hitting, which is the whole of §51.2's rewrite: **heat tracks work done rather than
 * layout.** Under §31.1's static model a board's equilibrium was fixed the moment it
 * was built, so the optimal play was to pack to just under meltdown and sit there —
 * heat was a constant, not a risk, and meltdown would essentially never have fired.
 * Tying it to targets hit is also why a fixed board heats up across a run with no
 * scaling rule anywhere (§51.1): **the crowd does it**, not a coefficient.
 *
 * §81.3's board prototype drives this from a slider rather than from enemies, and
 * that is deliberately a BETTER instrument for §9's gate than combat is: a slider
 * shows a placement's consequence across the whole run's thermal range in ten
 * seconds, which no live run can do.
 */
export const tickHeat = (board: Board, engagement: number, seconds: number): void => {
  const eng = engagement < 0 ? 0 : engagement > 1 ? 1 : engagement
  for (const p of board.placements) {
    const emitter = EMITTERS[p.id as keyof typeof EMITTERS] as Emitter | undefined
    const targets = (LATE_TARGETS_HIT[p.id] ?? 0) * eng
    // Only a component that does WORK generates. Conduits, cooling and amplifiers
    // carry their own terms elsewhere (§59.3, §60.2) and none of them is per shot.
    const generation = emitter === undefined
      ? 0
      : emitterGeneration(emitter.rate, targets, isOverclocked(board, p))
    const cells = p.heat.length
    const perCell = cells === 0 ? 0 : generation / cells
    for (let i = 0; i < cells; i++) {
      const here = p.heat[i] ?? 0
      const next = here + (perCell - DISSIPATION_K * here) * seconds
      p.heat[i] = next < 0 ? 0 : next
    }
  }
}

/**
 * §110.2 — a component is overclocked when its ANCHOR cell's region heat crosses the
 * line. Enter at `>=`, leave at `<`, no exit value and no debounce: the x1.26
 * feedback makes both crossings self-reinforcing, so the physics debounces itself and
 * a hysteresis constant would be a second mechanism doing the same job worse.
 */
export const isOverclocked = (board: Board, p: Placement, store = cellHeat(board)): boolean => {
  const anchor = cellsOf(p)[0]
  if (anchor === undefined) return false
  return regionHeat(board, anchor, store) >= thresholds(board).overclock
}
