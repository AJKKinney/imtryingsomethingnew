/**
 * §41.1's two tiers, and §16's version envelope around both.
 *
 * §41.1 costed what "compact" actually means: a 20-minute run is 72,000 ticks, and
 * one byte per tick is a **93.8 KB** base64 paste after every run. Delta-encoded it
 * put the figure at 14.5 KB, and RLE with varints on top at **~2,500 characters**.
 *
 * MEASURED HERE, THAT LAST NUMBER IS WRONG BY ROUGHLY EIGHT TIMES. At §41.1's own
 * event rate — ~3,700 input changes across a run — the encoder below produces
 * **16,900 characters for a smooth stick, 22,000 for a keyboard and 22,600 for
 * random worst-case input**. §41.1 claimed "~6x" from RLE and varints on top of
 * delta encoding, which would need half a byte per event; a run is a varint count
 * plus two zigzag varint deltas, and even a held key costs three bytes.
 *
 * The DECISION §41.1 made on that number is unaffected and in fact strengthened:
 * two tiers, with the user pasting §41.1's ~190-character SUMMARY and the full form
 * behind a button. What changes is that the full form is **a file rather than a
 * paste** — 20 KB is three hundred lines of a chat message — so the playtest build
 * offers it as a download. §148.1 already scopes the replay-code surface to the
 * playtest target, so no shipped product grows a surface for it.
 *
 * §65.1 then added the third tier and kept this one private: what players SHARE is
 * the 79-character board (§133.2), because a ~2,425-character replay does not fit in
 * a Discord message. This code is the channel between the playtester and me.
 *
 * The envelope is §66.2's, and it is the same on every code the game imports: a
 * version byte, the content hash, and a CRC — and **reject, never clamp**. The
 * simulation is deterministic, so a silently-clamped field does not throw; it
 * produces a run that differs from the sender's, deterministically, forever.
 */
import { runTick } from '../gen/loop.ts'
import { createWorld, type World } from './world.ts'
import { FRAME_WORDS, AXIS_STEPS } from './input.ts'
import { hashOf } from './hash.ts'

export const REPLAY_VERSION = 1

export interface Replay {
  readonly version: number
  readonly contentHash: string
  readonly seed: number
  readonly ticks: number
  /** RLE runs of (count, moveX byte, moveY byte, dash bit). */
  readonly runs: Int16Array
}

/**
 * Delta plus run-length: input is held far more often than it changes — §41.1
 * measured ~3,700 events in a 72,000-tick run — so the compression is a fact about
 * hands rather than a clever encoding.
 */
export const encode = (seed: number, log: readonly number[], contentHash: string): Replay => {
  const ticks = Math.floor(log.length / FRAME_WORDS)
  const runs: number[] = []
  let count = 0
  let cx = 0
  let cy = 0
  let cd = 0
  for (let t = 0; t < ticks; t++) {
    const x = Math.round((log[t * FRAME_WORDS] ?? 0) * AXIS_STEPS)
    const y = Math.round((log[t * FRAME_WORDS + 1] ?? 0) * AXIS_STEPS)
    const d = (log[t * FRAME_WORDS + 2] ?? 0) === 1 ? 1 : 0
    // A dash is an EDGE (§142.5 step 2), so it never joins a run: folding one into a
    // repeat count would replay a single press as a held key.
    if (count > 0 && x === cx && y === cy && d === 0 && cd === 0 && count < 32_000) {
      count++
      continue
    }
    if (count > 0) runs.push(count, cx, cy, cd)
    count = 1
    cx = x
    cy = y
    cd = d
  }
  if (count > 0) runs.push(count, cx, cy, cd)
  return { version: REPLAY_VERSION, contentHash, seed, ticks, runs: Int16Array.from(runs) }
}

export const decode = (r: Replay): number[] => {
  const log: number[] = []
  for (let i = 0; i < r.runs.length; i += 4) {
    const count = r.runs[i] ?? 0
    const x = (r.runs[i + 1] ?? 0) / AXIS_STEPS
    const y = (r.runs[i + 2] ?? 0) / AXIS_STEPS
    const d = r.runs[i + 3] ?? 0
    for (let n = 0; n < count; n++) log.push(x, y, d)
  }
  return log
}

export type ReplayFailure =
  | { readonly ok: false; readonly reason: 'version'; readonly detail: string }
  | { readonly ok: false; readonly reason: 'content'; readonly detail: string }

export type ReplayResult = { readonly ok: true; readonly world: World } | ReplayFailure

/**
 * Drive a fresh world from a recorded log. Nothing here reads a device or a clock —
 * that is the whole property, and it is why §63.5's sweeps shard across sixteen CI
 * jobs for free and why §124.5's par is bit-identical on every machine.
 */
export const replay = (r: Replay, contentHash: string): ReplayResult => {
  if (r.version !== REPLAY_VERSION) {
    return { ok: false, reason: 'version', detail: `replay v${r.version}, build v${REPLAY_VERSION}` }
  }
  if (r.contentHash !== contentHash) {
    // §16 — shown as a static board snapshot rather than played back, never loaded
    // and quietly wrong. A replay that silently diverges is worse than one refused.
    return { ok: false, reason: 'content', detail: `recorded against ${r.contentHash}` }
  }
  const log = decode(r)
  const world = createWorld(r.seed)
  for (let t = 0; t < r.ticks; t++) {
    const o = t * FRAME_WORDS
    world.live.moveX = log[o] ?? 0
    world.live.moveY = log[o + 1] ?? 0
    world.live.dash = (log[o + 2] ?? 0) === 1
    runTick(world)
  }
  return { ok: true, world }
}

/**
 * The bytes a replay code costs, measured rather than estimated.
 *
 * Each run is a varint of `(count << 1) | dash`, then two zigzag varints of the axis
 * DELTAS from the previous run — so a held key is one byte, a small stick adjustment
 * is three, and a maximal reversal is five. §41.1 costed this family at "~6x on top
 * of delta encoding" and §149.6's own rule says a cost is measured before it is
 * committed to; `tests/unit/replay.test.ts` reports the three shapes it takes.
 */
export const encodedBytes = (r: Replay): number => {
  let bytes = 0
  let px = 0
  let py = 0
  for (let i = 0; i < r.runs.length; i += 4) {
    const count = r.runs[i] ?? 0
    const x = r.runs[i + 1] ?? 0
    const y = r.runs[i + 2] ?? 0
    const d = r.runs[i + 3] ?? 0
    bytes += varintBytes(count * 2 + d) + varintBytes(zigzag(x - px)) + varintBytes(zigzag(y - py))
    px = x
    py = y
  }
  return bytes
}

const zigzag = (v: number): number => (v < 0 ? -v * 2 - 1 : v * 2)

const varintBytes = (v: number): number => {
  let n = 1
  let rest = Math.floor(v / 128)
  while (rest > 0) {
    n++
    rest = Math.floor(rest / 128)
  }
  return n
}

/** Base64 is 4 characters per 3 bytes, which is the unit §41.1 counts the paste in. */
export const codeLength = (r: Replay): number => Math.ceil(encodedBytes(r) / 3) * 4

/**
 * §14's world hash. Every top-level number, in a stated order — never object-key
 * order, which is not an order at all.
 */
export const worldHash = (w: World): string => {
  const words: number[] = [
    w.tick, w.rng.state,
    w.player.x, w.player.y, w.player.vx, w.player.vy,
    w.player.integrity, w.player.iframes, w.player.dashCooldown, w.player.dashTicks,
    w.player.facingX, w.player.facingY,
    w.arc.cooldown, w.spawnDebt, w.kills, w.contactDamage,
    w.paused ? 1 : 0, w.over ? 1 : 0,
    w.enemies.count, w.enemies.nextId, w.enemies.refused,
  ]
  for (let i = 0; i < w.enemies.count; i++) {
    const e = w.enemies.items[i]
    if (e === undefined) continue
    words.push(e.id, e.kind, e.x, e.y, e.vx, e.vy, e.hp, e.flags)
  }
  return hashOf(words)
}
