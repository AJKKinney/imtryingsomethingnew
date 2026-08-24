import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LABELS, LABEL_BUDGET, PROSE, PROSE_BUDGET, PROSE_WORDS, labelsIn } from '../../src/data/strings.ts'
import { ACHIEVEMENTS, ASSETS, GENERATED_ASSETS, ICON_COUNT } from '../../src/data/assets.ts'

const pipeline = (): string => readFileSync(new URL('../../PIPELINE.md', import.meta.url), 'utf8')

// A-044 · phase 1 · tier build · cadence push · source §102.6, §102.2
// why: §18 rests the whole disclosure position on a split between functional strings and
// content and never enumerated either side — and §102.1 is why that is not bookkeeping.
// §18 exempted machine names on the grounds that players write them; §47.4 auto-names
// every machine and §66.1 makes the shared name a procedural index, so the one category
// it exempted is the category players never write. A boundary nobody can check has
// already moved.
describe('A-044 · §102.6 every string is on exactly one list', () => {
  it('gives every label an id, a group and a rendering', () => {
    for (const l of LABELS) {
      expect(l.id.length, `a label has no id`).toBeGreaterThan(0)
      expect(l.text.length, `${l.id} renders as nothing`).toBeGreaterThan(0)
    }
  })

  it('repeats no label id and no rendered label', () => {
    // §141.4 makes these lists the runtime string table, so a duplicate id is a locale
    // silently rendering one of two different things.
    const ids = LABELS.map((l) => l.id)
    const texts = LABELS.map((l) => l.text)
    expect(new Set(ids).size, 'duplicate label id').toBe(ids.length)
    expect(new Set(texts).size, 'two labels render identically').toBe(texts.length)
  })

  it('puts nothing on both lists', () => {
    // The test §102.2 drew: a LABEL names a thing the player manipulates and could be an
    // icon; PROSE is written to be read. A string that is both is a string whose
    // authorship is undecided, which is precisely what §18 cannot afford.
    const labelIds = new Set(LABELS.map((l) => l.id))
    for (const p of PROSE) expect(labelIds.has(p.id), `${p.id} is on both lists`).toBe(false)
  })

  it('gives every prose surface a word budget, a voice and a due phase', () => {
    for (const p of PROSE) {
      expect(p.words, `${p.id} has no budget`).toBeGreaterThan(0)
      expect(p.voice.length, `${p.id} has no voice constraint`).toBeGreaterThan(40)
      expect(['3b', '6'], `${p.id} is due nowhere`).toContain(p.due)
    }
  })

  it('freezes the machine-name namespace before the first share link exists', () => {
    // §102.3 — a 2-byte share index means a code posted in Early Access must resolve to
    // the same name in 1.0 forever, so the list is append-only, never reordered, and
    // complete at v0.1. §62.3 puts the first public share link at phase 3b.
    const names = PROSE.find((p) => p.id === 'nameParts')
    expect(names?.due, 'the namespace must freeze at 3b, before any code is shared').toBe('3b')
  })

  it('stays inside its budgets, and reports the gap rather than rounding it away', () => {
    expect(LABELS.length).toBeLessThanOrEqual(LABEL_BUDGET)
    expect(PROSE_WORDS).toBeLessThanOrEqual(PROSE_BUDGET)
    // §134.3 — the victory ships ZERO strings. §4.4 defines the reveal as the one
    // deliberately languageless moment in the game and §102.2 had budgeted sixty words
    // across death AND victory, so any sentence arriving with that camera move is a
    // sentence explaining the image.
    const death = PROSE.find((p) => p.id === 'death')
    expect(death?.surface.toLowerCase()).not.toContain('victory')
  })

  it('publishes both lists into PIPELINE.md', () => {
    const doc = pipeline()
    for (const l of labelsIn('emitter')) expect(doc).toContain(l.text)
    for (const p of PROSE) expect(doc).toContain(p.surface)
  })
})

// A-045 · phase 1 · tier build · cadence push · source §140.6, §140.3
// why: Steamworks takes an API name, a display name, a description and TWO icons per
// achievement, so §19's twenty were unshippable from pass 19 to pass 140 — and the sweep
// that found it is one line: typeface, achievement icon, library capsule and favicon
// appeared zero times in sixteen thousand lines. §18 was audited for a hundred and
// thirty-nine passes against the art INSIDE the simulation.
describe('A-045 · §140.6 every asset the player sees has a derivation', () => {
  it('names a source scene and a safe inset for every asset', () => {
    for (const a of ASSETS) {
      expect(a.scene.length, `${a.id} has no source scene`).toBeGreaterThan(10)
      expect(a.width, `${a.id} has no size`).toBeGreaterThan(0)
      expect(a.safeInset, `${a.id} has no safe area`).toBeGreaterThanOrEqual(0)
    }
  })

  it('flags a size that has not been checked against the world (§100.7)', () => {
    // Not a failure — a REPORT. Valve's required dimensions are a claim about the world
    // and are verified at the partner site on upload; what fails is pretending
    // otherwise, so an unverified row must say `unverified` where the date goes.
    const unverified = ASSETS.filter((a) => a.verifiedAgainst === undefined)
    for (const a of unverified) expect(pipeline()).toContain(`\`${a.id}\``)
    expect(pipeline()).toContain('**unverified**')
  })

  it('gives every achievement two generable icons and a stated scope', () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.scene.length, `${a.api} has no scene, so its icons cannot be generated`).toBeGreaterThan(10)
      expect(Number.isInteger(a.seed), `${a.api} has no seed`).toBe(true)
      expect(['run', 'lifetime'], `${a.api} declares no scope`).toContain(a.scope)
    }
    // §34.2 found one achievement needing 80 picks against the 40 a run provides, so the
    // per-run/lifetime tag is a correctness property rather than a label.
    expect(ICON_COUNT).toBe(ACHIEVEMENTS.length * 2)
  })

  it('repeats no Steamworks API name', () => {
    // An API name is a key on Valve's side and is frozen on upload; two achievements
    // sharing one is a data loss that only appears after the store page is live.
    const api = ACHIEVEMENTS.map((a) => a.api)
    expect(new Set(api).size).toBe(api.length)
  })

  it('unlocks nine components from first-time acts of play (§79.2)', () => {
    // §79.1 found runs 2 and 3 contain nothing structurally new — the highest-churn
    // window in any roguelite. Keying unlocks to events rather than to a run counter is
    // what guarantees they do.
    const unlocking = ACHIEVEMENTS.filter((a) => a.unlocks !== undefined)
    expect(unlocking.length).toBe(9)
    const unlocked = unlocking.map((a) => a.unlocks)
    expect(new Set(unlocked).size, 'two achievements unlock the same component').toBe(9)
  })

  it('commits no generated code, and says which files those are (§147.2)', () => {
    const ignored = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8')
    for (const g of GENERATED_ASSETS) {
      const path = g.split(' ')[0]
      expect(ignored, `${path} is generated and committed`).toContain(path)
    }
  })
})
