/**
 * A counting stub of `render/surface.ts`.
 *
 * §39.3 gates on draw calls MEASURED DIRECTLY rather than inferred from frame time,
 * because frame time on a fast dev machine hides exactly the problem the Deck will
 * find — and §96.3 found both render profiles over ceiling from the pass that wrote
 * them, because the counts were estimates. A stub that counts is what makes the
 * budget a test instead of a paragraph.
 */
import type { Surface } from '../src/render/surface.ts'

export interface StubSurface extends Surface {
  /** Every segment issued, so a glyph's geometry can be asserted without a canvas. */
  readonly segments: number[]
  paths: number
  /** Every fill issued as `x, y, w, h, colour`, so §85.2's cell fills are checkable. */
  readonly fills: (number | string)[]
  /** Every filled PATH, as the colour it was filled with — §46.2's firing signature
   *  is a filled wedge, and "it was filled" is the half a draw count cannot see. */
  readonly filled: string[]
  /**
   * The segments of each STROKED path, separately, and the colour it was stroked in.
   *
   * `segments` is every segment the frame issued, flattened — which was enough while
   * the board stroked exactly one path (§A-053's core) and stopped being enough the
   * moment §85.2's substrate became an outline. A test that wants to say *the core is
   * symmetric about its own cell* cannot say it over a pile that also contains
   * twenty-five cells' worth of dashes. The picture got richer, so the instrument
   * reading it has to (§92.2 — the answer is a finer instrument, never a looser band).
   */
  readonly strokes: { readonly colour: string; readonly segments: number[] }[]
}

export const stubSurface = (width: number, height: number): StubSurface => {
  let fill = ''
  let stroke = ''
  let pending: number[] = []
  const s: StubSurface = {
    width,
    height,
    segments: [],
    strokes: [],
    fills: [],
    filled: [],
    paths: 0,
    draws: 0,
    clear() {
      s.segments.length = 0
      s.strokes.length = 0
      s.fills.length = 0
      s.filled.length = 0
      s.paths = 0
    },
    beginPath() {
      s.paths++
      pending = []
    },
    moveTo(x, y) {
      s.segments.push(x, y)
      pending.push(x, y)
    },
    lineTo(x, y) {
      s.segments.push(x, y)
      pending.push(x, y)
    },
    stroke() {
      s.strokes.push({ colour: stroke, segments: [...pending] })
      s.draws++
    },
    setStroke(colour) {
      stroke = colour
    },
    setFill(colour) {
      fill = colour
    },
    fill() {
      s.filled.push(fill)
      s.draws++
    },
    fillRect(x, y, w, h) {
      s.fills.push(x, y, w, h, fill)
      s.draws++
    },
    blit() {
      s.draws++
    },
    resetDraws() {
      s.draws = 0
    },
  }
  return s
}
