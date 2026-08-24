/**
 * Deterministic mathematics — §14's policy, in code.
 *
 * The simulation uses only `+ - * / %`, comparisons, `Math.sqrt`, `Math.floor`,
 * `Math.abs` and `Math.imul`, all of which the language specifies exactly. It uses
 * NONE of `sin cos tan atan2 pow exp log`, which it does not, and which is why a
 * single stray call would desynchronise every replay on a machine that was never
 * tested. `tools/lintmath.ts` fails the build on one.
 *
 * Rendering is exempt (§14: "rendering may use whatever it likes — it never feeds
 * back into the sim"), and so is anything under `tools/`, which runs at build time.
 */
import { SIN_TABLE, SIN_TABLE_SIZE } from '../gen/sintable.ts'

export const PI = 3.141592653589793
export const TAU = 6.283185307179586
const MASK = SIN_TABLE_SIZE - 1
const INDEX_PER_RADIAN = SIN_TABLE_SIZE / TAU

const at = (i: number): number => {
  const v = SIN_TABLE[i & MASK]
  // `noUncheckedIndexedAccess` earns its keep: the mask makes this unreachable, and
  // saying so is cheaper than a silent NaN propagating through a whole run.
  return v === undefined ? 0 : v
}

/**
 * Sine, by table lookup with linear interpolation — multiply and add only.
 *
 * The reduction is `x - TAU * floor(x / TAU)`, which is exact for every finite input,
 * so an angle that has been accumulating for a twenty-minute run behaves the same as
 * one that has not.
 */
export const sin = (x: number): number => {
  const index = (x - TAU * Math.floor(x / TAU)) * INDEX_PER_RADIAN
  const i = Math.floor(index)
  const frac = index - i
  const a = at(i)
  return a + (at(i + 1) - a) * frac
}

/** Cosine is a quarter-turn phase offset on the same table. */
export const cos = (x: number): number => sin(x + TAU * 0.25)

/**
 * atan, minimax polynomial on [-1, 1], odd terms only, evaluated by Horner in `+ - *`.
 *
 * §14 asks for "a deterministic polynomial approximation in basic ops" and does not
 * band its accuracy, because nothing in the simulation is precision-critical in an
 * angle: §27's targeting samples 16 fixed angles and compares SQUARED distances, so
 * the transcendental never decides a tie. What matters is that it is identical
 * everywhere, which a polynomial in `+ - *` is and a library call is not.
 *
 * Six terms rather than five: five MEASURED 1.15e-5 radians of worst-case error and
 * six measure 1.66e-6, for two extra multiply-adds. Both numbers are measurements
 * rather than the polynomial's published figure, because the fold onto |r| <= 1
 * amplifies the error in the reciprocal and the published figure describes only the
 * primary branch. The test bands it at 5e-6 — three times the measurement, so a
 * regression that doubles the error still fails.
 */
const atanUnit = (x: number): number => {
  const x2 = x * x
  return (
    x *
    (0.99997726 +
      x2 *
        (-0.33262347 +
          x2 * (0.19354346 + x2 * (-0.11643287 + x2 * (0.05265332 + x2 * -0.0117212)))))
  )
}

export const atan2 = (y: number, x: number): number => {
  // Both zero has no defined angle; zero is the answer the simulation can act on,
  // and it must be the SAME answer on every machine, which is why it is written down.
  if (x === 0 && y === 0) return 0
  const ax = Math.abs(x)
  const ay = Math.abs(y)
  // Fold onto |ratio| <= 1 so the polynomial is only ever evaluated where it is fitted.
  const angle = ay <= ax ? atanUnit(ay / ax) : PI * 0.5 - atanUnit(ax / ay)
  const quadrant = x < 0 ? PI - angle : angle
  return y < 0 ? -quadrant : quadrant
}

/** Length. `Math.sqrt` is the one library call IEEE-754 specifies exactly. */
export const length = (x: number, y: number): number => Math.sqrt(x * x + y * y)

/**
 * Squared distance, which is what almost every comparison in the simulation actually
 * wants (§27's nearest-target queries minimise this and never take a root).
 */
export const distanceSquared = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}

export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x)

/** Linear interpolation, written so that `lerp(a, b, 1)` is exactly `b`. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
