/**
 * §81.3's board prototype, and §9's gate — the one filter in this document with a
 * veto (§73.6), asked at session 3 instead of session 5–7.
 *
 * §81.2 listed what the gate needs against what phase 2 builds and found ten of each:
 * it needs a grid, power, region heat, placement, the move verb, scrapping, inspect
 * mode, causal juice and a cell cursor — and none of the combat, wave director,
 * bosses, XP, meta, Hall, derelicts, anomalies, synergies or combat renderer it was
 * scheduled behind. If it fails, §70.3's ladder executes with two sessions spent
 * rather than seven.
 */
import { describe, expect, it } from 'vitest'
import {
  ENGAGEMENT_FULL, ENGAGEMENT_RADIUS, TRAY, apply, createPrototype, drawPrototype,
  engagementOf, inspect, tick, under, type Prototype,
} from '../../src/ui/prototype.ts'
import { frameOf } from '../../src/render/boardview.ts'
import { cellsOf, drawOf, key, place, thresholds } from '../../src/grid/board.ts'
import { equilibrium, regionHeat } from '../../src/grid/heat.ts'
import { computePower, reaches, runRate } from '../../src/grid/power.ts'
import { LABELS } from '../../src/data/strings.ts'
import { addHeat } from '../../src/grid/board.ts'
import { createWorld } from '../../src/core/world.ts'
import { spawn } from '../../src/core/pool.ts'
import { buildAtlas } from '../../src/render/atlas.ts'
import { stubSurface } from '../surface.ts'

const label = (id: string): string => LABELS.find((l) => l.id === id)?.text ?? id
const at = (p: ReturnType<typeof createPrototype>, x: number, y: number): void => {
  p.cursor = { x, y }
}

describe('A-051 · §69.3 inspect mode carries the six quantities, from state the sim already has', () => {
  it('reports power against draw, the region, this core’s pair, and the equilibrium', () => {
    const p = createPrototype()
    at(p, 2, 1)
    p.holding = TRAY.indexOf('arc')
    apply(p, 'confirm')
    const placed = p.board.placements[0]
    if (placed === undefined) throw new Error('nothing placed')
    addHeat(placed, 6)

    const frame = frameOf(p.board)
    const lines = inspect(p, frame)
    // Six, and not five: §69.1 counted what a placement decision NEEDS against what
    // the board showed — one of eight — with the other seven computed sixty times a
    // second and thrown away. That is why this is the cheapest large change in the
    // document rather than a feature.
    expect(lines).toHaveLength(6)

    const t = thresholds(p.board)
    const region = regionHeat(p.board, p.cursor)
    const delivered = Math.round(runRate(frame.power, placed) * drawOf('arc'))
    expect(lines[0]).toContain(region.toFixed(1))
    expect(lines[1]).toBe(`${label('overclock')} ${t.overclock} ${label('meltdown')} ${t.meltdown}`)
    expect(lines[2]).toBe(`${label('power')} ${delivered} / ${drawOf('arc')}`)
    expect(lines[3]).toContain(label('arc'))
    expect(lines[5]).toContain(equilibrium(region).toFixed(1))
  })

  it('never recomputes a quantity the simulation owns', () => {
    // A number recomputed for the display is a second implementation that can
    // disagree with the one the thresholds are tested against — which is exactly the
    // shape §134.2 found in the fill, one layer over.
    const p = createPrototype()
    at(p, 1, 2)
    p.holding = TRAY.indexOf('pulse')
    apply(p, 'confirm')
    const placed = p.board.placements[0]
    if (placed === undefined) throw new Error('nothing placed')

    for (const seconds of [0.5, 2, 8]) {
      tick(p, seconds)
      const frame = frameOf(p.board)
      const lines = inspect(p, frame)
      const region = regionHeat(p.board, p.cursor)
      expect(lines[0]).toBe(`${label('region')} ${label('heat')} ${region.toFixed(1)}`)
      expect(lines[5]).toBe(`${label('heat')} ${equilibrium(region).toFixed(1)}`)
      expect(runRate(frame.power, placed)).toBe(runRate(computePower(p.board), placed))
    }
  })

  it('names an unrouted island rather than reporting zero power', () => {
    // §135.1D said zero delivered power is reachable by exactly ONE path — §131.5's
    // blackout. Building the board found a second, and it is a PLACEMENT rather than
    // an event: an island the player never routed to. It stays legal deliberately, so
    // the panel has to say which of the two it is looking at.
    const p = createPrototype()
    at(p, 0, 0)
    p.holding = TRAY.indexOf('arc')
    apply(p, 'confirm')
    const island = p.board.placements[0]
    if (island === undefined) throw new Error('nothing placed')
    const frame = frameOf(p.board)
    expect(reaches(frame.power, island)).toBe(false)
    expect(inspect(p, frame)[2]).toBe(`${label('power')} ${label('unrouted')}`)
  })

  it('shows what a confirm would place when the cursor is over an empty cell', () => {
    const p = createPrototype()
    at(p, 4, 4)
    p.holding = TRAY.indexOf('sink')
    const lines = inspect(p, frameOf(p.board))
    expect(under(p)).toBe(-1)
    expect(lines).toHaveLength(3)
    expect(lines[2]).toBe(`${label('sink')} ${label('draw')} ${drawOf('sink')}`)
  })

  it('draws the panel from the atlas, and every line of it', () => {
    const p = createPrototype()
    at(p, 2, 1)
    apply(p, 'confirm')
    const atlas = buildAtlas((w, h) => stubSurface(w, h), ['MELTLINE'])
    const surface = stubSurface(640, 360)
    const draws = drawPrototype(surface, atlas, p, {
      view: { x: 0, y: 0, cell: 40, detail: 'full' }, panelX: 300, panelY: 60, scale: 1,
    })
    expect(draws).toBeGreaterThan(inspect(p, frameOf(p.board)).length)
  })
})

describe('§82.2 the same board, driven by real Swarmers', () => {
  it('reads engagement off the field at §51.3’s own published scale', () => {
    // Derived rather than chosen: Pulse is radial at 120 u and its late-run figure is
    // twelve targets hit, so the count of enemies inside a 120 u circle IS the
    // document's measure of a full late-run crowd. The slider and the run therefore
    // read one axis rather than two that merely look alike.
    const world = createWorld(1)
    expect(engagementOf(world)).toBe(0)

    for (let i = 0; i < ENGAGEMENT_FULL; i++) {
      const e = spawn(world.enemies)
      if (e === undefined) throw new Error('pool refused')
      e.x = i
      e.y = 0
    }
    expect(engagementOf(world)).toBe(1)

    // An enemy outside the bubble is not work the machine is doing (§51.2 counts
    // targets HIT, never enemies alive), so it must not raise the board's heat.
    const far = spawn(world.enemies)
    if (far === undefined) throw new Error('pool refused')
    far.x = ENGAGEMENT_RADIUS * 4
    expect(engagementOf(world)).toBe(1)

    world.enemies.count = 1
    expect(engagementOf(world)).toBeCloseTo(1 / ENGAGEMENT_FULL, 6)
  })

  it('heats a fixed board as the crowd thickens, with no scaling rule anywhere', () => {
    // §51.1's property, and the reason it is worth a tab: nothing in the code raises
    // heat over time. The crowd does it.
    const cold = createPrototype()
    const hot = createPrototype()
    for (const p of [cold, hot]) {
      at(p, 2, 1)
      p.holding = TRAY.indexOf('arc')
      apply(p, 'confirm')
    }
    cold.engagement = 0
    hot.engagement = 1
    for (let i = 0; i < 600; i++) { tick(cold, 1 / 60); tick(hot, 1 / 60) }
    expect(regionHeat(hot.board, { x: 2, y: 1 })).toBeGreaterThan(
      regionHeat(cold.board, { x: 2, y: 1 }))
  })
})

describe('§121.4 the gate counts DECISIONS, not opens', () => {
  it('counts a placement, a move and a scrap, and never a cursor nudge', () => {
    // §2.4's floor counted board OPENS alone and, multiplied against §9's 12-second
    // session ceiling, made the plan's stated success for its own differentiator 36
    // seconds of a 21-minute run — 2.9%. Both numbers predate §68.
    const p = createPrototype()
    at(p, 2, 1)
    p.holding = TRAY.indexOf('arc')
    apply(p, 'confirm')
    expect(p.decisions).toBe(1)

    apply(p, 'up')
    apply(p, 'right')
    apply(p, 'rotate')
    apply(p, 'nextPart')
    apply(p, 'hotter')
    expect(p.decisions).toBe(1)

    at(p, 2, 1)
    apply(p, 'confirm')          // pick it up — §112.2's move verb
    expect(p.carrying).toBe(0)
    at(p, 3, 1)
    apply(p, 'confirm')          // and set it down
    expect(p.carrying).toBe(-1)
    expect(p.decisions).toBe(3)
    expect(cellsOf(p.board.placements[0] ?? { id: 'arc', anchor: { x: 0, y: 0 }, rotation: 0, level: 1, heat: [], wear: 0 })
      .map(key)).toContain(key({ x: 3, y: 1 }))

    // §57.2 — the last remaining emitter cannot be scrapped, and a REFUSED action is
    // not a decision. Scrapping it leaves a board with no output at all: not a
    // softlock, but a slow unwinnable death with no feedback explaining why, which is
    // the "confused" entry on §2's watchlist arriving through a verb the player chose.
    apply(p, 'scrap')
    expect(p.board.placements).toHaveLength(1)
    expect(p.decisions).toBe(3)

    at(p, 2, 2)
    p.holding = TRAY.indexOf('wire')
    apply(p, 'confirm')
    expect(p.decisions).toBe(4)
    apply(p, 'scrap')
    expect(p.decisions).toBe(5)
    expect(p.board.placements).toHaveLength(1)
  })

  it('keeps the cursor inside the core’s own mask', () => {
    // §3.G's cursor SNAPS to cells, and Spindle and Ring are not rectangles: a cursor
    // that walked off the mask would be a fourth navigation idiom (§101.3) and a
    // placement the board could not accept.
    const p = createPrototype()
    at(p, 0, 0)
    for (let i = 0; i < 10; i++) { apply(p, 'up'); apply(p, 'left') }
    expect(p.cursor).toEqual({ x: 0, y: 0 })
    for (let i = 0; i < 20; i++) { apply(p, 'down'); apply(p, 'right') }
    expect(p.cursor).toEqual({ x: 4, y: 4 })
  })

  it('offers §121.6’s run-1 roster and the three support pieces held from run one', () => {
    // The set decides the demo, the onboarding and §64.4's completion gate, and §8.2
    // never said which five emitters and which two amplifiers a new player starts
    // with — so the gate is answered against the board a new player is handed.
    expect([...TRAY]).toEqual([
      'arc', 'orbiter', 'mine', 'flak', 'pulse', 'clock', 'focus', 'wire', 'bus', 'sink',
    ])
    for (const id of TRAY) expect(place(createPrototype().board, id, { x: 2, y: 1 }, 0)).toBe(true)
  })
})

/**
 * A-058 · §112.2, §7.2B — scrapping must not change what the board is carrying.
 *
 * The move verb identifies the carried component by ARRAY INDEX and scrapping
 * SPLICES, so any scrap below the carried index shifted it. Pick up the Orbiter,
 * scrap the Arc, confirm, and the Mine moves to the cursor while the Orbiter stays
 * put — the board doing something the player did not ask for, silently, on the one
 * surface §68 calls the product.
 */
describe('A-058 · §112.2 a carry survives a scrap, or ends', () => {
  const withThree = (): Prototype => {
    const p = createPrototype()
    place(p.board, 'arc', { x: 1, y: 1 }, 0)
    place(p.board, 'orbiter', { x: 3, y: 1 }, 0)
    place(p.board, 'mine', { x: 1, y: 3 }, 0)
    return p
  }
  const at = (p: Prototype, id: string): string | undefined =>
    p.board.placements.find((q) => q.id === id) === undefined
      ? undefined
      : `${p.board.placements.find((q) => q.id === id)?.anchor.x},${p.board.placements.find((q) => q.id === id)?.anchor.y}`

  it('moves the component the player picked up, not the one that inherited its index', () => {
    const p = withThree()
    p.cursor = { x: 3, y: 1 }
    apply(p, 'confirm')                 // carry the Orbiter (index 1)
    p.cursor = { x: 1, y: 1 }
    apply(p, 'scrap')                   // remove the Arc (index 0) — indices shift
    p.cursor = { x: 3, y: 3 }
    apply(p, 'confirm')                 // and this must move the ORBITER

    expect(at(p, 'orbiter')).toBe('3,3')
    expect(at(p, 'mine')).toBe('1,3')
    expect(p.carrying).toBe(-1)
  })

  it('releases the carry when the carried component is the one scrapped', () => {
    const p = withThree()
    p.cursor = { x: 1, y: 3 }
    apply(p, 'confirm')                 // carry the Mine
    apply(p, 'scrap')                   // and scrap it out from under the carry
    expect(p.carrying).toBe(-1)
    expect(at(p, 'mine')).toBeUndefined()

    // The board still takes input: before the fix the index dangled past the end,
    // `move` failed silently and never cleared, and every later confirm was a no-op.
    p.cursor = { x: 3, y: 3 }
    p.holding = TRAY.indexOf('pulse')
    apply(p, 'confirm')
    expect(at(p, 'pulse')).toBe('3,3')
  })

  it('leaves a carry below the scrap alone', () => {
    const p = withThree()
    p.cursor = { x: 1, y: 1 }
    apply(p, 'confirm')                 // carry the Arc (index 0)
    p.cursor = { x: 1, y: 3 }
    apply(p, 'scrap')                   // scrap the Mine (index 2), above it
    p.cursor = { x: 3, y: 3 }
    apply(p, 'confirm')
    expect(at(p, 'arc')).toBe('3,3')
    expect(at(p, 'orbiter')).toBe('3,1')
  })
})
