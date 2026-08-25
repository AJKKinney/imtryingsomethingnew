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
}

export const stubSurface = (width: number, height: number): StubSurface => {
  let fill = ''
  const s: StubSurface = {
    width,
    height,
    segments: [],
    fills: [],
    filled: [],
    paths: 0,
    draws: 0,
    clear() {
      s.segments.length = 0
      s.fills.length = 0
      s.filled.length = 0
      s.paths = 0
    },
    beginPath() {
      s.paths++
    },
    moveTo(x, y) {
      s.segments.push(x, y)
    },
    lineTo(x, y) {
      s.segments.push(x, y)
    },
    stroke() {
      s.draws++
    },
    setStroke() {
      /* colour and width do not change the count */
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
