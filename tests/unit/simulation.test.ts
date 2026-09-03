/**
 * A-005 · A-011 — §14's payoff, over the real simulation for the first time.
 *
 * Everything this project owns rests on one property: the world is a pure function
 * of (seed, input log). Replays, §16's replayable crash codes, §63.5's seed-parallel
 * sweeps, §66.4's serverless leaderboard verification, §124.5's par being
 * bit-identical on every machine and §80.2's identical daily are that one property
 * read from six angles. Commit 5 asserted it over a stub loop with no steps in it;
 * this asserts it over nine.
 */
import { describe, expect, it } from 'vitest'
import { createWorld, type World } from '../../src/core/world.ts'
import { advance, clock, runTick } from '../../src/gen/loop.ts'
import { nextFloat, rng } from '../../src/core/rng.ts'
import { quantise } from '../../src/core/input.ts'
import { DASH_DURATION, DASH_SPEED, PLAYER_INTEGRITY } from '../../src/data/player.ts'

/** §142.4: the dash is stated in seconds and the simulation is a fixed 60 Hz step. */
const DASH_TICKS = Math.round(DASH_DURATION * 60)
import { step as spawnStep } from '../../src/game/spawner.ts'
import { digest, feed, hasher } from '../golden.ts'

/**
 * A recorded input log, in §14's own sense: a fixed script, generated once from its
 * own seed, and thereafter just numbers. It deliberately does NOT read the world —
 * an input that reacts to the simulation is a hidden input, and §120.6 declined
 * dynamic difficulty for exactly that reason.
 */
const script = (ticks: number): Float64Array => {
  const r = rng(0xc0ffee)
  const log = new Float64Array(ticks * 3)
  let mx = 1
  let my = 0
  for (let t = 0; t < ticks; t++) {
    // Change heading every ~40 ticks, so the run is neither a straight line nor
    // jitter: the first never engages the cone, the second never travels.
    if (t % 40 === 0) {
      mx = nextFloat(r) * 2 - 1
      my = nextFloat(r) * 2 - 1
    }
    log[t * 3] = mx
    log[t * 3 + 1] = my
    log[t * 3 + 2] = t % 300 === 0 ? 1 : 0
  }
  return log
}

const applyFrame = (world: World, log: Float64Array, tick: number): void => {
  const o = tick * 3
  world.live.moveX = log[o] ?? 0
  world.live.moveY = log[o + 1] ?? 0
  world.live.dash = (log[o + 2] ?? 0) === 1
}

/** Every top-level number the simulation carries, in a stated order. */
const worldHash = (world: World): string => {
  const h = hasher()
  feed(h, world.tick)
  feed(h, world.rng.state)
  feed(h, world.player.x)
  feed(h, world.player.y)
  feed(h, world.player.vx)
  feed(h, world.player.vy)
  feed(h, world.player.integrity)
  feed(h, world.player.iframes)
  feed(h, world.player.dashCooldown)
  feed(h, world.player.dashTicks)
  feed(h, world.player.facingX)
  feed(h, world.player.facingY)
  feed(h, world.arc.cooldown)
  feed(h, world.spawnDebt)
  feed(h, world.kills)
  feed(h, world.contactDamage)
  feed(h, world.over ? 1 : 0)
  feed(h, world.enemies.count)
  feed(h, world.enemies.nextId)
  feed(h, world.enemies.refused)
  for (let i = 0; i < world.enemies.count; i++) {
    const e = world.enemies.items[i]
    if (e === undefined) continue
    feed(h, e.id)
    feed(h, e.kind)
    feed(h, e.x)
    feed(h, e.y)
    feed(h, e.hp)
  }
  return digest(h)
}

const TICKS = 10_000

describe('A-005 · §14 the golden hash over 10,000 simulated ticks', () => {
  it('reproduces exactly from the same seed and the same input log', () => {
    const log = script(TICKS)
    const run = (): string => {
      const world = createWorld(7)
      for (let t = 0; t < TICKS; t++) {
        applyFrame(world, log, t)
        runTick(world)
      }
      return worldHash(world)
    }
    expect(run()).toBe(run())
  })

  it('does not reproduce from a different seed', () => {
    // The check above passes trivially for a simulation that ignores its inputs, so
    // this is the half that says the hash is measuring something.
    const log = script(1_000)
    const run = (seed: number): string => {
      const world = createWorld(seed)
      for (let t = 0; t < 1_000; t++) {
        applyFrame(world, log, t)
        runTick(world)
      }
      return worldHash(world)
    }
    expect(run(7)).not.toBe(run(8))
  })

  it('does not reproduce from a different input log', () => {
    const a = script(1_000)
    const b = script(1_000)
    b[1_500] = (b[1_500] ?? 0) + 0.5
    const run = (log: Float64Array): string => {
      const world = createWorld(7)
      for (let t = 0; t < 1_000; t++) {
        applyFrame(world, log, t)
        runTick(world)
      }
      return worldHash(world)
    }
    expect(run(a)).not.toBe(run(b))
  })

  it('records the input log it was driven by, so the run is replayable', () => {
    const log = script(600)
    const world = createWorld(7)
    for (let t = 0; t < 600; t++) {
      applyFrame(world, log, t)
      runTick(world)
    }
    // Three numbers a tick (§142.5 step 2), recorded on the way IN rather than
    // reconstructed afterwards — which is what makes §16's crash codes replayable.
    expect(world.inputLog.length).toBe(600 * 3)
    // The RECORDED value, which is the quantised one (§14): the log is what ran,
    // not what the device reported, because a log that differs from its run is
    // §26's silent desync with a codec in front of it.
    expect(world.inputLog[0]).toBe(quantise(log[0] ?? 0))
  })
})

describe('A-011 · §142.4 the time-scale is a tick gate, not a dt multiplier', () => {
  /**
   * The distinction is the whole of §142.4. Scaling `dt` makes the step a function
   * of frame timing, so the golden hash stops reproducing and replays, par and the
   * daily silently diverge — §26's exact silent desync. Gating the tick leaves the
   * step at 16.67 ms and simply runs it less often.
   */
  const drive = (scale: number, targetTicks: number): World => {
    const log = script(targetTicks)
    const world = createWorld(7)
    const c = clock()
    c.scale = scale
    // Feed wall clock in whole frames until the world has taken `targetTicks` steps.
    let guard = 0
    while (world.tick < targetTicks && guard < targetTicks * 400) {
      applyFrame(world, log, world.tick)
      advance(c, world, 1000 / 60)
      guard++
    }
    return world
  }

  it('produces a bit-identical world at 100%, 20% and 5%', () => {
    const full = worldHash(drive(1, 2_000))
    expect(worldHash(drive(0.2, 2_000))).toBe(full)
    expect(worldHash(drive(0.05, 2_000))).toBe(full)
  })

  it('runs upward as cleanly as downward, which is what §149.3 spends', () => {
    // The e2e harness runs at x50 to the target tick, freezes at scale 0, captures
    // and resumes — eleven minutes of game time in twenty-five seconds — and it is
    // only sound because the gate is symmetric. A `dt` multiplier is not.
    expect(worldHash(drive(50, 2_000))).toBe(worldHash(drive(1, 2_000)))
  })

  it('takes no tick at all at scale 0, which is what makes paused trivial', () => {
    const world = createWorld(7)
    const c = clock()
    c.scale = 0
    for (let i = 0; i < 600; i++) expect(advance(c, world, 1000 / 60)).toBe(0)
    expect(world.tick).toBe(0)
    // §99.3's paused is the case that proves the choice: zero ticks is trivially
    // deterministic where a zero multiplier is a special case somebody has to write.
    expect(worldHash(world)).toBe(worldHash(createWorld(7)))
  })
})

/**
 * A-057 · §46.2, §30 — a spawned enemy is a NEW enemy.
 *
 * §17 pre-allocates and never grows, so `spawn` hands back a slot a dead enemy was
 * using and sets only the id. Everything that makes it a new enemy is the spawner's
 * job, and it set every field except the one added last — so §46.2's hit flash, a
 * STAMP compared against `world.tick`, arrived on enemies that had never been hit.
 */
describe('A-057 · §30 the pool recycles, so the spawner initialises', () => {
  it('never hands a new enemy the previous occupant\'s state', () => {
    const w = createWorld(7)
    // Dirty every slot the way a dead enemy leaves one: the pool never clears an
    // item on despawn — it swaps and decrements — so this is the state a recycled
    // slot genuinely holds, not a hypothetical.
    for (const e of w.enemies.items) {
      e.hurtAt = 999
      e.vx = 123
      e.vy = -456
      e.flags = 0xff
      e.hp = -1
    }
    // Step 7 alone, so the observation lands between the spawn and everything that
    // legitimately writes to a live enemy — `enemyai` sets vx and vy two steps later,
    // and checking after a whole tick would be checking the wrong thing.
    w.spawnDebt = 40
    spawnStep(w)
    expect(w.enemies.count).toBeGreaterThan(20)

    for (let i = 0; i < w.enemies.count; i++) {
      const e = w.enemies.items[i]
      if (e === undefined) throw new Error('missing')
      // Every mutable field, not just the one that bit: the next field added is
      // forgotten the same way, and this is the assertion that notices.
      expect({ hurtAt: e.hurtAt, vx: e.vx, vy: e.vy, flags: e.flags })
        .toEqual({ hurtAt: 0, vx: 0, vy: 0, flags: 0 })
      expect(e.hp).toBeGreaterThan(0)
    }
  })

  it('recycles the slot in a real run, which is what makes that load-bearing', () => {
    // If the pool handed out a fresh object every time, the test above would pass
    // for the wrong reason and stop protecting anything. Stepped directly with the
    // player held alive, because A-056's gate correctly stops a dead run at 792.
    const w = createWorld(7)
    for (let i = 0; i < 1800; i++) { w.player.integrity = PLAYER_INTEGRITY; runTick(w) }
    expect(w.enemies.nextId - 1).toBeGreaterThan(w.enemies.count)
  })
})

describe('A-060 · §9 the dash grants i-frames THROUGHOUT the dash', () => {
  /**
   * §9 states the vent-dash in six words — *"i-frames throughout"* — and the ordering
   * is what makes that hard rather than the rule. The player step is 6 and collision
   * is 14, so what collision sees is the value the player step LEFT, after its own
   * end-of-tick decrement. A cover taken from the already-decremented `dashTicks` is
   * therefore spent early, and spent twice, because the decrement applies to it too.
   */
  const dashing = (): { covered: boolean[]; speeds: number[] } => {
    const world = createWorld(0x5eed)
    world.live.moveX = 1
    world.live.moveY = 0
    world.live.dash = true
    const covered: boolean[] = []
    const speeds: number[] = []
    for (let t = 0; t < DASH_TICKS + 4; t++) {
      // A tick moves at dash speed if the dash is running when the step begins — on
      // the first tick because the step starts it, thereafter while `dashTicks` holds.
      const moving = t === 0 || world.player.dashTicks > 0
      runTick(world)
      world.live.dash = false
      if (!moving) continue
      covered.push(world.player.iframes > 0)
      speeds.push(Math.hypot(world.player.vx, world.player.vy))
    }
    return { covered, speeds }
  }

  it('leaves i-frames standing on every tick the player is committed to the dash', () => {
    const { covered } = dashing()
    expect(covered).toHaveLength(DASH_TICKS)
    expect(covered.every((x) => x)).toBe(true)
  })

  it('is not vacuous — those are the ticks the player is moving at dash speed', () => {
    // Without this the assertion above is satisfied by a dash that does not move, and
    // §110.3's whole point is that the commitment is what the i-frames pay for: the
    // player is travelling at DASH_SPEED and cannot take the direction back.
    const { speeds } = dashing()
    expect(speeds).toHaveLength(DASH_TICKS)
    for (const s of speeds) expect(s).toBeCloseTo(DASH_SPEED, 6)
  })

  it('ends when the dash ends, so the cover is a window and not a grant', () => {
    // The other direction, and the one that stops the fix being "set iframes high":
    // §37.2's global 0.5 s window is the only i-frame source that outlives a dash.
    const world = createWorld(0x5eed)
    world.live.moveX = 1
    world.live.dash = true
    for (let t = 0; t < DASH_TICKS + 4; t++) {
      runTick(world)
      world.live.dash = false
    }
    expect(world.player.dashTicks).toBe(0)
    expect(world.player.iframes).toBe(0)
  })
})
