/**
 * §15's seeded radial grammar — every silhouette in the game, and zero asset bytes.
 *
 * One generator produces both factions and §46.2's friend/foe language IS the
 * constraint on it: your machine is **symmetric, closed, axis-aligned**; the
 * corruption is **broken symmetry, open, jagged**. That is not a saving. In a screen
 * holding 570 entities and hundreds of projectiles, telling your shots from theirs is
 * a playability question rather than a style one, and it is carried on TWO channels
 * at once — form here, hue in the palette — so that the read survives protanopia,
 * deuteranopia and, where the cyan/amber axis fails, tritanopia.
 *
 * §12 forbids 1px detail: this is what a stream at 720p and a handheld at arm's
 * length can both resolve, and what §140's draw budget can afford at one stroked
 * path per entity (§39.2) rather than one per segment.
 */
import { TAU, cos, sin } from '../core/fixedmath.ts'
import { nextFloat, rng, type Rng } from '../core/rng.ts'

export interface Silhouette {
  /** Flat (x, y) pairs on a unit circle, closed by the renderer if `closed`. */
  readonly points: Float64Array
  /** §46.2 — the faction, drawn as a property of the form rather than of the colour. */
  readonly closed: boolean
  /** An optional concentric inner ring, the grammar's one recursion. */
  readonly inner: Float64Array | undefined
}

/** §15 — symmetry order. Two through six, so no silhouette reads as a circle. */
export const SYMMETRY_ORDERS = [2, 3, 4, 5, 6] as const

export const MIN_RADIUS = 0.55
export const MAX_RADIUS = 1

/**
 * Vertices per wedge. Three is the smallest count that can turn a corner, and a
 * corner is what makes a silhouette a shape rather than a blob.
 */
export const VERTICES_PER_WEDGE = 3

const wedge = (r: Rng, count: number, jagged: boolean): number[] => {
  const radii: number[] = []
  for (let i = 0; i < count; i++) {
    const t = nextFloat(r)
    // The corruption's radii swing to both bounds; the machine's stay in the upper
    // half, which is what makes one read as a mechanism and the other as damage.
    radii.push(jagged ? MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS) : MAX_RADIUS - t * 0.25)
  }
  return radii
}

/**
 * Deterministic in the seed alone (§14), so a silhouette is a pure function of an
 * entity's identity and can be regenerated rather than stored — which is what makes
 * §104.4's 39-byte wreck payload a machine rather than a picture of one.
 */
export const silhouette = (seed: number, friendly: boolean, rare = false): Silhouette => {
  const r = rng(seed)
  const order = SYMMETRY_ORDERS[(nextFloat(r) * SYMMETRY_ORDERS.length) | 0] ?? 4
  const per = VERTICES_PER_WEDGE
  const radii = wedge(r, per, !friendly)

  const total = order * per
  const points = new Float64Array(total * 2)
  for (let k = 0; k < order; k++) {
    for (let i = 0; i < per; i++) {
      const n = k * per + i
      const angle = (n / total) * TAU
      // §15 mirrors the wedge around the symmetry, so the machine repeats exactly.
      // The corruption's asymmetry is a per-vertex perturbation of the same wedge,
      // which is why the two factions are one generator and one constraint.
      const jitter = friendly ? 0 : (nextFloat(r) - 0.5) * 0.35
      const radius = (radii[i] ?? 1) + jitter
      points[n * 2] = cos(angle) * radius
      points[n * 2 + 1] = sin(angle) * radius
    }
  }

  // §15's rare variant takes the asymmetric branch with an extra ring — and §132.2
  // made that branch mean something: the rare variant IS the elite, so the thing
  // that looks different is now the thing that is worth five times as much.
  let inner: Float64Array | undefined
  if (rare || nextFloat(r) < 0.35) {
    inner = new Float64Array(total * 2)
    const scale = 0.35 + nextFloat(r) * 0.2
    for (let n = 0; n < total; n++) {
      inner[n * 2] = (points[n * 2] ?? 0) * scale
      inner[n * 2 + 1] = (points[n * 2 + 1] ?? 0) * scale
    }
  }

  return { points, closed: friendly, inner }
}
