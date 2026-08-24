/**
 * A-013 · §140.2 — the stroke face is emitted at build time by the tool that bakes
 * the sine table, and the bundle contains zero font bytes.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { emitSinTable, packFace } from '../../tools/emit.ts'
import { GLYPHS, GLYPH_ADVANCE, GLYPH_COLUMNS, GLYPH_ROWS } from '../../src/data/glyphstrokes.ts'
import { FACE_BYTES, FACE_CHARS, FACE_GLYPHS, FACE_STROKE_COUNT } from '../../src/gen/strokefont.ts'
import { glyphStrokes, hasGlyph, measure, strokeGlyph } from '../../src/render/face.ts'
import { LABEL_SCALE, SCALES, buildAtlas, drawText } from '../../src/render/atlas.ts'
import { stubSurface } from '../surface.ts'
import { lintText, scanText } from '../../tools/linttext.ts'

const ROOT = new URL('../..', import.meta.url).pathname

describe('A-013 · §140.2 the generated stroke face', () => {
  it('is emitted by the same tool that bakes the sine table', () => {
    // Not a coincidence of file layout: §140.2 says "emitted at build time by the tool
    // that already bakes §14's sine table", and one tool means one place where a
    // generated artifact can go stale.
    expect(typeof packFace).toBe('function')
    expect(typeof emitSinTable).toBe('function')
    expect(packFace(GLYPHS)).toContain('FACE_PACKED')
  })

  it('bundles zero font bytes', () => {
    // §139.1 claims zero asset bytes and §18 rests the disclosure position on all art
    // being algorithmic. A face is the one asset every other pass assumed existed.
    const fonts: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) walk(path)
        else if (/\.(woff2?|ttf|otf|eot)$/i.test(entry)) fonts.push(path)
      }
    }
    walk(ROOT)
    expect(fonts).toEqual([])
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    expect(Object.keys(pkg.dependencies ?? {})).toEqual([])
  })

  it('packs to six bits a node, and stays inside §140.2\'s budget', () => {
    // §140.2 estimated ~100 glyphs at ~6 strokes each = 900 bytes. Measured: 100
    // glyphs, 435 strokes, 653 bytes — 4.35 strokes a glyph rather than 6, so the
    // estimate was conservative and the claim holds with room. §141.1's 106 further
    // glyphs land inside the stated 1,854.
    expect(FACE_GLYPHS).toBe(100)
    expect(FACE_STROKE_COUNT).toBe(435)
    expect(FACE_BYTES).toBeLessThanOrEqual(900)
    // Twelve bits a stroke, to the byte.
    expect(FACE_BYTES).toBe(Math.ceil((FACE_STROKE_COUNT * 12) / 8))
  })

  it('round-trips every authored glyph through the packing', () => {
    // The packing is lossy if a coordinate escapes the grid, and a face that loses a
    // stroke loses it silently — one letter with a missing crossbar, on every screen.
    for (const [ch, polylines] of Object.entries(GLYPHS)) {
      const expected: number[] = []
      for (const line of polylines) {
        const points = line.split(' ').filter((t) => t.length > 0)
        if (points.length === 1) {
          const p = points[0] ?? '00'
          expected.push(Number(p[0]), Number(p[1]), Number(p[0]), Number(p[1]))
          continue
        }
        for (let i = 0; i + 1 < points.length; i++) {
          const a = points[i] ?? '00'
          const b = points[i + 1] ?? '00'
          expected.push(Number(a[0]), Number(a[1]), Number(b[0]), Number(b[1]))
        }
      }
      expect([...glyphStrokes(ch)], `glyph '${ch}'`).toEqual(expected)
    }
  })

  it('keeps every glyph on the 7x9 grid', () => {
    for (const ch of FACE_CHARS) {
      const strokes = glyphStrokes(ch)
      for (let i = 0; i < strokes.length; i += 2) {
        expect(strokes[i] ?? 0, ch).toBeLessThan(GLYPH_COLUMNS)
        expect(strokes[i + 1] ?? 0, ch).toBeLessThan(GLYPH_ROWS)
      }
    }
  })

  it('carries every character the game currently renders', () => {
    // §102.6's provenance check is what guarantees this for shipped strings; this is
    // the floor beneath it, so a missing glyph is a failed build and not a gap on a
    // screen nobody looked at.
    const needed = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~·→×−°'
    for (const ch of needed) expect(hasGlyph(ch), `missing '${ch}'`).toBe(true)
  })

  it('strokes a glyph as ONE path, not one per segment', () => {
    // §39.2 found per-segment trails at ~2,450 draws where one path each costs ~306.
    // A letter is the same mistake at a hundred times the frequency.
    const s = stubSurface(64, 64)
    strokeGlyph(s, 'A', 0, 0, 2)
    expect(s.paths).toBe(1)
    expect(s.draws).toBe(1)
  })

  it('measures rather than assumes a width', () => {
    // §141.5's fixed-width surfaces lay out from MEASURED label widths, because
    // es-ES and pt-BR run +20-25% over English and the Deck's bezel band is 80 px.
    expect(measure('')).toBe(0)
    expect(measure('A')).toBe(GLYPH_COLUMNS - 2)
    expect(measure('ABC')).toBe(3 * GLYPH_ADVANCE - 1)
  })
})

describe('A-013 · §147.1 the boot atlas', () => {
  const labels = ['INTEGRITY', 'SALVAGE', 'OVERCLOCK', 'MELTDOWN', 'FAULT TRACE', 'DUTY RATING']

  it('caches glyphs at three scales and labels whole at one', () => {
    // The split is §147.1's, and it is what keeps the atlas bounded in every locale:
    // a glyph set grows with the script and a label does not, because a Chinese label
    // is two to four characters where an English one is eight.
    const atlas = buildAtlas(stubSurface, labels)
    for (const scale of SCALES) expect(atlas.cells.has(`${scale}:A`)).toBe(true)
    expect(atlas.cells.has(`${LABEL_SCALE}:SALVAGE`)).toBe(true)
    // One scale, and the smallest: 131 labels whole at scale 2 measures 1.6 MB
    // against §147.1's 0.8 MB for the whole atlas, and at scale 3 it is 3.6 MB.
    expect(atlas.cells.has('3:SALVAGE')).toBe(false)
  })

  it('stays inside §147.1\'s 0.8 MB, measured rather than asserted', () => {
    // §96.3's lesson: a budget computed against a component's earlier state is a
    // budget that was never real. 131 labels is §102.2's count.
    const many = Array.from({ length: 131 }, (_, i) => `LABEL NUMBER ${i}`)
    const atlas = buildAtlas(stubSurface, many)
    const bytes = atlas.usedPixels * 4
    // Measured at ~0.75 MB: 353 KB of glyphs at three scales plus ~396 KB of labels
    // whole at one. That is the figure §147.1 derived, and it is the reason the atlas
    // stays bounded when zh-Hans arrives.
    expect(bytes).toBeLessThan(0.8 * 1024 * 1024)
    expect(bytes).toBeGreaterThan(0.5 * 1024 * 1024)
  })

  it('draws a cached label in exactly one blit', () => {
    const atlas = buildAtlas(stubSurface, labels)
    const target = stubSurface(640, 360)
    expect(drawText(target, atlas, 'SALVAGE', LABEL_SCALE, 10, 10)).toBe(1)
    expect(target.draws).toBe(1)
  })

  it('falls back to one blit per glyph, and never to fillText', () => {
    const atlas = buildAtlas(stubSurface, labels)
    const target = stubSurface(640, 360)
    // A changing number is one blit per digit — §39.2's rule, unchanged.
    expect(drawText(target, atlas, '14:22', LABEL_SCALE, 0, 0)).toBe(5)
    expect(drawText(target, atlas, 'SALVAGE', 3, 0, 0)).toBe(7)
    expect(target.draws).toBe(12)
  })
})

describe('A-013 · §147.1 no fillText on a frame that renders entities', () => {
  it('finds nothing in render, ui or growth as they stand', () => {
    expect(lintText()).toEqual([])
  })

  it('catches a fillText in a drawing module', () => {
    expect(scanText('src/render/bezel.ts', 'ctx.fillText("hi", 0, 0)')).toHaveLength(1)
  })

  it('lets an entity-free screen render prose, which is what CJK needs', () => {
    // §141.1 ships a subsetted CJK face for zh-Hans and §147.1 keeps it off the
    // atlas; the build report, codex, Hall, settings and run-end screens render no
    // entities, so a fillText there costs nothing against §86.2's ceiling.
    const source = 'export const ENTITY_FREE = true\nctx.fillText(line, 0, y)'
    expect(scanText('src/ui/buildreport.ts', source)).toEqual([])
  })
})
