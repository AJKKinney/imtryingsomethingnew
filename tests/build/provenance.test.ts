import { describe, expect, it } from 'vitest'
import { MODEL_VERSION, PARTITIONS, type Axis } from '../../src/data/index.ts'
import { DOCUMENTS } from '../../src/data/documents.ts'

// A-004 · phase 1 · tier build · cadence push · source §96.6, §131.6, §61.5
// why: §96 found four constants owned by three passes, each individually reviewed and
// each wrong at the JOIN — a defect no per-constant column can see. The system tag is
// what makes "a system is audited whole or not at all" enforceable rather than a wish.
describe('A-004 · §131.6 every constant declares its provenance', () => {
  // Both registries: §63.3's rule is about where a constant LIVES, and the document
  // sources are held out of the content hash rather than out of the discipline.
  for (const part of [...PARTITIONS, ...DOCUMENTS]) {
    describe(part.name, () => {
      const exported = Object.keys(part.module).filter((k) => k !== 'provenance')

      it('declares provenance for every exported constant', () => {
        const missing = exported.filter((k) => !(k in part.provenance))
        expect(missing, `${part.name} exports without provenance`).toEqual([])
      })

      it('declares provenance for nothing it does not export', () => {
        const orphans = Object.keys(part.provenance).filter((k) => !exported.includes(k))
        expect(orphans, `${part.name} provenance for missing exports`).toEqual([])
      })

      it('gives every solved value the procedure that emits it', () => {
        for (const [key, p] of Object.entries(part.provenance)) {
          if (p.kind === 'solved') {
            expect(p.solvedBy, `${key} is solved but names no procedure`).toBeTruthy()
            expect(p.solvedBy.length, `${key}'s procedure must be specific`).toBeGreaterThan(20)
          }
        }
      })

      it('cites a section for every constant', () => {
        for (const [key, p] of Object.entries(part.provenance)) {
          expect(p.source, `${key} cites no section`).toMatch(/§\d+/)
        }
      })

      it('names only axes the model knows (§61.5)', () => {
        const known = new Set<string>(Object.keys(MODEL_VERSION))
        for (const [key, p] of Object.entries(part.provenance)) {
          for (const axis of p.axes as Axis[]) {
            expect(known.has(axis), `${key} names unknown axis "${axis}"`).toBe(true)
          }
        }
      })
    })
  }
})
