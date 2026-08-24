/**
 * The heat ladder, solved rather than asserted — §58.7's four checks, run over **every
 * board state the game can be in** rather than over one canonical board.
 *
 * §58 is the pass this file exists for, and its finding is the sharpest in the plan:
 * two rules, each fine alone, whose product nobody had computed. Overclock grants
 * +50% fire rate; heat is per shot; so **crossing the overclock line raises the
 * region's own heat generation**, by x1.16 to x1.33 depending on how much of the
 * emitter's heat is the fixed passive term. Every heat table in §31.1, §43.3, §50.3
 * and §51.1 computed equilibria without that term.
 *
 * With it, two things were true at once. **Meltdown could not happen at all** — the
 * seven emitters need eleven cells and a region holds nine, so the hottest legal
 * region equilibrated at 21.10 against a threshold of 22, and the game's title, its
 * centrepiece and the beat §54.3 hung permanent wear on were unreachable by any
 * build. And **the Ring core could not overclock at all**: a 3x3 window on a 1-wide
 * perimeter holds four cells, and 0 of its 84 legal region loadouts reached a
 * threshold calibrated against nine. A 4,500-salvage unlock shipped with the central
 * mechanic switched off, because a threshold was calibrated against a SHAPE nobody
 * had counted.
 */
import { describe, expect, it } from 'vitest'
import {
  equilibrium, isRunaway, overclockedGeneration, emitterGeneration, meanEmitterGeneration,
  regionHeat, stateOf, window,
} from '../../src/grid/heat.ts'
import { createBoard, expand, key, mask, thresholds, type Board } from '../../src/grid/board.ts'
import { computePower, runRate, blackout, restorePower } from '../../src/grid/power.ts'
import { CORES, type Cell, type CoreId } from '../../src/data/cores.ts'
import { DISSIPATION_K, LATE_TARGETS_HIT, PASSIVE_GENERATION, RUNG } from '../../src/data/heat.ts'
import { EMITTERS } from '../../src/data/emitters.ts'

const CORE_IDS = Object.keys(CORES) as CoreId[]
const MEASURED = Object.keys(LATE_TARGETS_HIT)

/** The six board states: three cores x two sizes (§58.7's fourth assertion). */
const STATES: { core: CoreId; expanded: boolean; board: Board }[] =
  CORE_IDS.flatMap((core) => [false, true].map((expanded) => {
    const board = createBoard(core)
    if (expanded) expand(board)
    return { core, expanded, board }
  }))

const cellsOfMask = (board: Board): Cell[] =>
  [...mask(board)]
    .map((at) => { const [x = 0, y = 0] = at.split(',').map(Number); return { x, y } })
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))

/**
 * The largest number of cells a single 3x3 region can contain on this board —
 * **computed from the geometry rather than typed**, because that is the whole content
 * of §58.3's finding. Ring's thresholds were never edited and were never wrong on
 * their own terms; the shape they were being applied to was simply never counted.
 */
const maxRegionOccupancy = (board: Board): number =>
  Math.max(...cellsOfMask(board).map((c) => window(board, c).length))

type Rung = 'safe' | 'overclocked' | 'meltdown'

/**
 * Where a region loadout sits on the ladder, at rest and then after its own feedback.
 *
 * The passive term is one unit per emitter and does not scale with rate, so a
 * region's feedback multiplier is a function of how many emitters it holds — which is
 * why this takes a loadout rather than a single number.
 */
const rungOf = (board: Board, loadout: readonly string[]): Rung => {
  const generation = loadout.reduce((sum, id) => {
    const emitter = EMITTERS[id as keyof typeof EMITTERS]
    return sum + emitterGeneration(emitter.rate, LATE_TARGETS_HIT[id] ?? 0)
  }, 0)
  const t = thresholds(board)
  if (equilibrium(generation) < t.overclock) return 'safe'
  const hot = overclockedGeneration(generation, loadout.length * PASSIVE_GENERATION)
  return equilibrium(hot) >= t.meltdown ? 'meltdown' : 'overclocked'
}

/** Every multiset of measured emitters of size 1..max — Ring's 84, and Lattice's 11,439. */
const loadouts = (max: number): string[][] => {
  const out: string[][] = []
  const build = (start: number, current: string[]): void => {
    if (current.length > 0) out.push([...current])
    if (current.length === max) return
    for (let i = start; i < MEASURED.length; i++) {
      const id = MEASURED[i]
      if (id === undefined) continue
      current.push(id)
      build(i, current)
      current.pop()
    }
  }
  build(0, [])
  return out
}

describe('A-021 · §58.7 all three rungs are reachable on every board state', () => {
  it('counts the region capacity from the geometry, not from a canonical board', () => {
    // §108.3 drew the expansion for the first time and Ring is why it mattered: a
    // 1-wide perimeter thickens under anything adjacent, so the shape of the +4 cells
    // decides whether Ring's thresholds are still correct after 10:00. Outward at the
    // side midpoints takes its max region 4 -> 5, where inward at the inside corners
    // would have taken it to 6 and required a pair nobody had solved.
    const expected: Record<string, number> = {
      'lattice false': 9, 'lattice true': 9,
      'spindle false': 5, 'spindle true': 5,
      'ring false': 4, 'ring true': 5,
    }
    for (const { core, expanded, board } of STATES) {
      expect(maxRegionOccupancy(board), `${core} ${expanded}`)
        .toBe(expected[`${core} ${expanded}`])
    }
  })

  it('finds a safe, a stably overclocked and a melting loadout on all six', () => {
    for (const { core, expanded, board } of STATES) {
      const reached = new Set<Rung>()
      for (const loadout of loadouts(maxRegionOccupancy(board))) {
        reached.add(rungOf(board, loadout))
      }
      expect([...reached].sort(), `${core} ${expanded}`)
        .toEqual(['meltdown', 'overclocked', 'safe'])
    }
  })

  it('keeps overclock at least one full rung below meltdown, before and after modifiers', () => {
    // §58.4 is what this catches. Surge was specified as "+2 core power, meltdown at
    // 12" against an overclock threshold of 14 — so meltdown triggered BELOW
    // overclock, the bonus was unreachable for the whole run, 39.9% of loadouts melted
    // instantly including single-component ones, and §52.2 nonetheless measured Surge
    // as the second-strongest anomaly, because that sweep modelled the power bonus and
    // not the pair. An anomaly that makes the game's bonus unreachable and its penalty
    // automatic is the "cheated" entry on §2's watchlist, delivered by name at run
    // start. Paired offsets cannot invert; the absolute values it replaced could.
    for (const { core, expanded, board } of STATES) {
      const t = thresholds(board)
      expect(t.meltdown - t.overclock, `${core} ${expanded}`).toBeGreaterThanOrEqual(RUNG)
      // Every shipped anomaly offset is a PAIRED shift of both thresholds, so the gap
      // is invariant under all of them by construction.
      for (const offset of [-4, -3, 0]) {
        expect((t.meltdown + offset) - (t.overclock + offset)).toBeGreaterThanOrEqual(RUNG)
      }
    }
  })
})

describe('A-022 · §72.3 the LADDER SHAPE holds, and it is the invariant rather than the pair', () => {
  const mean = (n: number): string[] => Array.from({ length: n }, () => 'tesla')

  it('reproduces the measured mean generation the ladder is scaled to', () => {
    // Tesla sits at 2.08/s, which IS §58.1's mean — so a Tesla region is the average
    // region, and the ladder below is stated in the unit §58.5 derived it in.
    expect(meanEmitterGeneration()).toBeCloseTo(2.08, 2)
    expect(emitterGeneration(EMITTERS.tesla.rate, LATE_TARGETS_HIT.tesla ?? 0))
      .toBeCloseTo(meanEmitterGeneration(), 2)
  })

  it('puts three average emitters safe, four and five overclocked, six melting', () => {
    // The shape, not the numbers. §35.3's rule is that invariants survive retuning and
    // values do not, and §72.3 demoted 10/22 to a PRIOR for exactly that reason: every
    // figure here is measured against a surrogate that shares my assumptions, so the
    // first real sweep solves for whatever thresholds produce this ladder.
    const board = createBoard('lattice')
    expect(rungOf(board, mean(3))).toBe('safe')
    expect(rungOf(board, mean(4))).toBe('overclocked')
    expect(rungOf(board, mean(5))).toBe('overclocked')
    expect(rungOf(board, mean(6))).toBe('meltdown')
  })

  it('melts four Arcs and spares three', () => {
    // The second half of §72.3's statement, and the reason it is stated separately:
    // Arc is the hottest emitter in the game at 2.98/s, it is the DEFAULT starting
    // emitter, and it is the one every demo player fires. At §43.3's 14/22 the stable
    // overclock band was exactly one integer wide for an average mix and **empty for
    // Arc** — three Arcs safe, four melting, no state in between. Overclock was a
    // trapdoor rather than a dial, and §1.2's "the player must have CHOSEN the danger"
    // had nothing to choose.
    const board = createBoard('lattice')
    expect(rungOf(board, ['arc', 'arc', 'arc'])).toBe('overclocked')
    expect(rungOf(board, ['arc', 'arc', 'arc', 'arc'])).toBe('meltdown')
  })

  it('leaves a spread seven-emitter board below overclock at rest (§43.4)', () => {
    // §43.4's requirement, which §58.5 had to re-verify when it reverted §43.3's own
    // fix. §43 raised overclock to 14 because under the STATIC model a finished board
    // sat overclocked at rest — 21 of its 25 regions — so the danger was structural
    // rather than chosen. §50 deleted that model and nobody re-derived the threshold
    // it had been raised to fix. At 10, three emitters sharing a region still sit
    // below the line with the run's targets-hit at rest.
    const board = createBoard('lattice')
    const atRest = ['tesla', 'tesla', 'tesla'].reduce((sum, id) =>
      sum + emitterGeneration(EMITTERS[id as keyof typeof EMITTERS].rate, 0), 0)
    expect(equilibrium(atRest)).toBeLessThan(thresholds(board).overclock)
    // And it may still cross when the crowd arrives, which is the entire point (§50.5).
    expect(rungOf(board, ['tesla', 'tesla', 'tesla', 'tesla'])).toBe('overclocked')
  })
})

describe('A-039 · §131.5 the core melts like anything else, and the board goes dark', () => {
  it('gives the core a region, generating no heat of its own', () => {
    // The core is the only object in the game with no rules of its own — and it is a
    // component in a cell, so §15's 3x3 sum gives it a region whether anyone wrote one
    // or not. It generates nothing: §54.1's theme is that WORK costs heat, and the
    // core does none.
    for (const { core, board } of STATES) {
      const at = CORES[core].corePosition
      expect(window(board, at).length, core).toBeGreaterThan(0)
      expect(regionHeat(board, at), core).toBe(0)
    }
  })

  it('makes the core’s own region a different constraint on each geometry', () => {
    // The three cores become three constraints for free, and on Lattice the eight
    // non-core cells in the core's region are the BEST-POWERED cells on the board —
    // so the balanced core gains a hazard at its heart, while Ring, whose binding axis
    // was always power, is barely touched.
    const nonCore = (core: CoreId, board: Board): number =>
      window(board, CORES[core].corePosition).length - 1
    expect(nonCore('lattice', createBoard('lattice'))).toBe(8)
    expect(nonCore('spindle', createBoard('spindle'))).toBe(4)
    expect(nonCore('ring', createBoard('ring'))).toBe(2)
  })

  it('takes the whole board dark, on every core, and restores it', () => {
    for (const { core, board } of STATES) {
      // Wire everything, then hang a drawing component off it: the conduits are the
      // route and the emitters are what the blackout can be SEEN in, because a
      // zero-draw piece runs at full rate by definition and would hide the fault.
      const cells = cellsOfMask(board).filter((c) => key(c) !== key(CORES[core].corePosition))
      cells.forEach((c, i) => {
        board.placements.push({
          id: i % 3 === 0 ? 'arc' : 'wire', anchor: c, rotation: 0, level: 1, heat: [0], wear: 0,
        })
      })
      const drawing = board.placements.filter((p) => p.id === 'arc')
      expect(drawing.length, core).toBeGreaterThan(0)

      const lit = computePower(board)
      for (const p of drawing) expect(runRate(lit, p), `${core} lit`).toBe(1)

      blackout(board)
      const dark = computePower(board)
      // Every cell, not merely every component: the fault is at the source, so the
      // whole field is zero rather than a region of it.
      for (const value of dark.delivered.values()) expect(value, `${core} dark`).toBe(0)
      for (const p of drawing) expect(runRate(dark, p), `${core} dark`).toBe(0)
      // And the graph is intact throughout — an offline board still conducts, so the
      // reboot restores the same field rather than re-deriving a severed one (§142.2).
      expect([...dark.distance].sort()).toEqual([...lit.distance].sort())

      restorePower(board)
      const back = computePower(board)
      for (const p of drawing) expect(runRate(back, p), `${core} restored`).toBe(1)
    }
  })
})

describe('A-040 · §116.4 a region above meltdown equilibrium cycles rather than melting once', () => {
  it('detects the state from the equilibrium rather than from the current heat', () => {
    // §36.1 checked the reboot and stopped: generation is zero while a region is
    // offline, so heat decays from 18.0 to 0.64 in five seconds and every region
    // reboots at essentially zero, Sink or no Sink. Correct — and it never asked what
    // happens AFTER the reboot with generation restored.
    for (const { core, expanded, board } of STATES) {
      const t = thresholds(board)
      const justUnder = (t.meltdown / 1.5) - 0.01
      const justOver = (t.meltdown / 1.5) + 0.01
      expect(isRunaway(board, justUnder), `${core} ${expanded}`).toBe(false)
      expect(isRunaway(board, justOver), `${core} ${expanded}`).toBe(true)
    }
  })

  it('cycles at well under half uptime and kills inside a minute', () => {
    // The shape, and it is what makes the state fatal rather than expensive: five
    // seconds offline, a climb of about three, five seconds offline, forever — 20% of
    // max integrity every cycle, so the run ends in the time it takes to notice.
    // §116.4's published figures are 39% uptime, 8.1 s and forty-one seconds, and the
    // equilibrium they are computed at is §58.6's 20:00 six-wide reading of 25.0.
    const OFFLINE = 5
    const climb = (eq: number, threshold: number): number =>
      -(1 / DISSIPATION_K) * Math.log(1 - threshold / eq)

    const t = thresholds(createBoard('lattice'))
    const up = climb(25.0, t.meltdown)
    const cycle = up + OFFLINE
    expect(up).toBeCloseTo(3.18, 1)
    expect(cycle).toBeCloseTo(8.18, 1)
    expect(up / cycle).toBeGreaterThan(0.30)
    expect(up / cycle).toBeLessThan(0.50)
    // Five meltdowns at 20% of max integrity, and nothing survives the fifth.
    expect(cycle * 5).toBeLessThan(60)
  })

  it('is escapable only by spreading the region, which needs §112.2’s move verb', () => {
    // The escape arrived four passes before anyone noticed it was load-bearing.
    // Before §112.2 the only way out was to SCRAP a component, at roughly a tenth of
    // a run's progression — so the design's one unrecoverable state had a price
    // nobody would pay, and no section had described the state at all.
    const board = createBoard('lattice')
    const six = ['tesla', 'tesla', 'tesla', 'tesla', 'tesla', 'tesla']
    const generationOf = (loadout: readonly string[]): number => loadout.reduce((sum, id) =>
      sum + emitterGeneration(EMITTERS[id as keyof typeof EMITTERS].rate, LATE_TARGETS_HIT[id] ?? 0), 0)
    const hot = overclockedGeneration(generationOf(six), six.length * PASSIVE_GENERATION)
    expect(stateOf(board, equilibrium(hot))).toBe('meltdown')
    // Spreading to four in the region — the same hardware, one cell further apart —
    // takes it back to a stable rung. That is the only lever, and it is a placement.
    const four = six.slice(0, 4)
    const spread = overclockedGeneration(generationOf(four), four.length * PASSIVE_GENERATION)
    expect(stateOf(board, equilibrium(spread))).toBe('overclocked')
  })
})
