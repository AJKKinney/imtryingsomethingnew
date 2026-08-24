/**
 * The stroke face, decoded (§140.2).
 *
 * `src/data/glyphstrokes.ts` is the authored source and `tools/emit.ts` packs it into
 * `src/gen/strokefont.ts` at six bits a node. This unpacks it once, at boot, into
 * flat typed arrays — no per-glyph objects, no Map, nothing allocated per frame.
 *
 * Nothing here rasterises. `render/atlas.ts` does that once at boot, and every string
 * the game draws afterwards is a blit, because §39.2 measured `fillText` at 10-50x a
 * `drawImage` and §140.5 counted 29 live text runs a frame against a 103-draw margin.
 */
import { FACE_CHARS, FACE_OFFSETS, FACE_PACKED } from '../gen/strokefont.ts'
import { GLYPH_ADVANCE, GLYPH_BASELINE, GLYPH_COLUMNS, GLYPH_ROWS } from '../data/glyphstrokes.ts'
import type { Surface } from './surface.ts'

export { GLYPH_ADVANCE, GLYPH_BASELINE, GLYPH_COLUMNS, GLYPH_ROWS }

/** Two node indices per stroke, four numbers per stroke once unpacked to (x, y). */
const unpack = (): Int8Array => {
  const binary = atob(FACE_PACKED)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const total = (FACE_OFFSETS[FACE_OFFSETS.length - 1] ?? 0) * 2
  const nodes = new Int8Array(total)
  let acc = 0
  let bits = 0
  let out = 0
  for (let i = 0; i < bytes.length && out < total; i++) {
    acc = (acc << 8) | (bytes[i] ?? 0)
    bits += 8
    while (bits >= 6 && out < total) {
      bits -= 6
      nodes[out] = (acc >> bits) & 63
      out++
    }
  }
  return nodes
}

const NODES = unpack()

/** Character -> its index in the face, built once. Not consulted per frame. */
const INDEX = new Map<string, number>()
for (let i = 0; i < FACE_CHARS.length; i++) INDEX.set(FACE_CHARS[i] ?? '', i)

export const hasGlyph = (ch: string): boolean => INDEX.has(ch)

/**
 * The strokes of one glyph as [x0, y0, x1, y1, ...] in GRID units.
 *
 * Returns an empty view for a character the face does not carry — a missing glyph
 * draws nothing rather than throwing, because a crash in a render path is a worse
 * outcome than a gap in a label, and §102.6's provenance check is what actually
 * guarantees every shipped string is drawable.
 */
export const glyphStrokes = (ch: string): Int8Array => {
  const index = INDEX.get(ch)
  if (index === undefined) return new Int8Array(0)
  const from = FACE_OFFSETS[index] ?? 0
  const to = FACE_OFFSETS[index + 1] ?? from
  const out = new Int8Array((to - from) * 4)
  for (let s = from; s < to; s++) {
    const a = NODES[s * 2] ?? 0
    const b = NODES[s * 2 + 1] ?? 0
    const o = (s - from) * 4
    out[o] = a % GLYPH_COLUMNS
    out[o + 1] = (a / GLYPH_COLUMNS) | 0
    out[o + 2] = b % GLYPH_COLUMNS
    out[o + 3] = (b / GLYPH_COLUMNS) | 0
  }
  return out
}

/** Width of a string in grid columns. Layout measures; it never assumes. */
export const measure = (text: string): number =>
  text.length === 0 ? 0 : text.length * GLYPH_ADVANCE - 1

/**
 * Stroke one glyph into a surface at `scale` pixels per grid unit.
 *
 * One `stroke()` per glyph rather than one per segment: §39.2 found per-segment
 * trails costing ~2,450 draws where one path each costs ~306, and a letter is the
 * same shape of mistake at a hundred times the frequency.
 */
export const strokeGlyph = (
  surface: Surface,
  ch: string,
  x: number,
  y: number,
  scale: number,
): void => {
  const strokes = glyphStrokes(ch)
  if (strokes.length === 0) return
  surface.beginPath()
  for (let i = 0; i < strokes.length; i += 4) {
    const x0 = x + (strokes[i] ?? 0) * scale
    const y0 = y + (strokes[i + 1] ?? 0) * scale
    const x1 = x + (strokes[i + 2] ?? 0) * scale
    const y1 = y + (strokes[i + 3] ?? 0) * scale
    surface.moveTo(x0, y0)
    // A dot is a zero-length stroke; a round line cap makes it a dot rather than
    // nothing, which is why the tittle on an `i` is stored as a stroke at all.
    surface.lineTo(x1, y1)
  }
  surface.stroke()
}
