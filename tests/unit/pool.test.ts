/**
 * A-042 · §17 — pools are allocated at boot and never grown during a run.
 */
import { describe, expect, it } from 'vitest'
import { clear, despawn, pool, spawn } from '../../src/core/pool.ts'
import type { Pooled } from '../../src/core/pool.ts'

interface Thing extends Pooled { x: number }
const make = (): Thing => ({ id: 0, x: 0 })

describe('A-042 · §17 pre-allocated pools', () => {
  it('allocates its whole capacity once, at construction', () => {
    const p = pool<Thing>(2048, make)
    expect(p.items).toHaveLength(2048)
    expect(p.count).toBe(0)
  })

  it('refuses rather than grows when full, and counts the refusal', () => {
    // §31.3 fixes concurrent enemies at 190-624 against a 2,048 pool, so a full pool
    // means something upstream is wrong. A dropped spawn and a counter the sweep can
    // read beats a garbage-collection pause inside a 16.7 ms frame on a Deck.
    const p = pool<Thing>(4, make)
    for (let i = 0; i < 4; i++) expect(spawn(p)).toBeDefined()
    expect(spawn(p)).toBeUndefined()
    expect(p.count).toBe(4)
    expect(p.items).toHaveLength(4)
    expect(p.refused).toBe(1)
  })

  it('keeps alive items dense, so iteration has no holes and no key order', () => {
    const p = pool<Thing>(8, make)
    for (let i = 0; i < 6; i++) {
      const t = spawn(p)
      if (t !== undefined) t.x = i
    }
    despawn(p, 1)
    despawn(p, 0)
    expect(p.count).toBe(4)
    for (let i = 0; i < p.count; i++) expect(p.items[i]).toBeDefined()
  })

  it('gives every item a monotonic id that is never reused', () => {
    // §14 tiebreaks on entity id and forbids a comparator that can return 0 for
    // distinct entities, so a recycled id is a comparator that silently can.
    const p = pool<Thing>(4, make)
    const ids: number[] = []
    for (let round = 0; round < 5; round++) {
      const t = spawn(p)
      if (t !== undefined) ids.push(t.id)
      despawn(p, 0)
    }
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual([...ids].sort((a, b) => a - b))
  })

  it('swaps the last alive item into the freed slot, deterministically', () => {
    const p = pool<Thing>(4, make)
    for (let i = 0; i < 4; i++) {
      const t = spawn(p)
      if (t !== undefined) t.x = i
    }
    despawn(p, 0)
    expect(p.items[0]?.x).toBe(3)
    expect(p.count).toBe(3)
  })

  it('ignores a despawn of something already dead', () => {
    const p = pool<Thing>(4, make)
    spawn(p)
    despawn(p, 0)
    despawn(p, 0)
    despawn(p, -1)
    expect(p.count).toBe(0)
  })

  it('clears without reallocating, so a new run reuses the same memory', () => {
    const p = pool<Thing>(16, make)
    const before = p.items
    for (let i = 0; i < 16; i++) spawn(p)
    clear(p)
    expect(p.count).toBe(0)
    expect(p.items).toBe(before)
  })
})
