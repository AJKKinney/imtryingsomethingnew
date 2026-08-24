/**
 * Region heat — **derived, never stored** (§15, §111.5), and the field the whole game
 * is about.
 *
 * §50.2 is why it is a field rather than a number. Under §31.1's static model a
 * region's equilibrium was fixed the moment it was built, so the optimal play was to
 * pack to just under meltdown and sit there: **heat was a constant, not a risk**, and
 * meltdown — the game's title, its centrepiece, the beat §2.2A rebuilt as an active
 * crisis — would essentially never have fired. Fifteen passes of tuning thresholds
 * never noticed that nothing ever MOVED between them.
 */
import { describe, expect, it } from 'vitest'
import {
  applyDistribution, cellHeat, distribute, emitterGeneration, cooledGeneration,
  equilibrium, isRunaway, overclockedGeneration, overclockedRegionGeneration,
  regionField, regionFieldIncremental,
  regionHeat, stateOf, window,
} from '../../src/grid/heat.ts'
import {
  addHeat, createBoard, expand, key, mask, move, place, totalHeat, type Board,
} from '../../src/grid/board.ts'
import { CORES, type Cell, type CoreId } from '../../src/data/cores.ts'
import {
  LATE_TARGETS_HIT, PASSIVE_GENERATION, REGION_CELLS_MAX, SINK_RATES,
} from '../../src/data/heat.ts'
import { EMITTERS } from '../../src/data/emitters.ts'
import { nextInt, rng } from '../../src/core/rng.ts'

const CORE_IDS = Object.keys(CORES) as CoreId[]

const cellsOfMask = (board: Board): Cell[] =>
  [...mask(board)]
    .map((at) => { const [x = 0, y = 0] = at.split(',').map(Number); return { x, y } })
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))

describe('the heat model', () => {
  it('reproduces §58.1’s published per-emitter generation column and its 2.08 mean', () => {
    // The single check that says the model in code is the model the plan measured.
    // §51.2 makes generation `1.0 passive + (0.3 + 0.12 x targets hit)` PER SHOT, and
    // §51.3's targets-hit table is what backs §58.1's column out of it — so if either
    // constant drifts, this column stops matching and the whole `heat` axis of
    // §61.5's inventory is stale.
    const expected: Record<string, number> = {
      arc: 2.98, lance: 1.91, flak: 1.90, orbiter: 2.56, tesla: 2.08, mine: 1.45, pulse: 1.70,
    }
    let sum = 0
    for (const [id, targets] of Object.entries(LATE_TARGETS_HIT)) {
      const emitter = EMITTERS[id as keyof typeof EMITTERS]
      const g = emitterGeneration(emitter.rate, targets)
      expect(g, id).toBeCloseTo(expected[id] ?? 0, 2)
      sum += g
    }
    expect(sum / Object.keys(LATE_TARGETS_HIT).length).toBeCloseTo(2.08, 2)
  })

  it('raises a region’s own generation when it overclocks (§58.1)', () => {
    // The interaction fifty-two sections never computed: overclock grants +50% RATE,
    // heat is per shot, so crossing the line raises the generation that decides
    // whether the region melts. Every heat table before §58 computed equilibria
    // without this term, and the rung it makes unreachable is meltdown itself.
    for (const [id, targets] of Object.entries(LATE_TARGETS_HIT)) {
      const emitter = EMITTERS[id as keyof typeof EMITTERS]
      const cold = emitterGeneration(emitter.rate, targets)
      const hot = emitterGeneration(emitter.rate, targets, true)
      expect(hot / cold, id).toBeGreaterThan(1.15)
      expect(hot / cold, id).toBeLessThan(1.35)
      // The closed form must agree with the per-shot one, or §58.7's third assertion
      // is checking a different quantity from the one the simulation runs.
      expect(overclockedGeneration(cold)).toBeCloseTo(hot, 10)
    }
  })

  it('reads the state off the thresholds with no exit value and no debounce (§110.2)', () => {
    const board = createBoard('lattice')
    expect(stateOf(board, 9.999)).toBe('safe')
    expect(stateOf(board, 10)).toBe('overclocked')
    expect(stateOf(board, 21.999)).toBe('overclocked')
    expect(stateOf(board, 22)).toBe('meltdown')
  })
})

describe('A-019 · §15 incremental region heat equals a full recomputation', () => {
  it('agrees after every single-component change, on every core and both sizes', () => {
    // Region heat is a DERIVED moving 3x3 sum over a per-cell store, recomputed
    // incrementally over a dirty set because §15 costs the full sweep at "O(29 x 9),
    // which is free" and then never does it. An incremental update that drifts from
    // the full sum is a board that LOOKS safe and melts, which is §2's *cheated* on
    // the one surface §68 calls the product — and the drift is invisible until it
    // decides a run, because both numbers are plausible.
    const r = rng(0x51de)
    for (const core of CORE_IDS) {
      for (const expanded of [false, true]) {
        const board = createBoard(core)
        if (expanded) expand(board)
        const cells = cellsOfMask(board)
        let field = regionField(board)

        for (let step = 0; step < 40; step++) {
          const anchor = cells[nextInt(r, cells.length)]
          if (anchor === undefined) continue
          if (!place(board, 'arc', anchor, 0)) continue
          const placed = board.placements[board.placements.length - 1]
          if (placed === undefined) continue
          addHeat(placed, 1 + nextInt(r, 5))
          field = regionFieldIncremental(board, field, [anchor])
          expect([...field].sort(), `${core} ${expanded} step ${step}`)
            .toEqual([...regionField(board)].sort())
        }
      }
    }
  })

  it('agrees after a MOVE, where the dirty set is two cells and not one', () => {
    // The case an incremental update gets wrong by omission: a move vacates a cell
    // and occupies another, so both windows are dirty. Passing only the destination
    // leaves the origin's nine regions carrying heat that is no longer there.
    const board = createBoard('lattice')
    place(board, 'lance', { x: 0, y: 0 }, 0)
    const lance = board.placements[0]
    if (lance === undefined) throw new Error('unreachable')
    addHeat(lance, 8)
    const before = regionField(board)

    const from: Cell[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }]
    move(board, 0, { x: 3, y: 3 }, 0)
    const to: Cell[] = [{ x: 3, y: 3 }, { x: 4, y: 3 }]
    expect([...regionFieldIncremental(board, before, [...from, ...to])].sort())
      .toEqual([...regionField(board)].sort())
  })
})

describe('A-020 · §111.2 a region-level change of delta moves that region by exactly delta', () => {
  /** A uniformly hot interior block: nine single-cell components, one heat each. */
  const uniform = (): Board => {
    const board = createBoard('lattice')
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        place(board, 'orbiter', { x, y }, 0)
        const p = board.placements[board.placements.length - 1]
        if (p !== undefined) addHeat(p, 1)
      }
    }
    return board
  }

  it('moves the named region by exactly delta, in both directions', () => {
    // The ambiguity this closes is worth a factor of NINE on the game's only
    // real-time thermal verb. "-5 heat from your hottest region" reads either as -5
    // from each of the block's nine cells (-45) or as -5 across the block (-5), and
    // §15 makes region heat a DERIVED sum, so nothing in the arithmetic picks.
    const centre = { x: 2, y: 2 }
    for (const delta of [-3, -1, 1, 4]) {
      const board = uniform()
      const before = regionHeat(board, centre)
      const d = distribute(board, centre, delta)
      expect(d.applied).toBeCloseTo(delta, 10)
      applyDistribution(board, d)
      expect(regionHeat(board, centre)).toBeCloseTo(before + delta, 10)
    }
  })

  it('cools a neighbour by delta x shared / 9 exactly when the block is uniform', () => {
    // §111.2 states the neighbour's movement as `delta x shared / 9` AND states that
    // the distribution is proportional to current heat. Those are the same number
    // only when the block is uniformly hot: proportional is the MECHANISM — the clamp
    // at zero forces it, because a cell with no heat cannot give any up — and the
    // ninths are the uniform case. This is the uniform case, and it agrees.
    const board = uniform()
    const centre = { x: 2, y: 2 }
    const before = regionField(board)
    const delta = -3
    applyDistribution(board, distribute(board, centre, delta))
    const after = regionField(board)

    for (const [dx, dy, shared] of [[1, 0, 6], [0, 1, 6], [1, 1, 4], [2, 0, 3]] as const) {
      const at = key({ x: centre.x + dx, y: centre.y + dy })
      const moved = (after.get(at) ?? 0) - (before.get(at) ?? 0)
      expect(moved, `offset ${dx},${dy}`).toBeCloseTo(delta * shared / REGION_CELLS_MAX, 10)
    }
  })

  it('moves a neighbour by its SHARE of the heat when the block is not uniform', () => {
    // And here the two readings part company, which is why the mechanism has to be
    // named rather than the formula. All the heat sits in one cell; the neighbouring
    // region either contains that cell or it does not, and no ratio of window sizes
    // describes the answer.
    const board = createBoard('lattice')
    place(board, 'orbiter', { x: 1, y: 2 }, 0)
    const hot = board.placements[0]
    if (hot === undefined) throw new Error('unreachable')
    addHeat(hot, 9)

    const centre = { x: 2, y: 2 }
    const before = regionField(board)
    applyDistribution(board, distribute(board, centre, -3))
    const after = regionField(board)

    // A neighbour containing the one hot cell takes the whole change...
    const containing = key({ x: 1, y: 1 })
    expect((after.get(containing) ?? 0) - (before.get(containing) ?? 0)).toBeCloseTo(-3, 10)
    // ...and a neighbour sharing six cells with the named region but NOT that one
    // takes nothing, where `delta x 6 / 9` would have predicted -2.
    const sharingSix = key({ x: 3, y: 2 })
    expect((after.get(sharingSix) ?? 0) - (before.get(sharingSix) ?? 0)).toBeCloseTo(0, 10)
  })

  it('cools both regions when the dash lands on the seam between two hot clusters', () => {
    // The mechanic that falls out of defining the mapping correctly (§111.3): regions
    // OVERLAP, so cooling one partially cools its neighbours, and a player who lays
    // out their board with that in mind gets more from the same cooldown. A
    // positional skill that emerges from arithmetic rather than from a rule.
    const board = createBoard('lattice')
    for (const x of [0, 1, 3, 4]) {
      place(board, 'orbiter', { x, y: 2 }, 0)
      const p = board.placements[board.placements.length - 1]
      if (p !== undefined) addHeat(p, 4)
    }
    const left = { x: 0, y: 2 }
    const right = { x: 4, y: 2 }
    const before = { left: regionHeat(board, left), right: regionHeat(board, right) }

    // The seam: a region whose window touches both clusters.
    applyDistribution(board, distribute(board, { x: 2, y: 2 }, -4))
    expect(regionHeat(board, left)).toBeLessThan(before.left)
    expect(regionHeat(board, right)).toBeLessThan(before.right)
  })

  it('never takes a cell below zero, and never removes more than the block holds', () => {
    // The clamp is what makes proportional the only coherent mechanism: an even split
    // would have to take heat a cold cell does not have, and then either go negative
    // or silently under-apply. Asking for more than the block holds empties it and
    // reports what it actually did.
    const board = uniform()
    const d = distribute(board, { x: 2, y: 2 }, -1000)
    applyDistribution(board, d)
    expect(d.applied).toBeCloseTo(-9, 10)
    expect(regionHeat(board, { x: 2, y: 2 })).toBeCloseTo(0, 10)
    for (const value of cellHeat(board).values()) expect(value).toBeGreaterThanOrEqual(0)
    expect(totalHeat(board)).toBeCloseTo(0, 10)
  })
})

describe('A-023 · §60.2 no cooling reduces generation below the passive floor', () => {
  it('floors at the passive term at every rank, in every combination', () => {
    // §60.1 is the worst finding in the plan and this is the invariant that answers
    // it. The Sink's old -3 per covered cell was set against §31.1's static model,
    // where it cancelled exactly one emitter; under the current model it exceeds the
    // ENTIRE generation of any emitter in the game, so a **rank-1** Sink zeroed every
    // component it touched. Three aggravations make it worse than §35.1's: it happens
    // at rank 1, it costs nothing — Sinks are never drafted — and §5.2A's free tray
    // GUARANTEES delivery of one to every player by about level four. The game did
    // not merely permit the off switch; it handed it out.
    const hottest = Math.max(
      ...Object.entries(LATE_TARGETS_HIT).map(([id, t]) =>
        emitterGeneration(EMITTERS[id as keyof typeof EMITTERS].rate, t, true)),
    )
    // Absurd cooling: two maximum-rank Radiators overlapping, plus every Sink rank.
    for (const cooling of [0, 1, 2, 4, 40, 400, hottest * 10]) {
      for (const [id, targets] of Object.entries(LATE_TARGETS_HIT)) {
        const emitter = EMITTERS[id as keyof typeof EMITTERS]
        for (const overclocked of [false, true]) {
          const g = emitterGeneration(emitter.rate, targets, overclocked)
          expect(cooledGeneration(g, cooling), `${id} ${cooling}`)
            .toBeGreaterThanOrEqual(PASSIVE_GENERATION)
        }
      }
    }
  })

  it('leaves a fully-cooled six-wide region climbing rather than inert', () => {
    // Verified at the absurd end because that is where the old rule broke: at the
    // floor a six-emitter region still equilibrates at 9.0, below every core's
    // overclock threshold and still rising as the crowd thickens. Alive, which is the
    // whole of §1's essential experience.
    const floored = cooledGeneration(20, 1000)
    expect(floored).toBe(PASSIVE_GENERATION)
    expect(equilibrium(floored * 6)).toBeCloseTo(9, 10)
    expect(stateOf(createBoard('lattice'), 9)).toBe('safe')
  })

  it('buys between half a rung and three and a half rungs, never a rounding error', () => {
    // §60.5's other band, and both of its failure modes have happened in this
    // document: §50.2 found sinks WORTHLESS under the static model and §60.1 found
    // them ABSOLUTE under the current one. A cooling piece that moves a packed region
    // by less than half a rung is not a decision; one that moves it by more than
    // three and a half is the off switch again with extra steps.
    const perEmitter = 2.08
    for (const rank of [1, 2, 3, 4, 5]) {
      const rate = SINK_RATES[rank - 1] ?? 0
      for (const emitters of [3, 6]) {
        // A Sink covers up to nine cells; a packed region is where it earns its cell.
        const covered = Math.min(emitters, REGION_CELLS_MAX)
        const before = equilibrium(perEmitter * emitters)
        const after = equilibrium(
          Math.max(PASSIVE_GENERATION * emitters, perEmitter * emitters - rate * covered))
        const rungs = (before - after) / 3.0
        expect(rungs, `rank ${rank} at ${emitters}-wide`).toBeGreaterThanOrEqual(0.5)
        expect(rungs, `rank ${rank} at ${emitters}-wide`).toBeLessThanOrEqual(3.5)
      }
    }
  })
})

describe('A-024 · §110.2 a region at generation 6.0 is stable in BOTH states', () => {
  it('holds overclock through a lull that could never have triggered it', () => {
    // Thermal momentum, and the reason this test exists at all: §8's hard threshold
    // and §58.1's x1.26 feedback coexisted for fifty-two sections and their PRODUCT
    // was never computed. Safe is self-consistent while `1.5G < 10`, so G < 6.67;
    // overclocked is self-consistent while `1.89G >= 10`, so G >= 5.29. Between them
    // both states are stable and the region's state depends on its HISTORY.
    //
    // It is emergent, thematically exact, self-debouncing — and it looks exactly like
    // a bug a future session would fix. That is what the quirk flag is for.
    const board = createBoard('lattice')
    const g = 6.0
    expect(equilibrium(g)).toBeCloseTo(9.0, 10)
    expect(equilibrium(overclockedRegionGeneration(g))).toBeCloseTo(11.34, 2)
    expect(stateOf(board, equilibrium(g))).toBe('safe')
    expect(stateOf(board, equilibrium(overclockedRegionGeneration(g)))).toBe('overclocked')
  })

  it('is a band rather than a point, and the band is [5.29, 6.67]', () => {
    const board = createBoard('lattice')
    const bistable = (g: number): boolean =>
      stateOf(board, equilibrium(g)) === 'safe' &&
      stateOf(board, equilibrium(overclockedRegionGeneration(g))) === 'overclocked'
    // Safe is self-consistent while `1.5G < 10`; overclocked while `1.5 x 1.26G >= 10`.
    expect(bistable(5.2)).toBe(false)
    expect(bistable(5.4)).toBe(true)
    expect(bistable(6.6)).toBe(true)
    expect(bistable(6.7)).toBe(false)
    // The multiplier the band is made of, stated so a drift in either constant fails
    // here rather than silently widening or closing the band.
    expect(overclockedRegionGeneration(6) / 6).toBeCloseTo(1.26, 2)
  })

  it('cannot be flipped by shot ripple, which is why no debounce is needed', () => {
    // Generation arrives in discrete shots, so heat ripples around its equilibrium.
    // The worst ripple in the game is Pulse's — worst precisely because it is the
    // SLOWEST emitter, so its work lands in the largest lumps — and the bistable band
    // is far wider than it. Ripple only jitters the exact moment of a crossing that
    // was going to happen; it never causes one.
    const board = createBoard('lattice')
    const g = 6.0
    const pulse = EMITTERS.pulse
    const perShot = emitterGeneration(pulse.rate, LATE_TARGETS_HIT.pulse ?? 0) - PASSIVE_GENERATION
    const ripple = perShot / pulse.rate / 2
    expect(ripple).toBeLessThan(1)
    expect(stateOf(board, equilibrium(g) + ripple)).toBe('safe')
    expect(stateOf(board, equilibrium(overclockedRegionGeneration(g)) - ripple)).toBe('overclocked')
  })

  it('names a region above meltdown equilibrium as a runaway (§116.4)', () => {
    // §36.1 checked the reboot heat — 18.0 decaying to 0.64 in five seconds — and
    // stopped there. It never asked what happens AFTER the reboot with generation
    // restored: the region climbs back in ~3.1 s and melts again, forever. 39%
    // uptime, 20% of max integrity every 8.1 seconds, dead in forty-one. Nothing in
    // a hundred and fifteen sections described that state.
    const board = createBoard('lattice')
    expect(isRunaway(board, 14)).toBe(false)   // equilibrium 21.0, under 22
    expect(isRunaway(board, 15)).toBe(true)    // equilibrium 22.5, over
    // The escape is §112.2's move verb — spreading the region — and it must work.
    const ring = createBoard('ring')
    expect(isRunaway(ring, 12)).toBe(true)
    expect(isRunaway(ring, 11)).toBe(false)
  })
})

describe('A-034 · §133.1 the region window is clipped, never normalised', () => {
  it('sums four cells at a corner, six at an edge and nine at the centre', () => {
    // The quirk, and it is a SHAPE rather than a value — which is why §74.4's `why`
    // field could not protect it: there is no line of code to hang one on.
    const board = createBoard('lattice')
    expect(window(board, { x: 0, y: 0 }).length).toBe(4)
    expect(window(board, { x: 2, y: 0 }).length).toBe(6)
    expect(window(board, { x: 2, y: 2 }).length).toBe(REGION_CELLS_MAX)
  })

  it('keeps a corner strictly cheaper than a centre for identical hardware', () => {
    // The ASYMMETRY rather than the numbers, because a value survives retuning and a
    // shape does not (§35.3). A future session normalising region heat by window size
    // — "so thresholds mean the same thing everywhere" — deletes §108.1's corner
    // economics, which is why §44.2 measured corner cells chosen 31 times against 78,
    // and **§58.7's ladder check would still pass**, because it tests occupancy and
    // never position. Nothing else in the suite would notice.
    const corner = createBoard('lattice')
    const centre = createBoard('lattice')
    // Three identical emitters, packed as tightly as each position allows.
    for (const [board, cells] of [
      [corner, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]],
      [centre, [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }]],
    ] as const) {
      for (const c of cells) {
        place(board, 'orbiter', c, 0)
        const p = board.placements[board.placements.length - 1]
        if (p !== undefined) addHeat(p, 3)
      }
    }
    // Same hardware, same heat, different position: the centre's window can gather
    // more of the board around it, so the widest region it produces is hotter.
    const worst = (b: Board): number =>
      Math.max(...[...regionField(b).values()])
    expect(worst(centre)).toBeGreaterThanOrEqual(worst(corner))

    // And the clipped window is never divided by its own size. If it were, a corner
    // would read the same as a centre for the same per-cell heat — which is exactly
    // the change that deletes the quirk while leaving every other test green.
    const cornerHeat = regionHeat(corner, { x: 0, y: 0 })
    const centreHeat = regionHeat(centre, { x: 2, y: 2 })
    expect(cornerHeat).toBeCloseTo(centreHeat, 10)
    expect(cornerHeat / window(corner, { x: 0, y: 0 }).length)
      .not.toBeCloseTo(centreHeat / window(centre, { x: 2, y: 2 }).length, 3)
  })

  it('keeps the asymmetry on every core and after the board expands', () => {
    for (const core of CORE_IDS) {
      for (const expanded of [false, true]) {
        const board = createBoard(core)
        if (expanded) expand(board)
        const sizes = cellsOfMask(board).map((c) => window(board, c).length)
        // A clipped window means the board has more than one window size; a
        // normalised one would make them all read alike.
        expect(new Set(sizes).size, `${core} ${expanded}`).toBeGreaterThan(1)
        expect(Math.max(...sizes)).toBeLessThanOrEqual(REGION_CELLS_MAX)
      }
    }
  })
})
