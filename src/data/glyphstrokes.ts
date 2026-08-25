import type { ProvenanceRecord } from './meta.ts'

/**
 * The stroke face (§140.2) — the source, from which `tools/emit.ts` packs
 * `src/gen/strokefont.ts`.
 *
 * §139.1 claims zero asset bytes and §18 rests the whole disclosure position on all
 * art being algorithmic, and both were audited for a hundred and thirty-nine passes
 * against the art INSIDE the simulation — which is the art the mechanics passes were
 * interested in. The letterforms every one of those passes was written in got
 * nothing, in a game that renders 131 labels, ~640 words of prose and a 120-entry
 * graveyard.
 *
 * A generated face is not the cheap option forced by having no artist. §46.2 fixes
 * the machine's visual language as rigid, on-grid and mechanical; §85.2 constrains
 * every component glyph to symmetric, closed and axis-aligned; §133.4 names the voice
 * as deadpan machine telemetry. A grid-drawn stencil is the same rule applied to the
 * letters, and it is the reason the wordmark can be drawn as conduit runs (§140.4).
 *
 * THE GRID. 7 columns x 9 rows, so a node is `row * 7 + col` in 0..62 — six bits,
 * which is where §140.2's "63 addressable points" comes from. Metrics: row 1 is the
 * cap top and ascender, row 3 the x-height, row 7 the baseline, row 8 the descender,
 * and row 0 is left free for the diacritics §141.1's Latin-ext set will need.
 * Columns 0..4 hold the glyph and the advance is 6.
 *
 * THE NOTATION. Each entry is a list of POLYLINES, and each polyline is a run of
 * `CR` tokens — column then row, one digit each. `'07 03 11 31 43 47'` is the letter
 * A: up the left leg, chamfer, across the top, chamfer, down the right. It is
 * verbose on purpose: §147.2's rule is that the readable artifact is the source, and
 * a source nobody can edit is a source that gets regenerated wrongly.
 *
 * This is the LATIN set. §141.1 adds 66 Cyrillic and 40 Latin-ext glyphs for 954 more
 * bytes when localization ships at phase 6, taking the table to 206 glyphs and
 * 1,854 bytes; only zh-Hans needs a licensed face, and §147.1 keeps it off the atlas.
 */
export const GLYPH_COLUMNS = 7
export const GLYPH_ROWS = 9

/** Baseline row, and the advance in grid columns. */
export const GLYPH_BASELINE = 7
export const GLYPH_ADVANCE = 6

export const GLYPHS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  ' ': [],
  '!': ['21 25', '27 27'],
  '"': ['11 12', '31 32'],
  '#': ['12 16', '32 36', '03 43', '05 45'],
  '$': ['21 28', '41 11 03 33 45 37 07'],
  '%': ['11 11', '37 37', '41 07'],
  '&': ['41 12 21 32 06 17 37 47'],
  '\'': ['21 22'],
  '(': ['31 12 16 37'],
  ')': ['11 32 36 17'],
  '*': ['12 36', '32 16', '04 44'],
  '+': ['04 44', '22 26'],
  ',': ['27 28'],
  '-': ['04 44'],
  '.': ['27 27'],
  '/': ['07 41'],
  '0': ['11 31 42 46 37 17 06 02 11', '33 15'],
  '1': ['02 21 27', '07 47'],
  '2': ['02 11 31 42 43 07 47'],
  '3': ['01 41 24', '24 45 46 37 17 06'],
  '4': ['31 05 45', '31 37'],
  '5': ['41 01 03 33 45 46 37 17 06'],
  '6': ['31 11 02 06 17 37 46 45 34 04'],
  '7': ['01 41 17'],
  '8': ['11 31 42 43 34 14 03 02 11', '34 45 46 37 17 06 05 14'],
  '9': ['17 37 46 42 31 11 02 03 14 44'],
  ':': ['23 23', '27 27'],
  ';': ['23 23', '27 28'],
  '<': ['42 04 46'],
  '=': ['03 43', '05 45'],
  '>': ['12 44 16'],
  '?': ['02 11 31 42 23 25', '27 27'],
  '@': ['41 11 02 06 17 47', '24 34 35 25 24'],
  'A': ['07 03 11 31 43 47', '05 45'],
  'B': ['01 07', '01 31 42 43 34 04', '34 45 46 37 07'],
  'C': ['41 11 02 06 17 47'],
  'D': ['01 07', '01 31 42 46 37 07'],
  'E': ['41 01 07 47', '04 34'],
  'F': ['41 01 07', '04 34'],
  'G': ['41 11 02 06 17 37 46 44 24'],
  'H': ['01 07', '41 47', '04 44'],
  'I': ['01 41', '21 27', '07 47'],
  'J': ['21 41', '31 36 27 17 06'],
  'K': ['01 07', '41 04 47'],
  'L': ['01 07 47'],
  'M': ['07 01 24 41 47'],
  'N': ['07 01 47 41'],
  'O': ['11 31 42 46 37 17 06 02 11'],
  'P': ['01 07', '01 31 42 43 34 04'],
  'Q': ['11 31 42 46 37 17 06 02 11', '35 47'],
  'R': ['01 07', '01 31 42 43 34 04', '24 47'],
  'S': ['41 11 02 03 14 34 45 46 37 07'],
  'T': ['01 41', '21 27'],
  'U': ['01 06 17 37 46 41'],
  'V': ['01 27 41'],
  'W': ['01 07 24 47 41'],
  'X': ['01 47', '41 07'],
  'Y': ['01 24 41', '24 27'],
  'Z': ['01 41 07 47'],
  '[': ['31 11 17 37'],
  '\\': ['01 47'],
  ']': ['11 31 37 17'],
  '^': ['03 21 43'],
  '_': ['08 48'],
  '`': ['11 22'],
  'a': ['03 33 44 47', '44 37 17 06 05 14 44'],
  'b': ['01 07', '04 34 45 46 37 07'],
  'c': ['33 13 04 06 17 37'],
  'd': ['41 47', '43 13 04 06 17 47'],
  'e': ['05 45 44 33 13 04 06 17 37'],
  'f': ['42 31 21 12 17', '03 33'],
  'g': ['43 13 04 05 16 46', '43 47 38 18 07'],
  'h': ['01 07', '04 14 34 44 47'],
  'i': ['21 21', '23 27'],
  'j': ['31 31', '33 37 28 18 07'],
  'k': ['01 07', '43 05', '04 47'],
  'l': ['11 21 27 37'],
  'm': ['03 07', '04 14 24 27', '24 34 44 47'],
  'n': ['03 07', '04 14 34 44 47'],
  'o': ['13 33 44 46 37 17 06 04 13'],
  'p': ['03 08', '03 33 44 46 37 07'],
  'q': ['43 48', '43 13 04 06 17 47'],
  'r': ['03 07', '04 13 33 44'],
  's': ['43 13 04 15 35 46 37 07'],
  't': ['11 16 27 37', '02 32'],
  'u': ['03 06 17 37 46 43', '43 47'],
  'v': ['03 27 43'],
  'w': ['03 07 25 47 43'],
  'x': ['03 47', '43 07'],
  'y': ['03 25 43', '25 27 18 08'],
  'z': ['03 43 07 47'],
  '{': ['31 21 14 04 14 27 37'],
  '|': ['21 28'],
  '}': ['11 21 34 44 34 27 17'],
  '~': ['05 14 34 43'],
  '\u00b7': ['25 25'],
  '\u2192': ['05 45', '33 45 37'],
  '\u00d7': ['13 37', '33 17'],
  '\u2212': ['05 45'],
  '\u00b0': ['12 22 23 13 12'],
})

export const provenance: ProvenanceRecord = {
  GLYPH_COLUMNS: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.2', derivedFrom: 'definition' },
  GLYPH_ROWS: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.2', derivedFrom: 'definition' },
  GLYPH_BASELINE: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.2', derivedFrom: 'definition' },
  GLYPH_ADVANCE: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.2', derivedFrom: 'definition' },
  GLYPHS: { kind: 'authored', system: 'render', axes: ['provenance'], source: '§140.2, §141.1', derivedFrom: 'definition' },
}
