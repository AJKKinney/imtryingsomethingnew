/**
 * §12's camera: follows the player with 12% look-ahead, over an unbounded field.
 *
 * §108.4 checked that the field's unboundedness is safe for §14: a 21-minute run at
 * 150 u/s reaches at most ~189,000 units, where float64 spacing is ~3e-11 — eleven
 * orders of magnitude inside anything the simulation resolves — and §17's spatial
 * hash buckets modularly, so it is indifferent to absolute position.
 *
 * The play area is a fair, fixed 640x360 for EVERYONE (§3.A). §3 recorded the error
 * this fixes: 640x360 is 16:9 and the Steam Deck is 16:10, so the game would have
 * shipped dead black bars on its most important platform. Taller aspects fill the
 * extra space with the machine bezel instead; the play area never changes.
 */
import { clamp } from '../core/fixedmath.ts'
import { CAMERA_LOOKAHEAD, PLAYER_SPEED } from '../data/player.ts'

export const PLAY_WIDTH = 640
export const PLAY_HEIGHT = 360

export interface Camera {
  x: number
  y: number
}

export const camera = (): Camera => ({ x: 0, y: 0 })

/**
 * Look-ahead is 12% of a second of travel, so the space the player is moving into is
 * on screen before they reach it — 44 u at full speed, comfortably inside the margin
 * between §10's 400 u spawn ring and §37.3's 367 u camera half-diagonal.
 */
export const MAX_LOOKAHEAD = PLAYER_SPEED * CAMERA_LOOKAHEAD

export const follow = (c: Camera, px: number, py: number, vx: number, vy: number): void => {
  // Clamped at walking speed, so §95.2's dash at 700 u/s does not throw the camera
  // 84 u ahead and snap it back. The dash is 0.2 s of i-frames, not a camera move.
  c.x = px + clamp(vx * CAMERA_LOOKAHEAD, -MAX_LOOKAHEAD, MAX_LOOKAHEAD)
  c.y = py + clamp(vy * CAMERA_LOOKAHEAD, -MAX_LOOKAHEAD, MAX_LOOKAHEAD)
}

export const screenX = (c: Camera, worldX: number): number => worldX - c.x + PLAY_WIDTH / 2
export const screenY = (c: Camera, worldY: number): number => worldY - c.y + PLAY_HEIGHT / 2
