/**
 * The host boundary — §14 keeps main.ts as the only file that touches a browser API,
 * so it is the only file where the browser can lie about what it will allow.
 */
import { describe, expect, it } from 'vitest'
import { guardedPads } from '../../src/main.ts'

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
