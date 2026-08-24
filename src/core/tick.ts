/**
 * The simulation's clock, and a leaf (§145.4) — it imports nothing.
 *
 * These constants used to live in the generated loop, which put every simulation
 * module that needed a delta on an import of `src/gen/loop.ts` — and the loop
 * imports those same modules. §145.4 says `core/loop` is the ONE module permitted to
 * cross systems and the one nobody hand-writes; a game module importing it back is
 * the cycle that rule exists to forbid, and Node named it on the first run.
 *
 * §147.3 — every timing constant declares its layer. These are SIMULATION timings
 * and are therefore in ticks: §30's input buffer is six ticks rather than 100 ms
 * (§142.4), while §29's 40 ms audio retrigger floor is wall clock, because §14 puts
 * audio and rendering outside the simulation. Stated in ticks, that floor would
 * stretch to 200 ms on the board at 20% time and muffle the game for no reason.
 */

/** §142.4 — the fixed step. 60 Hz, and never a function of frame timing. */
export const TICK_MS = 1000 / 60

/** Seconds per tick. Everything a step integrates is multiplied by this. */
export const DT = TICK_MS / 1000

/** Ticks per second, which is the unit §9's constants are written against. */
export const TICKS_PER_SECOND = 60

/**
 * The accumulator's clamp (§3.B). Handhelds get their lids closed constantly, and a
 * clamp is the difference between resuming and fast-forwarding through the crush the
 * player was in the middle of.
 */
export const MAX_CATCHUP_TICKS = 5

/** A gap this long is not a hitch; §9 auto-pauses rather than simulating through it. */
export const PAUSE_GAP_MS = 1000

/** Seconds to ticks, rounded once and at the boundary. A constant converted at every
 *  use is a constant that eventually gets converted differently in two places. */
export const ticks = (seconds: number): number => Math.round(seconds * TICKS_PER_SECOND)
