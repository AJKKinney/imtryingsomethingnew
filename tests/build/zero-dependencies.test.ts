import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// A-001 · phase 1 · tier build · cadence push · source §139.1
// why: a shipped binary with zero runtime dependencies cannot carry a compromised
// transitive package to a player, and §18's "no generative-AI content" claim is only
// auditable if nothing third-party is vendored in. Both are lost the first time
// someone adds a convenience library, so the gate exists from commit 1.
//
// The lockfile is the subject rather than package.json, because npm normalises an
// empty "dependencies" away — and because a *transitive* runtime dependency is the
// failure this is actually guarding against.
const read = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))

describe('A-001 · §139.1 zero runtime dependencies', () => {
  const pkg = read('../../package.json')
  const lock = read('../../package-lock.json')

  it('declares no runtime dependencies', () => {
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([])
  })

  it('pins every devDependency exactly, with no range', () => {
    for (const [name, spec] of Object.entries<string>(pkg.devDependencies ?? {})) {
      expect(spec, `${name} must be pinned exactly`).toMatch(/^\d+\.\d+\.\d+$/)
    }
  })

  it('has no optional or peer dependencies', () => {
    expect(pkg.optionalDependencies).toBeUndefined()
    expect(pkg.peerDependencies).toBeUndefined()
  })

  it('resolves nothing into the runtime tree, transitively', () => {
    const runtime = Object.entries<{ dev?: boolean; link?: boolean }>(lock.packages ?? {})
      .filter(([path, meta]) => path !== '' && !meta.dev && !meta.link)
      .map(([path]) => path)
    expect(runtime).toEqual([])
  })
})
