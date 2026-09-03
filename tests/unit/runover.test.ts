/**
 * A-056 · §9 — the run ends when integrity does.
 *
 * §9 is one sentence: *banked salvage kept, unstable lost; board preserved to the
 * Hall; **no revives in v0.1***. The simulation implemented half of it — step 19 set
 * `world.over` and nothing anywhere read it — so a finished run kept ticking, the
 * host persisted it, and the next visit resumed a corpse.
 */
import { describe, expect, it } from 'vitest'
import { advance, clock } from '../../src/gen/loop.ts'
import { createWorld } from '../../src/core/world.ts'
import { TICK_MS } from '../../src/core/tick.ts'

describe('A-056 · §9 a finished run stops', () => {
  it('runs no further ticks once integrity reaches zero', () => {
    const w = createWorld(7)
    const c = clock()
    let overAt = -1
    for (let i = 0; i < 3600 && overAt < 0; i++) {
      advance(c, w, TICK_MS)
      if (w.over) overAt = w.tick
    }
    // The idle player is caught and killed: §37 made Swarmers faster than the player
    // precisely so that standing still is fatal, which is what makes this reachable.
    expect(overAt).toBeGreaterThan(0)

    const tickAtDeath = w.tick
    const killsAtDeath = w.kills
    const integrityAtDeath = w.player.integrity
    for (let i = 0; i < 600; i++) expect(advance(c, w, TICK_MS)).toBe(0)

    // Nothing moved: not the clock, not the score, and not the integrity the run
    // ended on. Before the gate this reached -1,160 integrity and 479 kills.
    expect(w.tick).toBe(tickAtDeath)
    expect(w.kills).toBe(killsAtDeath)
    expect(w.player.integrity).toBe(integrityAtDeath)
  })

  it('is a gate rather than a step, so it composes with the others', () => {
    // §142.4 asks "is this world advancing" in exactly one place. A flag each of the
    // ten steps had to remember to check is the version that rots.
    const w = createWorld(1)
    w.over = true
    expect(advance(clock(), w, TICK_MS * 10)).toBe(0)
    expect(w.tick).toBe(0)
  })
})
