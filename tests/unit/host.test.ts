/**
 * The host boundary — §14 keeps main.ts as the only file that touches a browser API,
 * so it is the only file where the browser can lie about what it will allow.
 */
import { describe, expect, it } from 'vitest'
import { guardedPads, keyboard } from '../../src/main.ts'
import { createWorld } from '../../src/core/world.ts'
import { runTick } from '../../src/gen/loop.ts'
import { DASH_COOLDOWN } from '../../src/data/player.ts'
import { TRAY, apply, createPrototype } from '../../src/ui/prototype.ts'

describe('A-052 · a device that is present but forbidden is asked once', () => {
  it('returns an empty list and never throws into the frame', () => {
    const denied = (): never => {
      throw new Error('Access to the feature "gamepad" is disallowed by permissions policy.')
    }
    const read = guardedPads(denied)
    expect(read()).toEqual([])
  })

  it('stops calling after the first denial, rather than throwing sixty times a second', () => {
    let calls = 0
    const read = guardedPads(() => {
      calls++
      throw new Error('disallowed by permissions policy')
    })
    for (let i = 0; i < 600; i++) read()
    // A policy denial cannot be revoked within a document, so one ask is the whole ask.
    expect(calls).toBe(1)
  })

  it('is empty and silent where the API is absent entirely', () => {
    const read = guardedPads(undefined)
    expect(read()).toEqual([])
    expect(read()).toEqual([])
  })

  it('keeps reading every frame where the host permits it', () => {
    let calls = 0
    const pads: readonly (Gamepad | null)[] = [null]
    const read = guardedPads(() => {
      calls++
      return pads
    })
    for (let i = 0; i < 5; i++) expect(read()).toBe(pads)
    expect(calls).toBe(5)
  })
})

describe('A-064 · §95.2 a dash is a press, and auto-repeat is not one', () => {
  /** What a held key looks like to a listener: one press, then repeats. */
  const holding = (code: string, repeats: number): readonly (readonly [string, boolean])[] =>
    [[code, false], ...Array.from({ length: repeats }, () => [code, true] as const)]

  it('reports one press for a key held down, however long it is held', () => {
    const keys = keyboard()
    const presses = holding('ShiftLeft', 30).filter(([code, repeat]) => keys.down(code, repeat))
    expect(presses).toHaveLength(1)
  })

  it('reports a press again once the key has actually been released', () => {
    const keys = keyboard()
    expect(keys.down('ShiftLeft', false)).toBe(true)
    keys.up('ShiftLeft')
    expect(keys.down('ShiftLeft', false)).toBe(true)
  })

  it('holds the axis while the key is down, because movement IS a state', () => {
    // The two halves of §142.5's step 2, and the reason the host needs both: a held
    // key is sampled every tick and a dash is consumed once. Guarding the axis the way
    // the dash is guarded would make the player stop walking after one frame.
    const keys = keyboard()
    keys.down('KeyD', false)
    keys.down('KeyD', true)
    expect(keys.axis('KeyA', 'KeyD')).toBe(1)
    keys.up('KeyD')
    expect(keys.axis('KeyA', 'KeyD')).toBe(0)
  })

  it('releases everything on a blur, because no keyup arrives for a held key', () => {
    // A browser delivers no `keyup` for keys that were down when the window lost
    // focus. §9 auto-pauses on visibility loss and §3 makes the lid-close the primary
    // venue's normal case, so without this the player resumes walking in a direction
    // nobody is pressing.
    const keys = keyboard()
    keys.down('KeyW', false)
    keys.down('KeyD', false)
    expect(keys.axis('KeyA', 'KeyD')).toBe(1)
    keys.clear()
    expect(keys.axis('KeyA', 'KeyD')).toBe(0)
    expect(keys.axis('KeyS', 'KeyW')).toBe(0)
  })

  it('is what stops a held key dashing on cooldown for ever', () => {
    // The measurement, against the real loop: the host wrote `live.dash = true` on
    // every keydown, step 2 consumes the bit and clears it, and auto-repeat set it
    // true again before the next tick. No dash was ever queued — and one fired the
    // instant §95.2's cooldown expired, every time, which is the strictly-optimal line
    // that pass repriced the verb from 3 s to 5 s specifically to remove.
    const dashes = (perTick: boolean): number => {
      const world = createWorld(7)
      world.live.moveX = 1
      let count = 0
      let was = 0
      for (let t = 0; t < 3_600; t++) {
        if (perTick || t === 0) world.live.dash = true
        runTick(world)
        if (world.player.dashTicks > was) count++
        was = world.player.dashTicks
      }
      return count
    }
    const ceiling = Math.floor(3_600 / Math.round(DASH_COOLDOWN * 60))
    expect(dashes(true)).toBe(ceiling)   // held: the maximum the cooldown permits
    expect(dashes(false)).toBe(1)        // pressed: one dash, which is what was asked
  })

  it('is what stops a held key inflating the number §9’s gate is scored on', () => {
    // §121.4 bands board decisions at 8–15 a run, and the pad path already reads edges
    // for exactly this reason — "a repeat would make §121.4's decision count a function
    // of how long a thumb rested". The keyboard had that defect ten lines above the
    // sentence describing it.
    const p = createPrototype()
    p.holding = TRAY.indexOf('arc')
    p.cursor = { x: 2, y: 2 }
    const repeats = 31           // one press of Enter held for about a second
    for (let i = 0; i < repeats; i++) apply(p, 'confirm')
    expect(p.decisions).toBe(repeats)
    expect(p.board.placements).toHaveLength(1)

    // Guarded, the same second of held key is the one decision the player made — and
    // 31 of them is more than twice the top of the band, from one press.
    const keys = keyboard()
    const q = createPrototype()
    q.holding = TRAY.indexOf('arc')
    q.cursor = { x: 2, y: 2 }
    for (const [code, repeat] of holding('Enter', repeats - 1)) {
      if (keys.down(code, repeat)) apply(q, 'confirm')
    }
    expect(q.decisions).toBe(1)
    expect(q.board.placements).toHaveLength(1)
  })
})
