/**
 * The Canvas 2D backend, behind §14's `Surface` interface.
 *
 * §39.3 budgets one session in phase 4 for a WebGL sprite-batch backend and calls it
 * PROBABLE rather than contingent: at 4 us per draw — entirely plausible for
 * additively-blended sprites on a Deck's integrated GPU — even §140.5's capped
 * 2,500-call frame is 10 ms against an 8 ms render budget. So the interface exists
 * from commit 6 and this is one implementation of it, not the renderer.
 *
 * Every draw is counted. §39.3 gates on draw calls MEASURED rather than inferred
 * from frame time, because frame time on a fast dev machine hides exactly the
 * problem the Deck will find — and §96.3 found both profiles over ceiling from the
 * pass that wrote them, by a budget nobody had compared to a cap.
 */
import type { Surface } from './surface.ts'

export interface CanvasLike {
  readonly width: number
  readonly height: number
  getContext(id: '2d'): Ctx | null
}

/** The slice of `CanvasRenderingContext2D` this game uses, and nothing more. */
export interface Ctx {
  clearRect(x: number, y: number, w: number, h: number): void
  fillRect(x: number, y: number, w: number, h: number): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  stroke(): void
  fill(): void
  drawImage(
    source: unknown,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number,
  ): void
  strokeStyle: string
  fillStyle: string
  lineWidth: number
  lineJoin: string
  lineCap: string
}

export interface Canvas2DSurface extends Surface {
  readonly canvas: CanvasLike
  readonly ctx: Ctx
  background: string
}

export const canvas2d = (canvas: CanvasLike, background: string): Canvas2DSurface => {
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2d context unavailable')
  // §12 — thick traces, bold silhouettes, no 1px detail. Round joins are what make a
  // stroked polygon read as a machined part at 720p through stream compression.
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  const surface: Canvas2DSurface = {
    canvas,
    ctx,
    background,
    get width() { return canvas.width },
    get height() { return canvas.height },
    draws: 0,
    clear() {
      ctx.fillStyle = surface.background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      // The clear is one draw and is counted, because a budget that excludes the
      // cheapest call is a budget that is not the frame.
      surface.draws++
    },
    beginPath() { ctx.beginPath() },
    moveTo(x, y) { ctx.moveTo(x, y) },
    lineTo(x, y) { ctx.lineTo(x, y) },
    stroke() { ctx.stroke(); surface.draws++ },
    setStroke(colour, width) { ctx.strokeStyle = colour; ctx.lineWidth = width },
    // A state change, not a draw: setting a colour costs nothing against §39.3's
    // ceiling and counting it would make the budget a function of how the caller
    // batches rather than of what reaches the screen.
    setFill(colour) { ctx.fillStyle = colour },
    fillRect(x, y, w, h) { ctx.fillRect(x, y, w, h); surface.draws++ },
    fill() { ctx.fill(); surface.draws++ },
    blit(source, sx, sy, sw, sh, dx, dy) {
      const from = source as Canvas2DSurface
      ctx.drawImage(from.canvas, sx, sy, sw, sh, dx, dy, sw, sh)
      surface.draws++
    },
    resetDraws() { surface.draws = 0 },
  }
  return surface
}
