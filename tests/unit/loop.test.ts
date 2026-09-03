/**
 * A-012 · §142.6 — the loop is generated from the manifest, every simulation module
 * declares a step index, and no module writes a world attribute from outside the
 * step that declares it.
 *
 * §26 stated the stakes in pass 26 — "ordering IS the simulation's semantics and a
 * reordering is a silent desync" — and §142 counted twenty-two tick-ordered
 * behaviours added since, FOURTEEN with no step at all. A golden hash certifies
 * whatever order the code happens to have, so the order has to be certified against
 * something else, and the manifest is that something.
 */
import { describe, expect, it } from 'vitest'
import { TICK_ORDER } from '../../src/data/tickorder.ts'
import { PENDING, WIRED, advance, clock, runTick } from '../../src/gen/loop.ts'
import { lintSteps } from '../../tools/lintsteps.ts'
import { nextFloat, rng } from '../../src/core/rng.ts'
import { createWorld, type World } from '../../src/core/world.ts'
import { fingerprint } from '../golden.ts'

const world = (seed = 1, enemies = 64): World => {
  const w = createWorld(seed)
  // A fixed cloud of Swarmers, so the per-attribute fingerprints below have
  // something to move. The count is the interesting axis, not the positions.
  const r = rng(seed * 31)
  for (let i = 0; i < enemies; i++) {
    const e = w.enemies.items[i]
    if (e === undefined) continue
    e.id = i + 1
    e.x = (nextFloat(r) - 0.5) * 1200
    e.y = (nextFloat(r) - 0.5) * 1200
    e.hp = 8
  }
  w.enemies.count = enemies
  return w
}

describe('A-012 · §142.6 the generated loop', () => {
  it('wires steps in manifest order and nothing else', () => {
    const order = TICK_ORDER.map((s) => s.id)
    // Every wired step is in the manifest, and in the manifest's order — a loop that
    // ran the right steps in the wrong order would pass any golden hash it wrote.
    expect(WIRED.every((id) => order.includes(id))).toBe(true)
    const positions = WIRED.map((id) => order.indexOf(id))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('says out loud which steps no module has claimed yet', () => {
    // Not a TODO list: it is what stops a half-built loop from looking finished, and
    // it is generated, so it shrinks on its own rather than being maintained.
    const order = TICK_ORDER.map((s) => s.id)
    expect(PENDING.every((id) => order.includes(id))).toBe(true)
    expect(PENDING.some((id) => WIRED.includes(id))).toBe(false)
    // Steps 1 and 24 are the loop's own and are never pending.
    expect(PENDING).not.toContain('timescale')
    expect(PENDING).not.toContain('tickend')
    expect(WIRED.length + PENDING.length).toBe(TICK_ORDER.length - 2)
  })

  it('fails the build on an undeclared step, a duplicate, or an unowned write', () => {
    expect(lintSteps(TICK_ORDER.map((s) => s.id))).toEqual([])
  })

  it('lets no step touch a world attribute it does not own', async () => {
    // The static rule cannot see a mutation THROUGH a reference — `const h = world.hash;
    // h.count = 0` assigns to no `world.x` at all. A fingerprint taken around every
    // step sees it every time, which is why declaration, text and behaviour are three
    // separate mechanisms rather than one restated three ways.
    const owned = new Map<string, readonly string[]>()
    for (const id of WIRED) {
      const entry = TICK_ORDER.find((s) => s.id === id)
      if (entry === undefined) throw new Error(`unwired: ${id}`)
      // Split at the slash: a bundler can only resolve a dynamic specifier whose
      // variables each stand for one path segment.
      const [dir, file] = entry.module.split('/')
      const mod = (await import(`../../src/${dir}/${file}.ts`)) as {
        STEP: string
        WRITES: readonly string[]
        step: (w: World) => void
      }
      expect(mod.STEP, entry.module).toBe(id)
      owned.set(id, mod.WRITES)

      const w = world(7)
      const attributes = Object.keys(w) as (keyof World)[]
      const before = new Map(attributes.map((k) => [k, fingerprint(w[k])]))
      mod.step(w)
      for (const k of attributes) {
        const moved = fingerprint(w[k]) !== before.get(k)
        if (moved) expect(mod.WRITES, `${id} moved world.${k}`).toContain(k)
      }
    }
    // Every wired step declared at least one attribute; the check that matters is
    // the one above, that nothing MOVED which the step had not declared.
    expect([...owned.values()].every((w) => w.length > 0)).toBe(true)
  })

  it('advances the tick and nothing else claims it', () => {
    const w = world()
    runTick(w)
    runTick(w)
    expect(w.tick).toBe(2)
  })
})

describe('A-012 · §142.4 the time-scale is a tick gate', () => {
  it('runs a tick every 16.67 ms at full speed', () => {
    const w = world()
    const c = clock(1)
    let ticks = 0
    for (let frame = 0; frame < 60; frame++) ticks += advance(c, w, 1000 / 60)
    expect(ticks).toBe(60)
    expect(w.tick).toBe(60)
  })

  it('runs FEWER ticks per second at 20% and 5%, and none when paused', () => {
    // The gate stretches the interval; it never scales dt. A dt multiplier would make
    // §14's golden hash a function of frame timing, which is the desync §26 exists to
    // prevent, and it would make "paused" a special case rather than zero ticks.
    const run = (scale: number): number => {
      const w = world()
      const c = clock(scale)
      let ticks = 0
      // 480 frames, for the same reason the fingerprint test below uses 480 ticks:
      // this world dies at 582 (A-056 measured it), and past that the gate stops
      // counting because the run is over rather than because the scale said so.
      for (let frame = 0; frame < 480; frame++) ticks += advance(c, w, 1000 / 60)
      return ticks
    }
    expect(run(1)).toBe(480)
    expect(run(0.2)).toBe(96)
    expect(run(0.05)).toBe(24)
    expect(run(0)).toBe(0)
  })

  it('runs the SAME ticks at every scale, so the world is identical after each', () => {
    // The whole claim of a gate: scale decides WHEN a tick happens and never what it
    // does. Same tick count, same world, bit for bit, at 100%, 20%, 5% and after a pause.
    // Every loop here is bounded by `!w.over` as well as by the target, because
    // §142.4's gate takes a DEAD world out of the schedule (A-056) — so an unbounded
    // `while (w.tick < n)` over a world that dies at n-2 spins forever rather than
    // failing. The guard turns that into a legible assertion instead of a hang, and
    // every target below is one the world survives with margin.
    const upTo = (scale: number, target: number): World => {
      const w = world(4)
      const c = clock(scale)
      let guard = 0
      while (w.tick < target && !w.over && guard < 500_000) {
        advance(c, w, 1000 / 60)
        guard++
      }
      expect(w.tick).toBe(target)
      return w
    }
    const full = fingerprint(upTo(1, 120))
    expect(fingerprint(upTo(0.2, 120))).toBe(full)
    expect(fingerprint(upTo(0.05, 120))).toBe(full)

    // Paused mid-run, then resumed: the same 120 ticks, so the same world.
    const w = world(4)
    const c = clock(1)
    while (w.tick < 60 && !w.over) advance(c, w, 1000 / 60)
    c.scale = 0
    for (let i = 0; i < 300; i++) advance(c, w, 1000 / 60)
    expect(w.tick).toBe(60)
    c.scale = 1
    while (w.tick < 120 && !w.over) advance(c, w, 1000 / 60)
    expect(w.tick).toBe(120)
    expect(fingerprint(w)).toBe(full)
  })

  it('runs upward for the harness, bit-identically (§149.3)', () => {
    // §149.3 turns a 10:00 end-to-end screenshot from eleven minutes into twelve
    // seconds by running the same gate at x50. It is the same property in the other
    // direction, and if it were not bit-identical the whole saving would be a lie.
    // 480 rather than 600, and the number is load-bearing: this world is a standing
    // player inside a cloud of 64 Swarmers, and it dies at tick 598 (measured). At a
    // 600-tick target the x50 side reached the gate's OTHER stop condition two ticks
    // short and the comparison became a test of §9's death rather than of §142.4's
    // symmetry. Eight seconds of game time proves the gate exactly as well.
    const fast = world(6)
    const c = clock(50)
    let guard = 0
    while (fast.tick < 480 && !fast.over && guard < 100_000) { advance(c, fast, 1000 / 60); guard++ }
    expect(fast.tick).toBe(480)
    const slow = world(6)
    for (let i = 0; i < 480; i++) runTick(slow)
    expect(fingerprint(fast)).toBe(fingerprint(slow))
  })

  it('clamps the accumulator across a hitch and pauses across a lid close (§3.B)', () => {
    const w = world()
    const c = clock(1)
    // A hitch: catch up, but only so far. Simulating a whole second of missed frames
    // in one go is a death the player never saw.
    expect(advance(c, w, 300)).toBe(5)
    const before = w.tick
    // A gap: §9 auto-pauses on anything over a second rather than fast-forwarding.
    expect(advance(c, w, 60_000)).toBe(0)
    expect(c.gapDetected).toBe(true)
    expect(c.accumulator).toBe(0)
    expect(w.tick).toBe(before)
  })
})
