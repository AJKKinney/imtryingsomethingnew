/**
 * Pre-allocated object pools (§17).
 *
 * Every pool is allocated once at boot and NEVER grown during a run: 2,048 enemies,
 * 4,096 projectiles, 8,192 particles, 1,024 pickups, 512 damage numbers. Growing a
 * pool mid-run allocates, and allocating mid-run is a garbage collection pause in the
 * middle of a 16.7 ms frame on a Steam Deck, which is the primary venue.
 *
 * Alive items are dense in [0, count), so iteration is a plain indexed loop with no
 * holes to skip and no key order to depend on — §14 forbids iterating object keys or
 * a Set in an order-sensitive path, and dense arrays are what it forbids them in
 * favour of.
 *
 * Recycling swaps the dead item with the last alive one, which changes ITERATION
 * order but is entirely deterministic: the same operations produce the same layout on
 * every machine. Anything that needs a stable identity uses `id`, which is
 * monotonic and never reused, and that is what §14's tiebreaks sort on.
 */

export interface Pooled {
  /** Monotonic, never reused. The stable identity §14's comparators tiebreak on. */
  id: number
}

export interface Pool<T extends Pooled> {
  readonly capacity: number
  /** `capacity` items, allocated once. Alive items are `items[0 .. count)`. */
  readonly items: readonly T[]
  count: number
  nextId: number
  /** Spawns refused because the pool was full — a budget breach the sweep can see. */
  refused: number
}

export const pool = <T extends Pooled>(capacity: number, make: () => T): Pool<T> => {
  const items: T[] = []
  for (let i = 0; i < capacity; i++) items.push(make())
  return { capacity, items, count: 0, nextId: 1, refused: 0 }
}

/**
 * Take the next free item, or `undefined` when the pool is full.
 *
 * Refusing rather than growing is the point: §31.3 fixes concurrent enemies at
 * 190–624 against a 2,048 pool, so a full pool means something upstream is wrong and
 * the honest response is a dropped spawn and a counter the sweep can read — not an
 * allocation the frame budget cannot afford.
 */
export const spawn = <T extends Pooled>(p: Pool<T>): T | undefined => {
  if (p.count >= p.capacity) {
    p.refused++
    return undefined
  }
  const item = p.items[p.count]
  if (item === undefined) return undefined
  p.count++
  item.id = p.nextId
  p.nextId++
  return item
}

/**
 * Return item `index` to the pool by swapping the last alive item into its slot.
 *
 * The caller's loop must not advance past the swapped-in item, so the idiom is a
 * downward loop or an index that does not increment on a despawn. Stated here rather
 * than discovered at the first enemy that survives its own death.
 */
export const despawn = <T extends Pooled>(p: Pool<T>, index: number): void => {
  if (index < 0 || index >= p.count) return
  const last = p.count - 1
  if (index !== last) {
    const a = p.items as T[]
    const swap = a[last]
    const target = a[index]
    if (swap !== undefined && target !== undefined) {
      a[index] = swap
      a[last] = target
    }
  }
  p.count--
}

export const clear = <T extends Pooled>(p: Pool<T>): void => {
  p.count = 0
  p.refused = 0
}
