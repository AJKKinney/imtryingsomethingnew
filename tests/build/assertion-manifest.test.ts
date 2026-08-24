/**
 * A-016 · §71.2 — the manifest check, in both directions.
 *
 * §22's check list used to be a 899-word paragraph that could not answer how many
 * assertions there were, which phase each belonged to, or which were done. The
 * manifest answers all three; this is what stops it from becoming decoration.
 *
 * An assertion marked `implemented` with no test citing its id is a claim about
 * work that was never done. A test citing an id the manifest does not carry is
 * scope that arrived without a decision behind it. Both fail here.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ASSERTIONS, PLANNED, byPhase, coverage } from '../assertions.ts'
import type { Phase } from '../assertions.ts'

const TESTS = new URL('..', import.meta.url).pathname

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.test.ts') ? [path] : []
  })

const CITATION = /\bA-\d{3}\b/g

/** id -> the test files that cite it. */
const citations = new Map<string, string[]>()
// This file is scanned like any other: the only literal id in it is A-016 in the
// suite title below. Every other id it handles is read from the manifest at runtime
// or built from a template, so it cannot accidentally vouch for work nobody did.
for (const file of walk(TESTS)) {
  for (const id of new Set(readFileSync(file, 'utf8').match(CITATION) ?? [])) {
    citations.set(id, [...(citations.get(id) ?? []), file.slice(TESTS.length)])
  }
}

const known = new Set(ASSERTIONS.map((x) => x.id))

describe('A-016 · §71.2 the assertion manifest', () => {
  it('gives every implemented assertion a test that cites it', () => {
    const orphans = ASSERTIONS.filter((x) => x.status === 'implemented' && !citations.has(x.id))
      .map((x) => `${x.id} (${x.source}) — ${x.statement}`)
    expect(orphans).toEqual([])
  })

  it('gives every citing test a known assertion', () => {
    const unknown = [...citations].filter(([id]) => !known.has(id))
      .map(([id, files]) => `${id} cited by ${files.join(', ')}`)
    expect(unknown).toEqual([])
  })

  it('never lets a cited assertion stay marked todo', () => {
    // A test exists, so the work is done. A stale `todo` makes coverage lie downward,
    // which is the direction nobody checks.
    const stale = ASSERTIONS.filter((x) => x.status === 'todo' && citations.has(x.id)).map((x) => x.id)
    expect(stale).toEqual([])
  })

  it('uses stable, unique, contiguous ids', () => {
    const ids = ASSERTIONS.map((x) => x.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toEqual(ids.map((_, i) => `A-${String(i + 1).padStart(3, '0')}`))
  })

  it('gives every assertion a falsifiable statement and a why (§74.4)', () => {
    for (const x of ASSERTIONS) {
      expect(x.statement.length, x.id).toBeGreaterThan(30)
      // The `why` is the counter-intuitive reason. It is what stops a refactor
      // deleting the finding — the most valuable ones look most like cleanup.
      expect(x.why.length, x.id).toBeGreaterThan(60)
      expect(x.source, x.id).toMatch(/§\d+(\.\d+)?/)
    }
  })

  it('seeds a phase completely before that phase begins (§136.3)', () => {
    // Phase 1 is the work in front of us, so it is seeded to §71.2's measured count.
    // Later phases are seeded as they are reached; a phase may never exceed its plan,
    // because PLANNED is what `ROADMAP.md` reports coverage against.
    expect(coverage(1)).toMatchObject({ seeded: PLANNED[1], planned: PLANNED[1] })
    for (const phase of [1, 2, 3, 4, 5, 6] as Phase[]) {
      expect(byPhase(phase).length, `phase ${phase}`).toBeLessThanOrEqual(PLANNED[phase])
    }
  })

  it('declares a cadence for every assertion (§149.4)', () => {
    // §22 stamped a hundred checks with a tier and a phase and never with when they
    // run, so three sections gave the same smoke tier three clocks 40x apart.
    const cadences = new Set(['push', 'data-slice', 'phase-boundary', 'release', 'report'])
    for (const x of ASSERTIONS) expect(cadences.has(x.cadence), x.id).toBe(true)
  })

  it('keeps the player tier a reporting cadence, never a gate (§149.4)', () => {
    // A human-measured band wired into a build check is a gate that can never be
    // satisfied by a build.
    for (const x of ASSERTIONS) if (x.tier === 'player') expect(x.cadence, x.id).toBe('report')
  })
})
