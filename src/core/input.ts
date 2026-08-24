/**
 * §142.5 step 2 — consume the recorded input snapshot.
 *
 * §14's whole payoff is that the world is a pure function of (seed, input log), so
 * this is the one place intent enters the simulation, and it is recorded on the way
 * in. Replays, §16's crash codes, §66.4's leaderboard verification, §124.5's PAR and
 * §80.2's identical daily are all the same property read from different angles.
 *
 * The host writes `world.live` whenever a device changes; this samples it ONCE PER
 * TICK. That distinction is what makes the recording complete: a run at 20% time
 * samples five times less often than one at full speed, and the log is what happened
 * rather than what a frame happened to observe.
 */
import type { InputFrame, World } from './world.ts'

export const STEP = 'input'
export const WRITES: readonly string[] = ['input', 'inputLog']

/** Three numbers a tick: two axes and a dash bit. */
export const FRAME_WORDS = 3

export const emptyInput = (): InputFrame => ({ moveX: 0, moveY: 0, dash: false })

export const step = (world: World): void => {
  const { live, input } = world
  input.moveX = live.moveX
  input.moveY = live.moveY
  input.dash = live.dash
  world.inputLog.push(live.moveX, live.moveY, live.dash ? 1 : 0)
  // A dash is an edge, not a state: holding the key must not queue five dashes at
  // 20% time. §30's six-tick buffer belongs here when the buffer arrives; consuming
  // the edge is what the buffer will smooth.
  live.dash = false
}

/** Replay: drive the world from a recorded log rather than from a device. */
export const frameAt = (log: readonly number[], tick: number): InputFrame => {
  const o = tick * FRAME_WORDS
  return { moveX: log[o] ?? 0, moveY: log[o + 1] ?? 0, dash: (log[o + 2] ?? 0) === 1 }
}
