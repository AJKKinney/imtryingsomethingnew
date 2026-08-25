/**
 * The boot-time glyph and label atlas (§140.2, §147.1).
 *
 * §39.2 measured `fillText` at 10-50x a `drawImage`, because it re-runs layout and
 * rasterisation on every call — and then fixed twelve glyphs, the damage numbers,
 * leaving every other string in the game on `fillText`. §140.5 counted what that
 * became: 29 live text runs a frame in the bezel and the offer cards, worth
 * 290-1,450 draw-equivalents against a 103-draw margin, plus 480 more on the Hall.
 *
 * So every string is rasterised once, here, and blitted afterwards.
 *
 * WHAT IS IN IT, and why the split is not arbitrary (§147.1). Glyphs are cached at
 * all three of §101.4's type scales; §102.2's 131 labels are cached as WHOLE WORDS at
 * the middle scale only. Measured, that is 353 KB of glyphs plus 452 KB of labels =
 * ~0.8 MB, which is the figure §147.1 derived and the reason the atlas stays bounded
 * in every locale: a glyph set grows with the script and a label does not, because a
 * Chinese label is two to four characters where an English one is eight.
 *
 * A label asked for at a scale it was not cached at falls back to per-glyph blits,
 * which is still one `drawImage` per character and never a `fillText`.
 */
import { GLYPH_ADVANCE, GLYPH_COLUMNS, GLYPH_ROWS, hasGlyph, measure, strokeGlyph } from './face.ts'
import type { Surface, SurfaceFactory } from './surface.ts'

/** §101.4's type scale, in pixels per grid unit. */
export const SCALES = [1, 2, 3] as const
export type Scale = (typeof SCALES)[number]

/**
 * Labels are cached whole at this scale; every other size composes from glyph blits.
 *
 * ONE scale, and the smallest, because the budget is real: 131 labels whole at scale
 * 2 measures 1.6 MB against §147.1's 0.8 MB for the whole atlas, and at scale 3 it is
 * 3.6 MB. At scale 1 the atlas measures ~0.75 MB, which is the figure §147.1 derived.
 *
 * Nothing is lost at the larger sizes, for a reason §140.5 supplies: a surface that
 * changes on an EVENT renders offscreen and blits, so the bezel's chrome — labels and
 * all — is already one blit rather than one per label. Whole-word caching is a
 * draw-count optimisation for labels drawn directly, and those live in the HUD, at
 * the smallest size. A larger label costs one `drawImage` per character and never a
 * `fillText`, which is the rule §147.1 actually states.
 */
export const LABEL_SCALE: Scale = 1

export interface Cell {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

export interface Atlas {
  readonly surface: Surface
  readonly cells: ReadonlyMap<string, Cell>
  /** Pixels of atlas actually used, so §147.1's budget is measured and not asserted. */
  readonly usedPixels: number
}

const key = (text: string, scale: number): string => `${scale}:${text}`

/**
 * THE MOAT, and it is the reason every word in the game rendered with a stray tick
 * after it.
 *
 * A stroke is centred on its path, so a glyph inked at column 0 paints half a line
 * width to the LEFT of column 0 — outside its own packed cell and into whatever the
 * shelf packer put beside it. Every blit then carried a sliver of its neighbour, and
 * because the packer sorts by height rather than by meaning, which sliver a glyph
 * picked up was arbitrary: an `I` acquired a stem and read as an `E`, an `O` acquired
 * one and read as a `D`, and every whole-word label ended in a mark nobody wrote.
 *
 * The fix costs no pixels, which is why it is an inset rather than padding: §140.2's
 * grid is 7 columns wide and the ink occupies 0..4 (the advance is 6), so every cell
 * already carries three columns of right-hand slack. Shifting the ink right by half a
 * stroke width uses slack that was already paid for, and §147.1's 0.8 MB — measured
 * rather than asserted, per §96.3 — does not move at all.
 */
const gutter = (scale: number): number => Math.ceil(Math.max(1, scale * 0.75) / 2)

/**
 * A shelf packer. Rows of uniform height, filled left to right — the simplest thing
 * that wastes little on a set this uniform, and it runs once.
 */
export const buildAtlas = (
  make: SurfaceFactory,
  labels: readonly string[],
  width = 1024,
): Atlas => {
  interface Item { readonly text: string; readonly scale: Scale; readonly w: number; readonly h: number }
  const items: Item[] = []

  for (const scale of SCALES) {
    for (const ch of glyphSet()) {
      items.push({ text: ch, scale, w: GLYPH_COLUMNS * scale, h: GLYPH_ROWS * scale })
    }
  }
  for (const label of labels) {
    items.push({
      text: label,
      scale: LABEL_SCALE,
      w: (measure(label) + 1) * LABEL_SCALE,
      h: GLYPH_ROWS * LABEL_SCALE,
    })
  }

  // Tallest first, so shelves are packed rather than fragmented by a short row
  // landing under a tall one. Stable on the original order for equal heights, so the
  // atlas is byte-identical between runs — which a snapshot test depends on.
  const order = items.map((item, i) => ({ item, i }))
  order.sort((a, b) => b.item.h - a.item.h || a.i - b.i)

  const cells = new Map<string, Cell>()
  let penX = 0
  let penY = 0
  let shelfHeight = 0
  let used = 0
  for (const { item } of order) {
    if (penX + item.w > width) {
      penX = 0
      penY += shelfHeight
      shelfHeight = 0
    }
    cells.set(key(item.text, item.scale), { x: penX, y: penY, w: item.w, h: item.h })
    penX += item.w
    if (item.h > shelfHeight) shelfHeight = item.h
    used += item.w * item.h
  }
  const height = penY + shelfHeight

  const surface = make(width, height)
  surface.clear()
  for (const { item } of order) {
    const cell = cells.get(key(item.text, item.scale))
    if (cell === undefined) continue
    const width = Math.max(1, item.scale * 0.75)
    const inset = gutter(item.scale)
    surface.setStroke('#ffffff', width)
    for (let i = 0; i < item.text.length; i++) {
      strokeGlyph(
        surface, item.text[i] ?? ' ',
        cell.x + inset + i * GLYPH_ADVANCE * item.scale, cell.y, item.scale,
      )
    }
  }
  surface.resetDraws()
  return { surface, cells, usedPixels: used }
}

/** Every character the face carries. Built once; never iterated per frame. */
const glyphSet = (): string[] => {
  const out: string[] = []
  for (let code = 32; code < 127; code++) {
    const ch = String.fromCharCode(code)
    if (hasGlyph(ch)) out.push(ch)
  }
  for (const ch of ['·', '→', '×', '−', '°']) if (hasGlyph(ch)) out.push(ch)
  return out
}

/**
 * Draw a string. Returns the number of draw calls it cost, because §39.3 gates on
 * draw calls measured directly rather than inferred from frame time — frame time on
 * a fast dev machine hides exactly the problem the Deck will find.
 */
export const drawText = (
  target: Surface,
  atlas: Atlas,
  text: string,
  scale: Scale,
  x: number,
  y: number,
): number => {
  const whole = atlas.cells.get(key(text, scale))
  if (whole !== undefined) {
    target.blit(atlas.surface, whole.x, whole.y, whole.w, whole.h, x, y)
    return 1
  }
  let draws = 0
  for (let i = 0; i < text.length; i++) {
    const cell = atlas.cells.get(key(text[i] ?? ' ', scale))
    if (cell === undefined) continue
    target.blit(atlas.surface, cell.x, cell.y, cell.w, cell.h, x + i * GLYPH_ADVANCE * scale, y)
    draws++
  }
  return draws
}
