/**
 * The narrowest slice of a 2D context this game draws through.
 *
 * §14 puts rendering outside the simulation — "rendering may use whatever it likes,
 * it never feeds back into the sim" — and §145.4 makes `render/` a module that reads
 * a snapshot and never writes. Declaring the surface as an interface rather than
 * reaching for `CanvasRenderingContext2D` is what lets the draw budget (§39, §86.2,
 * §140.5) be MEASURED in a headless test instead of estimated in a document, which is
 * how §96.3 found both render profiles over ceiling from the pass that wrote them.
 */
export interface Surface {
  readonly width: number
  readonly height: number
  clear(): void
  beginPath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  stroke(): void
  setStroke(colour: string, width: number): void
  /**
   * §85.2 — heat is **the cell's fill**, so the board needs a filled rectangle and
   * the interface did not have one. It is the second of the board's seven channels
   * and the one §134.2 corrected: the fill renders the DERIVED region heat, the 3x3
   * sum every threshold is tested against, rather than the per-cell scalar it is
   * summed from — which is what makes the region, the seam, a corner's clipped
   * window and the overclocked contour draw themselves with no eighth channel.
   */
  setFill(colour: string): void
  fillRect(x: number, y: number, w: number, h: number): void
  /** The only text path in the game: a blit of a pre-rendered glyph or label. */
  blit(source: Surface, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number): void
  /** Draw calls issued since the last reset — §39.3 gates on this directly. */
  draws: number
  resetDraws(): void
}

/** A factory, so the atlas can allocate its own offscreen surfaces. */
export type SurfaceFactory = (width: number, height: number) => Surface
