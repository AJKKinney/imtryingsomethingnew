/**
 * FNV-1a over the exact float64 bits, and a leaf (§145.4).
 *
 * The bits rather than the value, because §14's whole claim is bit-exactness: a hash
 * that compared numbers within a tolerance would agree with precisely the drift it
 * exists to catch. `Math.imul` is on §14's permitted list, and there is nothing else
 * in here — no transcendental, no `Math.random`, no key-order iteration.
 */
export interface Hasher {
  h: number
}

export const hasher = (): Hasher => ({ h: 0x811c9dc5 | 0 })

const bits = new DataView(new ArrayBuffer(8))

export const feed = (s: Hasher, x: number): void => {
  bits.setFloat64(0, x)
  for (let i = 0; i < 8; i++) {
    s.h = Math.imul(s.h ^ (bits.getUint8(i) ?? 0), 0x01000193)
  }
}

export const digest = (s: Hasher): string => (s.h >>> 0).toString(16).padStart(8, '0')

export const hashOf = (xs: Iterable<number>): string => {
  const s = hasher()
  for (const x of xs) feed(s, x)
  return digest(s)
}
