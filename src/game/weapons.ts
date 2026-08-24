/**
 * §142.5 step 12 — weapon fire.
 *
 * §26 is explicit that components are iterated in stable `(row, col)` order and that
 * §14 forbids a comparator that can return 0 for distinct entities. There is no
 * board yet — commit 10 brings the grid — so at commit 7 there is exactly one
 * emitter and the ordering rule has nothing to order. The rule is stated here
 * anyway, because the thing that goes wrong is a session adding a second emitter and
 * iterating whatever the pool happens to hold.
 *
 * Arc is §121.6's opening emitter and §121.5 is the reason it is worth implementing
 * honestly rather than as a hitscan at the nearest enemy: its 60-degree cone covers
 * **0.17 of the circle**, against 1.00 for five of the roster, and §118.2 makes
 * minutes 0-3 entirely Swarmers converging from every direction. Coverage is what
 * decides whether a weapon fires at the threat at all, and §33.3's DPS table — which
 * ranks Arc second of seven — cannot see it. Modelling the cone is what makes that
 * measurable instead of an assertion in a document.
 */
import { distanceSquared } from '../core/fixedmath.ts'
import { queryRadius } from '../core/spatialhash.ts'
import { EMITTERS } from '../data/emitters.ts'
import { DT } from '../core/tick.ts'
import type { World } from '../core/world.ts'

export const STEP = 'weapons'
export const WRITES: readonly string[] = ['arc', 'enemies']

const ARC = EMITTERS.arc

/**
 * The cosine of half the cone's angle, so the test is one dot product and no inverse
 * trigonometry. §14's policy permits `Math.sqrt` and nothing transcendental, and
 * `cos(30 degrees)` is a constant the build can bake rather than a call.
 */
export const ARC_HALF_ANGLE_COS = 0.8660254037844387

const scratch: number[] = []

export const step = (world: World): void => {
  const { enemies, player, arc } = world
  arc.cooldown -= DT
  if (arc.cooldown > 0) return
  arc.cooldown += 1 / ARC.rate

  const found = queryRadius(world.hash, player.x, player.y, ARC.range, scratch)

  // §27's nearest: minimise SQUARED distance, tie-broken on the LOWEST entity id
  // (§14 forbids a comparator that can return 0 for distinct entities). Never on
  // pool order, which is a function of what died last tick and is not an order.
  let best = -1
  let bestD2 = 0
  let bestId = 0
  for (let n = 0; n < found; n++) {
    const i = scratch[n] ?? -1
    const e = i < 0 ? undefined : enemies.items[i]
    if (e === undefined || e.hp <= 0) continue
    const d2 = distanceSquared(e.x, e.y, player.x, player.y)
    if (d2 <= 0) continue
    if (best < 0 || d2 < bestD2 || (d2 === bestD2 && e.id < bestId)) {
      best = i
      bestD2 = d2
      bestId = e.id
    }
  }

  if (best < 0) {
    // Nothing in range: the shot is not spent, and §112.6 is why. Facing is set by
    // movement, so a cone the player could point would be a third real-time verb —
    // and one that discharged into empty space would make aiming a resource.
    arc.cooldown = 0
    return
  }

  const target = enemies.items[best]
  if (target === undefined) return
  const aimD = Math.sqrt(bestD2)
  const aimX = (target.x - player.x) / aimD
  const aimY = (target.y - player.y) / aimD

  // The cone is a DAMAGE VOLUME oriented by the targeting, not a firing arc oriented
  // by facing. §8.2 settles it twice over: L3 widens the cone 60 -> 120 degrees, and
  // L5 adds "+1 opposed cone" — a second cone at 180 degrees, which is only a
  // sentence about a volume. So a shot hits the nearest enemy AND everything else
  // caught in the cone toward it, which is what makes Arc a crowd weapon at 36 DPS
  // and a single-target one at 18 (§33.3), from one rule rather than two numbers.
  for (let n = 0; n < found; n++) {
    const i = scratch[n] ?? -1
    const e = i < 0 ? undefined : enemies.items[i]
    if (e === undefined || e.hp <= 0) continue
    const dx = e.x - player.x
    const dy = e.y - player.y
    const d2 = dx * dx + dy * dy
    if (d2 <= 0) continue
    const d = Math.sqrt(d2)
    if ((dx / d) * aimX + (dy / d) * aimY < ARC_HALF_ANGLE_COS) continue
    e.hp -= ARC.damage
  }
}
