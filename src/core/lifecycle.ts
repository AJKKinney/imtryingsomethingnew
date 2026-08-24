/**
 * §142.5 step 3 — the pause check.
 *
 * §3.B is blunt about why this is phase 1 rather than polish: the primary venue is a
 * handheld and handhelds get their lids closed constantly. The accumulator clamp
 * itself lives in `advance` (§142.4), because it is a property of the GATE rather
 * than of a tick; what lives here is the run's own paused flag, which is a recorded
 * input like any other and therefore has to be a step rather than a host callback.
 *
 * The distinction matters for §14. A pause driven from outside the simulation is an
 * unrecorded input, and an unrecorded input is a replay that does not reproduce —
 * §26's silent desync arriving through the one event the player triggers most.
 */
import type { World } from './world.ts'

export const STEP = 'lifecycle'
export const WRITES: readonly string[] = ['paused', 'resumeGap']

export const step = (world: World): void => {
  // A gap detected by the gate is surfaced for exactly one tick, so the host can
  // show §16's resume affordance without the simulation carrying UI state.
  if (world.resumeGap > 0) world.resumeGap -= 1
}
