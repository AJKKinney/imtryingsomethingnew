import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, BEGIN, END } from '../../tools/gendocs.ts'

// A-002 · phase 1 · tier build · cadence push · source §63.3
// why: transcription across twenty memoryless sessions is exactly the mechanism by
// which a specification and its code diverge. Inverting the source of truth removes
// the transcription; this check removes the possibility of editing the copy.
describe('§63.3 the appendix cannot drift', () => {
  const onDisk = readFileSync(new URL('../../docs/appendix-a.md', import.meta.url), 'utf8')

  it('matches what the generator emits, byte for byte', () => {
    expect(onDisk).toBe(render())
  })

  // A-003 · §147.2 — a generated region is marked, and enforced in both directions.
  it('is fully enclosed by its sentinels', () => {
    expect(onDisk.startsWith(BEGIN)).toBe(true)
    expect(onDisk.trimEnd().endsWith(END)).toBe(true)
  })
})
