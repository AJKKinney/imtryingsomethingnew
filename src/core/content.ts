/**
 * §16's content hash — the fingerprint of every number the simulation runs on.
 *
 * A replay recorded on v0.1 will not reproduce on v0.2 if balance changed, and
 * pretending otherwise is how a "watch this run" feature becomes a liar. So every
 * replay, every snapshot and every share code carries this, and a mismatch is
 * REFUSED with a legible message rather than loaded and quietly wrong.
 *
 * It is computed from `src/data/` rather than declared, for the reason §63.3 gives:
 * a session that changes a number changes it in exactly one place, and a hash a
 * human maintains is a hash that goes stale on the commit that mattered.
 *
 * §102.3 adds the one thing that is NOT allowed to move it — the machine-name
 * namespace hash is folded in here, because a 2-byte share index must resolve to the
 * same name in 1.0 forever and a namespace change is a breaking change.
 */
import { PARTITIONS } from '../data/index.ts'
import { hashOf } from './hash.ts'

/**
 * Walks the data modules in the order `PARTITIONS` declares — never object-key
 * order, which §14 forbids in anything order-sensitive and which a hash is.
 */
export const contentHash = (): string => {
  const words: number[] = []
  for (const part of PARTITIONS) {
    for (const ch of part.name) words.push(ch.charCodeAt(0))
    // The provenance record is the authoritative list of exported names, and it is
    // itself checked by A-004 — so a constant that is not in it is already a build
    // failure and cannot slip past this by being unhashed.
    const names = Object.keys(part.provenance).sort()
    for (const name of names) {
      for (const ch of name) words.push(ch.charCodeAt(0))
      feedValue(words, (part.module as Record<string, unknown>)[name], 0)
    }
  }
  return hashOf(words)
}

const MAX_DEPTH = 6

const feedValue = (words: number[], value: unknown, depth: number): void => {
  if (depth > MAX_DEPTH) return
  if (typeof value === 'number') {
    words.push(value)
    return
  }
  if (typeof value === 'boolean') {
    words.push(value ? 1 : 0)
    return
  }
  if (typeof value === 'string') {
    for (const ch of value) words.push(ch.charCodeAt(0))
    return
  }
  if (typeof value === 'function') {
    // A derived quantity is a function of the constants above it, so hashing its
    // source would fire on a comment. The constants it reads are already hashed.
    return
  }
  if (Array.isArray(value)) {
    words.push(value.length)
    for (const item of value) feedValue(words, item, depth + 1)
    return
  }
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value).sort()) {
      for (const ch of key) words.push(ch.charCodeAt(0))
      feedValue(words, (value as Record<string, unknown>)[key], depth + 1)
    }
  }
}
