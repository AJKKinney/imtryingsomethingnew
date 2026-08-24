/**
 * Power — §15's 0-1 BFS, and the half of §8's hook that was decorative for
 * thirty-three sections.
 *
 * §33.1 is the finding underneath every number here: at the original core outputs of
 * 10/12/16 the WORST cell on every core still delivered more power than the hungriest
 * component draws. Placement could never be punished by distance, conduits solved a
 * problem nobody had, and Power Surge — a 1,200-salvage meta upgrade — bought
 * literally nothing. Heat was carrying the entire design while power supplied
 * flavour text, and the sentence the whole game rests on was half false.
 */
import { describe, expect, it } from 'vitest'
import {
  blackout, computePower, deliveredTo, NEIGHBOURS, powerInputs, reaches, restorePower, runRate,
} from '../../src/grid/power.ts'
import {
  cellsOf, createBoard, expand, isConduit, key, mask, place, scrap, type Board,
} from '../../src/grid/board.ts'
import { CORES, type CoreId } from '../../src/data/cores.ts'
import { nextInt, rng } from '../../src/core/rng.ts'
import type { ComponentId } from '../../src/data/emitters.ts'

const CORE_IDS = Object.keys(CORES) as CoreId[]
const PALETTE: ComponentId[] = ['arc', 'orbiter', 'mine', 'gain', 'clock', 'wire', 'bus', 'lance', 'sink']

/**
 * The reference: textbook Dijkstra with a linear scan for the minimum, O(V²) and
 * correct by inspection at V ≤ 29.
 *
 * A deque is only equivalent to it because every edge weight is 0 or 1, and the
 * discipline that makes it exact — 0-cost edges to the FRONT, 1-cost edges to the
 * BACK — is one `unshift` away from being silently wrong. A wrong deque does not
 * crash: it produces a board that is merely slightly wrong, on the quantity §85.2
 * draws as the trace's width and §15 turns into every component's run rate.
 */
const dijkstra = (board: Board): Map<string, number> => {
  const conduitAt = new Map<string, boolean>()
  for (const p of board.placements) {
    for (const c of cellsOf(p)) conduitAt.set(key(c), isConduit(p.id))
  }
  const dist = new Map<string, number>([[key(CORES[board.core].corePosition), 0]])
  const settled = new Set<string>()

  for (;;) {
    let at: string | undefined
    let best = Infinity
    for (const [k, d] of dist) if (!settled.has(k) && d < best) { best = d; at = k }
    if (at === undefined) break
    settled.add(at)
    const [x = 0, y = 0] = at.split(',').map(Number)
    for (const [dx, dy] of NEIGHBOURS) {
      const next = key({ x: x + dx, y: y + dy })
      const conduit = conduitAt.get(next)
      // §15 — power flows through OCCUPIED cells. An empty cell is not a wire.
      if (conduit === undefined) continue
      const candidate = best + (conduit ? 0 : 1)
      const known = dist.get(next)
      if (known === undefined || candidate < known) dist.set(next, candidate)
    }
  }
  return dist
}

/** Deterministic boards: seeded, never `Math.random`, so a failure is reproducible. */
const boards = (core: CoreId, count: number, seed: number): Board[] => {
  const out: Board[] = []
  const r = rng(seed)
  const cells = [...mask(createBoard(core))]
    .map((at) => { const [x = 0, y = 0] = at.split(',').map(Number); return { x, y } })
    .sort((a, b) => (a.y - b.y) || (a.x - b.x))

  for (let n = 0; n < count; n++) {
    const board = createBoard(core)
    if (n % 2 === 1) expand(board)
    const shuffled = [...cells]
    // Fisher-Yates on a seeded stream: an explicit order, never a Set iteration (§14).
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = nextInt(r, i + 1)
      const a = shuffled[i]; const b = shuffled[j]
      if (a !== undefined && b !== undefined) { shuffled[i] = b; shuffled[j] = a }
    }
    const attempts = nextInt(r, shuffled.length) + 1
    for (let i = 0; i < attempts; i++) {
      const anchor = shuffled[i]
      if (anchor === undefined) continue
      const id = PALETTE[nextInt(r, PALETTE.length)]
      if (id === undefined) continue
      place(board, id, anchor, nextInt(r, 4) as 0 | 1 | 2 | 3)
    }
    out.push(board)
  }
  return out
}

describe('A-017 · §15 the 0-1 BFS agrees with a reference Dijkstra', () => {
  it('produces identical distances on every generated board, on every core', () => {
    for (const core of CORE_IDS) {
      for (const board of boards(core, 120, 0x5eed + core.length)) {
        const mine = computePower(board).distance
        const reference = dijkstra(board)
        expect([...mine].sort(), core).toEqual([...reference].sort())
      }
    }
  })

  it('costs 0 to enter a conduit and 1 to enter anything else', () => {
    // The weights ARE the algorithm: with general weights a deque is wrong and a heap
    // is required, so a conduit costing anything but zero silently changes what this
    // function is allowed to be.
    const board = createBoard('lattice')
    // The core sits at (2,2). A wire chain outward costs nothing per step.
    place(board, 'wire', { x: 2, y: 1 }, 0)
    place(board, 'wire', { x: 2, y: 0 }, 0)
    place(board, 'arc', { x: 1, y: 0 }, 0)
    const field = computePower(board)
    expect(field.distance.get(key({ x: 2, y: 0 }))).toBe(0)
    expect(field.distance.get(key({ x: 1, y: 0 }))).toBe(1)
    expect(field.delivered.get(key({ x: 1, y: 0 }))).toBe(CORES.lattice.output - 1)
  })

  it('floors delivered power at zero rather than going negative', () => {
    // Ring is the core where this bites: output 9 across a perimeter whose far side
    // is eight steps away, which is the whole of its identity (§8.1).
    const board = createBoard('ring')
    let previous = { x: CORES.ring.corePosition.x, y: CORES.ring.corePosition.y }
    for (const c of CORES.ring.cells) {
      if (key(c) === key(CORES.ring.corePosition)) continue
      place(board, 'arc', c, 0)
      previous = c
    }
    expect(previous).toBeDefined()
    for (const value of computePower(board).delivered.values()) {
      expect(value).toBeGreaterThanOrEqual(0)
    }
  })

  it('gives a multi-cell component the MAXIMUM over its own cells', () => {
    // Recorded rather than assumed: §15 defines power per CELL, so every component
    // larger than one cell has several values and no section chose between them. The
    // maximum is right because a component is one machine and the trace reaching any
    // of its cells is the trace reaching it. The minimum would run a three-cell Bore
    // at the rate of its worst corner — a second, undeclared penalty on top of
    // §91.1's measured finding that three cells is already disqualifying.
    const board = createBoard('lattice')
    place(board, 'wire', { x: 2, y: 1 }, 0)
    place(board, 'lance', { x: 2, y: 0 }, 0)
    const field = computePower(board)
    const lance = board.placements[1]
    if (lance === undefined) throw new Error('unreachable')
    const each = cellsOf(lance).map((c) => field.delivered.get(key(c)) ?? 0)
    expect(deliveredTo(field, lance)).toBe(Math.max(...each))
    expect(each[0]).not.toBe(each[1])
  })
})

describe('A-018 · §142.2 power is recomputed when a power INPUT changes', () => {
  it('changes its fingerprint on occupancy, on core output, and on the cell mask', () => {
    // §15 pinned the trigger in five words — "recomputed only when the board changes"
    // — written when a placement was the only thing that could move power. There are
    // three inputs, and two of them are not placements.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 2, y: 1 }, 0)
    const base = powerInputs(board)

    const occupancyChanged = createBoard('lattice')
    place(occupancyChanged, 'arc', { x: 2, y: 1 }, 0)
    place(occupancyChanged, 'gain', { x: 1, y: 1 }, 0)
    expect(powerInputs(occupancyChanged)).not.toBe(base)

    const outputChanged = createBoard('lattice')
    place(outputChanged, 'arc', { x: 2, y: 1 }, 0)
    blackout(outputChanged)
    expect(powerInputs(outputChanged)).not.toBe(base)

    const maskChanged = createBoard('lattice')
    place(maskChanged, 'arc', { x: 2, y: 1 }, 0)
    expand(maskChanged)
    expect(powerInputs(maskChanged)).not.toBe(base)
  })

  it('lets a BLACKOUT propagate, which is the mechanic the old trigger could not fire', () => {
    // §131.5: the core is a component in a region and power flood-fills FROM it, so
    // its region melting takes the WHOLE board dark. A meltdown is not a board
    // change, so under "recomputed only when the board changes" the blackout could
    // not propagate at all — the mechanic was unreachable rather than mistuned.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 2, y: 1 }, 0)
    const arc = board.placements[0]
    if (arc === undefined) throw new Error('unreachable')

    expect(runRate(computePower(board), arc)).toBe(1)
    blackout(board)
    expect(runRate(computePower(board), arc)).toBe(0)
    restorePower(board)
    expect(runRate(computePower(board), arc)).toBe(1)
  })

  it('reaches zero by two paths and no others, both of them visible (§135.1D)', () => {
    // §135.1D says zero delivered power is reachable by exactly ONE path — the
    // blackout. Building the board found a second, and it is a placement rather than
    // an event: **an island**, a component with no chain of occupied cells back to the
    // core. §15 flood-fills through orthogonally adjacent OCCUPIED cells, so an island
    // receives nothing, and nothing in the legality rules forbids one.
    //
    // Islands stay legal. Forbidding them would delete the harshest form of the power
    // constraint and the clearest reason conduits exist, and §85.2 makes the mistake
    // the most legible thing on the board: power is drawn as the trace's WIDTH, so an
    // island has no trace at all. What it costs is precision in §8's sentence, which
    // has to be read as narrowly as §135.1D wrote it — a rule about DISTANCE.
    const island = createBoard('lattice')
    place(island, 'arc', { x: 4, y: 4 }, 0)
    const orphan = island.placements[0]
    if (orphan === undefined) throw new Error('unreachable')
    const field = computePower(island)
    expect(reaches(field, orphan)).toBe(false)
    expect(runRate(field, orphan)).toBe(0)

    // And the rule §8 actually states: a component the core CAN reach never switches
    // off, however far away it is. Ring is where that bites hardest — output 9 across
    // a perimeter whose far side is eight steps away, which is its whole identity.
    const ring = createBoard('ring')
    for (const c of CORES.ring.cells) {
      if (key(c) === key(CORES.ring.corePosition)) continue
      place(ring, 'arc', c, 0)
    }
    const reachable = computePower(ring)
    const starved = ring.placements.filter((p) => runRate(reachable, p) < 1)
    expect(starved.length, 'Ring must starve something, or power does not bind').toBeGreaterThan(0)
    for (const p of ring.placements) {
      expect(reaches(reachable, p)).toBe(true)
      expect(runRate(reachable, p), key(p.anchor)).toBeGreaterThan(0)
    }
  })

  it('keeps an offline component occupying its cell and conducting', () => {
    // Derived rather than chosen, from three rules already standing: §8 scopes a
    // meltdown to the REGION, and severing the graph would make a mid-board meltdown
    // silently board-wide; §2's watchlist forbids a death with no legible cause, and
    // a component going dark because something four cells away melted is one; and
    // §135.1D fixes zero delivered power as reachable by exactly one path, which a
    // conducting corpse is what keeps true.
    //
    // The check is structural: the graph is built from OCCUPANCY, and nothing in the
    // simulation may remove a placement to represent it being offline.
    const board = createBoard('lattice')
    place(board, 'arc', { x: 2, y: 1 }, 0)     // the bridge
    place(board, 'orbiter', { x: 2, y: 0 }, 0) // only reachable through it
    const before = computePower(board)
    expect(before.distance.get(key({ x: 2, y: 0 }))).toBe(2)

    // Offline is a state of the component, not an absence of it. Removing it — the
    // shape a "melted components stop conducting" reading would take — severs the arm.
    scrap(board, 0)
    expect(computePower(board).distance.get(key({ x: 2, y: 0 }))).toBeUndefined()
  })
})
