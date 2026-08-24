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
}

export const stubSurface = (width: number, height: number): StubSurface => {
  const s: StubSurface = {
    width,
    height,
    segments: [],
    paths: 0,
    draws: 0,
    clear() {
      s.segments.length = 0
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
    blit() {
      s.draws++
    },
    resetDraws() {
      s.draws = 0
    },
  }
  return s
}
