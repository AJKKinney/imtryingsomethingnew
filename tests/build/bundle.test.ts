import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { FORBIDDEN_SYMBOLS, TARGETS } from '../../src/data/builds.ts'
import { LAWS } from '../../src/data/laws.ts'

const root = fileURLToPath(new URL('../../', import.meta.url))
const OUT = `${root}dist/web/assets`

// A-014 · phase 1 · tier perf · cadence push · source §139.1, §148.4
// why: bundle size only ever creeps upward without a gate, and this one is not a vanity
// number — §64.2 measured the first fifteen seconds of a link-click at a tier of
// commercial outcome, and the whole reason a stranger plays at all is that the game is
// running about a second after the click. The ceiling is stamped **web** (§148.4): §102.5
// commits 250 MB for the two Electron products, and the two budgets had never been
// compared to each other.
describe('A-014 · §139.1 the web bundle stays under its ceiling', () => {
  const CEILING = 700 * 1024

  // Built here rather than trusted from a previous step: `npm test` must be able to fail
  // on its own, and a check that only runs when something else ran first is a check that
  // quietly stops running.
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' })

  const bundles = readdirSync(OUT).filter((f) => f.endsWith('.js'))
  const total = bundles.reduce((n, f) => n + statSync(`${OUT}/${f}`).size, 0)

  it(`emits a bundle at all`, () => {
    expect(bundles.length).toBeGreaterThan(0)
  })

  it(`stays under ${CEILING} bytes`, () => {
    expect(total, `web bundle is ${total} bytes`).toBeLessThanOrEqual(CEILING)
  })

  it('carries zero font bytes and zero asset bytes (§140.2)', () => {
    // The stroke face is emitted as source at build time by the tool that bakes §14's
    // sine table, so the claim is checkable rather than merely stated: nothing in the
    // output is a font, an image or a sound.
    const assets = readdirSync(OUT).filter((f) => !f.endsWith('.js') && !f.endsWith('.css'))
    expect(assets, `the bundle carries asset files: ${assets.join(', ')}`).toEqual([])
  })

  it('ships no document source in the game (§145.4)', () => {
    // Found by this check the day it was written: laws, decisions, the schedule and the
    // asset manifest were reachable from `src/data/index.ts` and rode into the bundle,
    // adding 58 KB of prose to a build whose whole argument is that it loads instantly.
    // **A document source is not a runtime import.**
    //
    // Checked on a string literal rather than on an identifier, because minification
    // mangles the second and cannot touch the first.
    const emitted = bundles.map((f) => readFileSync(`${OUT}/${f}`, 'utf8')).join('')
    const lawText = LAWS[0]?.law.slice(0, 40) ?? ''
    expect(lawText.length).toBeGreaterThan(20)
    expect(emitted.includes(lawText), 'LAWS.md\'s source is in the game bundle').toBe(false)
  })

  it('emits no forbidden symbol for the web target (§148.4)', () => {
    // A flag read at runtime is a flag that shipped, so the check is on the OUTPUT.
    // §149.3's fast-forward is the sharpest case: a time-scale that reaches a shipped
    // build is not a debug convenience, it is a cheat.
    const emitted = bundles.map((f) => readFileSync(`${OUT}/${f}`, 'utf8')).join('')
    for (const symbol of FORBIDDEN_SYMBOLS.web) {
      expect(emitted.includes(symbol), `web bundle contains ${symbol}`).toBe(false)
    }
  })

  it('declares every flag for every target, with no default (§148.4)', () => {
    // A default is how §98.4's telemetry reaches the paid build. There is no default,
    // and the type system alone cannot say so once a target is data rather than a type.
    const keys = Object.keys(TARGETS.web)
    for (const [id, flags] of Object.entries(TARGETS)) {
      for (const key of keys) {
        expect(key in flags, `${id} leaves ${key} to a default`).toBe(true)
      }
    }
    expect(TARGETS.steamFull.telemetry, 'telemetry compiled into the paid build').toBe(false)
    expect(TARGETS.steamFull.runCapMinutes, 'the 10:00 cap compiled into the paid build').toBe(null)
    expect(TARGETS.web.testTimeScale, 'the e2e fast-forward reachable from the web build').toBe(false)
  })
})
