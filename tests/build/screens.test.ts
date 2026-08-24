/**
 * §101.6 — the screen registry, and the reason it is a canonical home rather than a
 * file.
 *
 * §101.1 measured the interface: **one line of the file tree**, for a hundred
 * sections, while forty passes promised seventeen settings one at a time and fifteen
 * screens accumulated with **no navigation graph anywhere** — in a project whose
 * primary venue is judged on gamepad reachability and whose Deck Verification
 * submission §100.6 moved forward to phase 4. Two of those settings were
 * commitments rather than conveniences: §12's mandatory reduce-flashing and §98.4's
 * telemetry opt-out, both placed *in a pause menu whose contents were never written
 * down*.
 *
 * §101.3's move is the one this file enforces: **gamepad completeness is a property
 * of the construction, not a test result.** Every screen is exactly one of three
 * idioms and no screen may invent a fourth — the same shape as §60.2's heat floor,
 * and §35.3's rule that an invariant survives retuning where a value does not.
 */
import { describe, expect, it } from 'vitest'
import {
  CROSS_EDGES, ENTRIES, ENTRY, SCREENS, SCREEN_ORDER, type Idiom, type ScreenId,
} from '../../src/ui/screens.ts'

const IDIOMS: readonly Idiom[] = ['list', 'gridCursor', 'walkedSpace']
const ALL = SCREEN_ORDER.map((id) => SCREENS[id])

/** The screens a `B` press has nowhere to go from, and why each is exempt. */
const NO_PARENT: readonly ScreenId[] = ['title', 'hall', 'run', 'shareLanding']

describe('A-049 · §101.6 the screen registry is a connected graph with one B parent each', () => {
  it('declares exactly one of the three idioms for every screen', () => {
    // No screen may invent a fourth. A settings row that wants a slider is a LIST row
    // whose value changes on left/right; a leaderboard is a list; a board gallery is
    // a list of boards that opens the grid cursor. Three idioms, all three specified
    // elsewhere, and every one of them has an obvious pointer equivalent — which is
    // why §101.1's missing key rebinding turned out to be nearly free.
    for (const screen of ALL) {
      expect(IDIOMS, screen.id).toContain(screen.idiom)
    }
    // And all three are actually used: an idiom nobody reaches is a rule with no
    // subject, and would let a fourth arrive as "the exception we already have".
    expect(new Set(ALL.map((x) => x.idiom))).toEqual(new Set(IDIOMS))
  })

  it('lists every declared screen exactly once, in a stable order', () => {
    expect(new Set(SCREEN_ORDER).size).toBe(SCREEN_ORDER.length)
    expect([...SCREEN_ORDER].sort()).toEqual(Object.keys(SCREENS).sort())
  })

  it('gives every screen except the four roots exactly one B parent', () => {
    // `B` always goes exactly one level up. That sentence is only SAYABLE because the
    // graph is a tree with three named cross-edges, and it is the single rule that
    // stops twenty memoryless sessions producing twenty different back-button
    // behaviours — the thing §63.4 says sessions will never agree on unprompted.
    for (const screen of ALL) {
      if (NO_PARENT.includes(screen.id)) {
        expect(screen.parent, screen.id).toBeNull()
        continue
      }
      expect(screen.parent, screen.id).not.toBeNull()
      expect(SCREEN_ORDER, `${screen.id} -> ${String(screen.parent)}`).toContain(screen.parent)
    }
  })

  it('has no main menu, because §55.3 deleted it without saying so', () => {
    // Settled by omission when §101.2 wrote the list out: §55.3 made the Hall the
    // loadout screen for thematic reasons — you walk to a machine to begin — and in
    // doing so removed the main menu. One fewer screen to build, and the most
    // thematically exact navigation decision available: the front page is a graveyard.
    expect(SCREEN_ORDER).not.toContain('mainMenu')
    expect(SCREENS.title.reaches).toEqual(['hall'])
    expect(SCREENS.hall.parent).toBeNull()
    expect(SCREENS.hall.idiom).toBe('walkedSpace')
  })

  it('reaches every screen from a declared entry point', () => {
    // A screen nobody can reach is a screen that will be built and never seen, and
    // the registry is the only place that can say so before there is a build. Written
    // against TITLE alone this fails on two screens — and both are correct: §101.3
    // drew THREE arrows into the graph, a launch, a crash and a share link, and the
    // registry modelled one. `recovery` and `shareLanding` are entered from outside
    // the game entirely.
    const seen = new Set<ScreenId>(Object.keys(ENTRIES) as ScreenId[])
    const queue: ScreenId[] = [...seen]
    while (queue.length > 0) {
      const at = queue.shift()
      if (at === undefined) break
      const screen = SCREENS[at]
      for (const next of [...screen.reaches, ...(screen.parent === null ? [] : [screen.parent])]) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    expect([...seen].sort()).toEqual([...SCREEN_ORDER].sort())
  })

  it('makes an entry point a claim with a reason, never a way to excuse an orphan', () => {
    // The check above is only worth running if "declare it an entry" costs something.
    // Every entry names what OUTSIDE the graph puts the player there; a screen that
    // cannot answer that is orphaned rather than entered.
    expect(Object.keys(ENTRIES)).toEqual(['title', 'recovery', 'shareLanding'])
    expect(ENTRIES[ENTRY]).toBeDefined()
    for (const [id, why] of Object.entries(ENTRIES)) {
      expect(SCREEN_ORDER, id).toContain(id)
      expect(why.length, id).toBeGreaterThan(60)
      expect(why, id).toMatch(/§\d+(\.\d+)?/)
    }
  })

  it('names every cross-edge, because a cross-edge is what a tree rule costs', () => {
    // The parent field describes a tree; anything reaching a screen that is not its
    // child is an edge across it, and each one has to be deliberate or `B` stops
    // meaning one level up. Three are named; a fourth appearing silently is the way
    // that rule dies.
    const crossings: string[] = []
    for (const screen of ALL) {
      for (const target of screen.reaches) {
        if (SCREENS[target].parent !== screen.id) crossings.push(`${screen.id} -> ${target}`)
      }
    }
    const targets = new Set(crossings.map((c) => c.split(' -> ')[1]))
    expect([...targets].sort()).toEqual(['hall', 'run', 'runEnd', 'settings'])
    // `run` is the game itself and is entered from four places by construction
    // (loadout, daily, recovery, a share link); the other three are §101.3's named
    // cross-edges, one line each in CROSS_EDGES.
    expect(CROSS_EDGES.length).toBe(3)
    for (const target of ['settings', 'runEnd', 'hall']) {
      expect(CROSS_EDGES.some((line) => line.startsWith(target)), target).toBe(true)
    }
  })

  it('keeps the board out of the pause menu, deliberately', () => {
    // §101.5: `TAB` opens the board at 20% time, never paused (§9). Routing it
    // through a pause menu would hand the player the true pause §3 explicitly
    // declined — which is the difference between a considered interaction inside a
    // reflex game and a reflex game with a planning screen.
    expect(SCREENS.pause.reaches).not.toContain('boardView')
    expect(SCREENS.boardView.parent).toBe('run')
  })

  it('gives every screen a stated reason, so the next session inherits the argument', () => {
    // §74.4's `why`, applied to the surface the player actually touches: the most
    // valuable decisions here are the ones that look like omissions — no main menu,
    // no board in the pause menu, one settings screen with two entry points.
    for (const screen of ALL) {
      expect(screen.why.length, screen.id).toBeGreaterThan(60)
      expect(screen.why, screen.id).toMatch(/§\d+(\.\d+)?/)
    }
  })
})
