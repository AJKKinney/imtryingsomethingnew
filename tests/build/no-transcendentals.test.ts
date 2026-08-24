/**
 * A-006 · §14 — no simulation module references a transcendental, Math.random, or
 * iteration over object key order.
 *
 * The rule exists because the failure it prevents is SILENT: a stray `Math.sin`
 * produces a working game that desynchronises on somebody else's machine, months
 * later, in a replay nobody can reproduce. Catching it at authoring time is the
 * difference between a spec violation and a mystery.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { rmSync, writeFileSync } from 'node:fs'
import { lintMath, scan } from '../../tools/lintmath.ts'

const PLANTED = new URL('../../src/core/_planted.ts', import.meta.url).pathname

afterEach(() => rmSync(PLANTED, { force: true }))

describe('A-006 · §14 the no-transcendentals rule', () => {
  it('finds nothing in the simulation as it stands', () => {
    expect(lintMath().map((v) => `${v.file}:${v.line} ${v.why}`)).toEqual([])
  })

  it('fails on a planted Math.sin in src/core/', () => {
    // Planted on disk rather than asserted about a string: the thing that has to
    // work is the rule running over the real tree, and a scanner that is only ever
    // tested against fixtures is a scanner nobody has pointed at the codebase.
    writeFileSync(PLANTED, 'export const wobble = (t: number): number => Math.sin(t)\n')
    const caught = lintMath().filter((v) => v.file.endsWith('_planted.ts'))
    expect(caught).toHaveLength(1)
    expect(caught[0]?.why).toMatch(/implementation-defined/)
  })

  it('names Math.random for the reason it is banned, not just that it is', () => {
    const [v] = scan('x.ts', 'const r = Math.random()')
    expect(v?.why).toMatch(/cannot be seeded/)
  })

  it('catches the transcendentals by family, not by list', () => {
    for (const call of ['Math.cos(x)', 'Math.tan(x)', 'Math.atan2(y, x)', 'Math.pow(a, b)',
                        'Math.exp(x)', 'Math.log(x)', 'Math.hypot(a, b)', 'Math.cbrt(x)']) {
      expect(scan('x.ts', `const v = ${call}`), call).toHaveLength(1)
    }
  })

  it('catches ** , which is Math.pow by another name', () => {
    // This rule found a real instance on its first run: src/data/heat.ts computed
    // REGION_CELLS_MAX as (r * 2 + 1) ** 2. Exact for an integer exponent, and still
    // the operator whose general case is unspecified.
    expect(scan('x.ts', 'const n = side ** 2')).toHaveLength(1)
    expect(scan('x.ts', '/** a doc comment mentioning nothing */')).toEqual([])
  })

  it('catches the wall clock, which is an unrecorded input', () => {
    expect(scan('x.ts', 'const t = Date.now()')).toHaveLength(1)
    expect(scan('x.ts', 'const t = performance.now()')).toHaveLength(1)
  })

  it('catches iteration over object key order', () => {
    expect(scan('x.ts', 'for (const k in board) { total += board[k] }')).toHaveLength(1)
    // Arrays are the alternative and must not be flagged; entities live in dense
    // arrays with explicit indices, which is the whole point of the rule.
    expect(scan('x.ts', 'for (const e of entities) { e.x += e.vx }')).toEqual([])
  })

  it('allows exactly the operations IEEE-754 specifies', () => {
    for (const ok of ['Math.sqrt(x)', 'Math.floor(x)', 'Math.abs(x)', 'Math.min(a, b)',
                      'Math.max(a, b)', 'Math.imul(a, b)', 'Math.PI']) {
      expect(scan('x.ts', `const v = ${ok}`), ok).toEqual([])
    }
  })

  it('lets an author take an exception in writing', () => {
    // An escape hatch that requires a sentence is one nobody uses by accident.
    expect(scan('x.ts', 'const v = Math.sin(t) // lint-math-allow: render only')).toEqual([])
    expect(scan('x.ts', '// lint-math-allow: build-time table bake\nconst v = Math.sin(t)')).toEqual([])
  })

  it('exempts render, ui and growth, which never feed back into the sim', () => {
    expect([...lintMath()].every((v) => !v.file.startsWith('src/render'))).toBe(true)
  })
})
