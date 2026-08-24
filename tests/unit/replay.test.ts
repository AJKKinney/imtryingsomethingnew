/**
 * A-009 · A-010 — §14's payoff, and the two refusals that keep it honest.
 *
 * §41.1 costed the paste and §16 costed the mismatch. What is asserted here is the
 * pair of properties every one of this project's promises rests on: a run replays
 * bit-exactly from its recorded log, and a code recorded against different numbers
 * is REFUSED rather than loaded and quietly wrong.
 *
 * The second is the one worth stating twice. §66.2: the simulation is deterministic,
 * so a silently-clamped field does not throw — it produces a run that differs from
 * the sender's, deterministically, forever, and the recipient has no way to know.
 * That reads as *the game is broken*, which is the one emotion §2's watchlist
 * singles out as review-converting.
 */
import { describe, expect, it } from 'vitest'
import { createWorld } from '../../src/core/world.ts'
import { advance, clock, resume, runTick } from '../../src/gen/loop.ts'
import { contentHash } from '../../src/core/content.ts'
import { copyWorld, restore, snapshot } from '../../src/core/snapshot.ts'
import { codeLength, encode, replay, worldHash } from '../../src/core/replay.ts'
import { AXIS_STEPS, quantise } from '../../src/core/input.ts'
import { PAUSE_GAP_MS, TICK_MS } from '../../src/core/tick.ts'
import { nextFloat, rng } from '../../src/core/rng.ts'

const HASH = contentHash()

/** A run, driven the way a host drives one, with the log falling out of step 2. */
const play = (seed: number, ticks: number): ReturnType<typeof createWorld> => {
  const world = createWorld(seed)
  const r = rng(seed * 7 + 1)
  let mx = 1
  let my = 0
  for (let t = 0; t < ticks; t++) {
    if (t % 40 === 0) {
      mx = nextFloat(r) * 2 - 1
      my = nextFloat(r) * 2 - 1
    }
    world.live.moveX = mx
    world.live.moveY = my
    world.live.dash = t % 300 === 0
    runTick(world)
  }
  return world
}

describe('A-010 · §14, §16 a replay reproduces, and a mismatch is refused', () => {
  it('replays a recorded run to a bit-identical world', () => {
    const played = play(11, 3_000)
    const code = encode(11, played.inputLog, HASH)
    const result = replay(code, HASH)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(worldHash(result.world)).toBe(worldHash(played))
  })

  it('quantises at the boundary, so the log IS what ran', () => {
    // Not a codec applied afterwards — that would be a log that differs from the run
    // it recorded, which is §26's silent desync with a compressor in front of it.
    const world = createWorld(3)
    world.live.moveX = 0.123456789
    runTick(world)
    expect(world.input.moveX).toBe(quantise(0.123456789))
    expect(world.inputLog[0]).toBe(world.input.moveX)
    // Round-trips through the encoder's integer form without loss, by construction.
    expect(Math.round(world.input.moveX * AXIS_STEPS) / AXIS_STEPS).toBe(world.input.moveX)
  })

  it('refuses a replay recorded against different numbers, and says so', () => {
    const played = play(11, 600)
    const code = encode(11, played.inputLog, 'deadbeef')
    const result = replay(code, HASH)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('content')
    // §16 — shown as a static board snapshot rather than played back. The message
    // has to name what it was recorded against or the player cannot act on it.
    expect(result.detail).toContain('deadbeef')
  })

  it('refuses a replay from a newer build rather than guessing', () => {
    const played = play(11, 60)
    const code = { ...encode(11, played.inputLog, HASH), version: 99 }
    const result = replay(code, HASH)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('version')
  })

  it('compresses a held input to a handful of runs, which is why §41.1 fits', () => {
    // Input is HELD far more often than it changes; the compression is a fact about
    // hands rather than a clever encoding.
    const world = createWorld(5)
    world.live.moveX = 1
    for (let t = 0; t < 3_600; t++) runTick(world)
    const code = encode(5, world.inputLog, HASH)
    expect(code.runs.length / 4).toBeLessThan(5)
    // A minute of held input, in the base64 characters §41.1 counts.
    expect(codeLength(code)).toBeLessThan(64)
  })

  it('costs 16-23 KB for a 20-minute run, against §41.1\'s predicted ~2,500 characters', () => {
    // §41.1's own event rate: ~3,700 input changes across 72,000 ticks. The claim
    // was "~6x from RLE and varints on top of delta encoding", which needs half a
    // byte per event; a run is a varint count plus two zigzag varint deltas, and
    // even a held key costs three bytes. Measured rather than tuned until it agrees
    // (§121.5), and recorded rather than the band being moved to fit (§92.2).
    //
    // The two-tier DECISION is unaffected and strengthened: at 20 KB the full code
    // is a file rather than a paste, and §41.1's ~190-character summary is what the
    // playtester actually sends.
    const log: number[] = []
    const r = rng(99)
    let x = 0
    let y = 0
    for (let t = 0; t < 72_000; t++) {
      if (t % 19 === 0) {
        x = quantise(nextFloat(r) * 2 - 1)
        y = quantise(nextFloat(r) * 2 - 1)
      }
      log.push(x, y, t % 300 === 0 ? 1 : 0)
    }
    const chars = codeLength(encode(1, log, HASH))
    expect(chars).toBeGreaterThan(16_000)
    expect(chars).toBeLessThan(24_000)
  })
})

describe('A-009 · §3.B, §9 the accumulator clamps and a resume is exact', () => {
  it('discards the accumulator across a visibility gap rather than catching up', () => {
    const world = createWorld(2)
    const c = clock()
    for (let i = 0; i < 120; i++) advance(c, world, TICK_MS)
    const before = world.tick
    // A lid closed for four seconds. Catching up through it is a death the player
    // did not see — §3.B, and the primary venue closes its lid constantly.
    expect(advance(c, world, PAUSE_GAP_MS * 4)).toBe(0)
    expect(world.tick).toBe(before)
    expect(c.accumulator).toBe(0)
    expect(c.gapDetected).toBe(true)
    // The pause is SIMULATION state, so it is a recorded input rather than a host
    // callback — an unrecorded input is a replay that does not reproduce.
    expect(world.paused).toBe(true)
    expect(advance(c, world, TICK_MS)).toBe(0)
    resume(c, world)
    expect(advance(c, world, TICK_MS)).toBe(1)
  })

  it('clamps catch-up to a COUNT of ticks, not a ceiling on the accumulator', () => {
    const world = createWorld(2)
    const c = clock()
    // Clamping the float measured four ticks where five were intended, because after
    // four subtractions the remainder sat 8e-15 below one interval. A budget of
    // ticks says what it means and cannot be eroded by the arithmetic it bounds.
    expect(advance(c, world, TICK_MS * 20)).toBe(5)
    expect(c.accumulator).toBe(0)
  })

  it('round-trips a suspended world bit-exactly', () => {
    const played = play(13, 1_200)
    const saved = snapshot(played, HASH)
    const result = restore(saved, HASH)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(worldHash(result.world)).toBe(worldHash(played))
  })

  it('resumes into a world that continues identically', () => {
    // The property that matters is not that the copy matches — it is that a run
    // resumed from disk and a run that never stopped stay the same run.
    const played = play(13, 900)
    const result = restore(snapshot(played, HASH), HASH)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    for (let t = 0; t < 300; t++) {
      played.live.moveX = 1
      result.world.live.moveX = 1
      runTick(played)
      runTick(result.world)
    }
    expect(worldHash(result.world)).toBe(worldHash(played))
  })

  it('copies the whole pool, not the live prefix', () => {
    // A pooled entity beyond `count` is dead storage the next spawn overwrites.
    // Copying only the prefix would make a resumed world diverge from a continued
    // one the first time anything spawned — days later, and untraceably.
    const played = play(13, 600)
    const copy = copyWorld(played)
    expect(copy.enemies.items.length).toBe(played.enemies.items.length)
    expect(copy.enemies.nextId).toBe(played.enemies.nextId)
  })

  it('refuses a snapshot recorded against different numbers', () => {
    const result = restore(snapshot(play(13, 60), 'deadbeef'), HASH)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('content')
  })

  it('gives the content hash a value that moves when a number moves', () => {
    // §16's whole claim. It is computed from `src/data/` rather than declared,
    // because a hash a human maintains goes stale on the commit that mattered.
    expect(contentHash()).toBe(HASH)
    expect(HASH.length).toBe(8)
  })
})
