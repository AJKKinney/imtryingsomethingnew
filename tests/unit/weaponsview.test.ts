/**
 * A-055 · §46.2 — a weapon that fires leaves something to see.
 *
 * §46.2 required a distinct FIRING SIGNATURE per emitter in the same pass that
 * required distinct silhouettes, and only the silhouettes were built. Arc resolves
 * instantly (§38.2), so a shot left no projectile behind and the simulation recorded
 * nothing a renderer could read: the frame drew the substrate, the enemies and the
 * player, and that was all of it. Three shots a second, and the only visible
 * consequence of firing was an enemy that stopped existing.
 */
import { describe, expect, it } from 'vitest'
import { createWorld, type World } from '../../src/core/world.ts'
import { step as fire } from '../../src/game/weapons.ts'
import { step as rehash } from '../../src/core/spatialhash.ts'
import { ARC_HALF_ANGLE_COS, EMITTERS } from '../../src/data/emitters.ts'
import { ARC_FLASH_TICKS, drawArcCone, renderFrame } from '../../src/render/renderer.ts'
import { camera } from '../../src/render/camera.ts'
import { stubSurface } from '../surface.ts'

/** One Swarmer, placed by hand, so the shot is a fact rather than a coincidence. */
const withEnemyAt = (x: number, y: number): World => {
  const w = createWorld(0x4d454c54)
  const e = w.enemies.items[0]
  if (e === undefined) throw new Error('empty pool')
  e.id = 1
  e.kind = 0
  e.x = x
  e.y = y
  e.hp = 8
  w.enemies.count = 1
  w.enemies.nextId = 2
  rehash(w)
  return w
}

describe('A-055 · §46.2 the shot is recorded', () => {
  it('stamps the tick and the aim, and marks what it hit', () => {
    const w = withEnemyAt(40, 0)
    w.tick = 12
    fire(w)

    expect(w.arc.firedAt).toBe(12)
    // A unit vector toward the target: the renderer orients the cone from it, so a
    // length that is not one is a wedge that does not reach where the damage did.
    expect(w.arc.aimX ** 2 + w.arc.aimY ** 2).toBeCloseTo(1, 9)
    expect(w.arc.aimX).toBeCloseTo(1, 9)

    const hit = w.enemies.items[0]
    expect(hit?.hp).toBe(8 - EMITTERS.arc.damage)
    expect(hit?.hurtAt).toBe(12)
  })

  it('records nothing when the shot is not spent', () => {
    // §112.6 — nothing in range does not discharge the cooldown, because facing is
    // set by movement and a shot into empty space would make aiming a resource.
    const w = createWorld(0x4d454c54)
    w.tick = 30
    fire(w)
    expect(w.arc.firedAt).toBe(0)
    expect(w.arc.cooldown).toBe(0)
  })
})

describe('A-055 · §121.5 the cone is drawn, and it is the cone that kills', () => {
  it('is one filled path while the flash lasts, and nothing once it is stale', () => {
    const w = withEnemyAt(40, 0)
    w.tick = 12
    fire(w)

    const lit = stubSurface(640, 360)
    const drawnLit = renderFrame(lit, camera(), w)

    w.tick = 12 + ARC_FLASH_TICKS
    const stale = stubSurface(640, 360)
    const drawnStale = renderFrame(stale, camera(), w)

    // ONE path, filled and stroked: §39.3's ceiling moves by two calls and the
    // geometry is computed once. A second path would be a second wedge.
    expect(lit.paths - stale.paths).toBe(1)
    expect(drawnLit - drawnStale).toBe(2)

    // The fill is the half a draw count cannot see, and it is what the first
    // playtest was missing: a stroked outline in a frame already holding hundreds
    // of stroked silhouettes is a shape to interpret rather than a discharge.
    expect(lit.filled.length - stale.filled.length).toBe(1)

    // And it fades rather than flashing: §12's reduce-flashing rule caps luminance
    // deltas and is mandatory to provide (§101.4), so the channel has to work for a
    // player who has it on — which means alpha strictly below one at the brightest
    // tick and strictly falling from there.
    const alphaAt = (age: number): number => {
      const probe = stubSurface(640, 360)
      w.tick = 12 + age
      drawArcCone(probe, camera(), w)
      return Number(/,\s*([0-9.]+)\)$/.exec(probe.filled[0] ?? '')?.[1] ?? NaN)
    }
    const first = alphaAt(0)
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(1)
    expect(alphaAt(ARC_FLASH_TICKS - 1)).toBeLessThan(first)
  })

  it('holds the wedge for at least half of Arc\'s own cadence', () => {
    // The defect the first playtest reported was not that the cone was absent but
    // that it was rare: at 3 shots a second a shot lands every 20 ticks, so a 6-tick
    // flash leaves the weapon dark in 70% of frames and reads as a flicker rather
    // than as fire. A signature the player sees in fewer than half the frames of a
    // continuously-firing weapon is not a signature (§46.2).
    const ticksBetweenShots = 60 / EMITTERS.arc.rate
    expect(ARC_FLASH_TICKS / ticksBetweenShots).toBeGreaterThanOrEqual(0.5)
    // ...and never so long that two shots overlap, which would make a fading channel
    // a constant one and cost §12's reduce-flashing rule its meaning.
    expect(ARC_FLASH_TICKS).toBeLessThanOrEqual(ticksBetweenShots)
  })

  it('draws the same boundary the damage test uses', () => {
    // §134.6 — the picture and the predicate are one object. Two copies of the
    // half-angle would be two boundaries waiting to drift, and a wedge that does not
    // match what it kills is §2's "cheated" on the surface the player watches most.
    const w = withEnemyAt(0, -40)
    w.tick = 5
    fire(w)

    // Drawn on its own surface rather than dug out of a whole frame: the claim is
    // about the wedge's geometry, and reconstructing it from a flat segment list
    // downstream of the substrate would be a test of the parsing.
    const s = stubSurface(640, 360)
    drawArcCone(s, camera(), w)
    expect(s.paths).toBe(1)

    const apex = { x: s.segments[0] ?? 0, y: s.segments[1] ?? 0 }
    const rim: { x: number; y: number }[] = []
    for (let i = 2; i + 1 < s.segments.length; i += 2) {
      const x = s.segments[i] ?? 0
      const y = s.segments[i + 1] ?? 0
      if (x === apex.x && y === apex.y) break
      rim.push({ x, y })
    }
    expect(rim.length).toBeGreaterThan(2)

    const reach = EMITTERS.arc.range
    for (const p of rim) {
      const dx = p.x - apex.x
      const dy = p.y - apex.y
      // Every rim point sits at the weapon's own range...
      expect(Math.hypot(dx, dy)).toBeCloseTo(reach, 6)
      // ...and inside the volume the simulation damages.
      const cos = ((dx / reach) * w.arc.aimX + (dy / reach) * w.arc.aimY)
      expect(cos).toBeGreaterThanOrEqual(ARC_HALF_ANGLE_COS - 1e-9)
    }
    // The edges ARE the boundary, not merely inside it.
    const edge = Math.min(...rim.map((p) => {
      const dx = (p.x - apex.x) / reach
      const dy = (p.y - apex.y) / reach
      return dx * w.arc.aimX + dy * w.arc.aimY
    }))
    expect(edge).toBeCloseTo(ARC_HALF_ANGLE_COS, 9)
  })

  it('flashes a hit enemy without spending a draw on it', () => {
    // §12's feedback channel is damage numbers, hit flash and death particles, and
    // §109.4 rules out per-enemy health bars on the draw budget — so the flash is the
    // only thing telling a player their shot connected, and it has to be free.
    const w = withEnemyAt(40, 0)
    w.tick = 12
    fire(w)

    const flashing = stubSurface(640, 360)
    const withFlash = renderFrame(flashing, camera(), w)

    const enemy = w.enemies.items[0]
    if (enemy === undefined) throw new Error('no enemy')
    enemy.hurtAt = 0
    const plain = stubSurface(640, 360)
    const withoutFlash = renderFrame(plain, camera(), w)

    expect(withFlash).toBe(withoutFlash)
  })
})
