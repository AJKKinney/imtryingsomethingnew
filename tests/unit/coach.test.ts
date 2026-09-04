/**
 * §11's onboarding — *"90 seconds of tutorial-by-play with no text walls"* — against a
 * prototype that had a wall and no play in it: eight bindings, printed permanently.
 */
import { describe, expect, it } from 'vitest'
import { createCoach, rotates, type Lesson, type Situation } from '../../src/ui/coach.ts'
import { TRAY, apply, createPrototype, situationOf, type Command } from '../../src/ui/prototype.ts'
import { place, rotate, shapeOf } from '../../src/grid/board.ts'
import { LABELS } from '../../src/data/strings.ts'

const BOARD: Situation = {
  tab: 'workbench', carrying: false, onPlacement: false, placements: 0, rotatable: false,
}
const FIELD: Situation = { ...BOARD, tab: 'run' }
const said = (c: ReturnType<typeof createCoach>, s: Situation): string | undefined => {
  const line = c.next(s, 'keyboard')
  return line === undefined ? undefined : `${line.key} ${line.verb}`
}

describe('A-065 · §11 the onboarding is a sequence, not a card', () => {
  it('names exactly one verb at a time, and never a list of them', () => {
    // The wall it replaces was two lines and eight bindings, shown at the moment of
    // least context and never changing. One line is the whole difference.
    const coach = createCoach()
    for (const s of [BOARD, FIELD, { ...BOARD, placements: 2, onPlacement: true }]) {
      const line = coach.next(s, 'keyboard')
      expect(line?.key.split(' ').length, 'a key, not a legend').toBeLessThanOrEqual(2)
      expect(line?.verb).not.toContain(' ')
    }
  })

  it('retires a lesson the moment it is used, and never shows it again', () => {
    // A lesson is learned by DOING it. The line a player ignores is the line they see
    // again; the one they act on is gone — which is what makes a coach unable to nag.
    const coach = createCoach()
    expect(said(coach, BOARD)).toBe('ENTER place')
    expect(said(coach, BOARD)).toBe('ENTER place')
    coach.learn('place')
    expect(said(coach, BOARD)).not.toContain('place')
  })

  it('ends empty, so it is not still teaching on run forty (§47.3)', () => {
    const coach = createCoach()
    coach.learnAll()
    expect(said(coach, BOARD)).toBeUndefined()
    expect(said(coach, FIELD)).toBeUndefined()
    expect(said(coach, { ...BOARD, placements: 3, onPlacement: true, rotatable: true }))
      .toBeUndefined()
  })

  it('tells a returning browser nothing at all, from the first frame', () => {
    // §47.3's finding about the cold open, at this scale: an opening that is right once
    // is an obstacle on run forty, and the only honest fix is to stop showing it.
    const returning = createCoach(['place', 'holding', 'move', 'rotate', 'fight', 'scrap',
      'walk', 'dash'])
    expect(said(returning, BOARD)).toBeUndefined()
    expect(said(returning, FIELD)).toBeUndefined()
  })

  it('names the verb the cell under the cursor affords, not the next one in a list', () => {
    // §112.2 gave `confirm` two meanings and which one it is is a property of the CELL.
    // A coach that named a fixed order would be right half the time on the same key.
    const coach = createCoach(['place', 'holding'])
    expect(said(coach, { ...BOARD, placements: 1, onPlacement: true })).toBe('ENTER move')
    expect(said(coach, { ...BOARD, placements: 1, onPlacement: false })).not.toContain('move')
  })

  it('says how to put down what is in the air, and otherwise says nothing at all', () => {
    // Falling through to the next lesson while a component is carried would name a verb
    // the board cannot currently perform — which is A-062's finding on a second surface.
    const coach = createCoach(['place', 'holding'])
    expect(said(coach, { ...BOARD, carrying: true, placements: 1 })).toBe('ENTER move')
    coach.learn('move')
    expect(said(coach, { ...BOARD, carrying: true, placements: 1 })).toBeUndefined()
  })

  it('offers ROTATE only for a part whose footprint rotation changes', () => {
    // A 1-cell part is the same part at every rotation, so naming the key there teaches
    // a verb with no visible consequence — §69.6's requirement, inverted.
    const coach = createCoach(['place', 'holding', 'move'])
    expect(said(coach, { ...BOARD, placements: 1, rotatable: false })).not.toContain('rotate')
    expect(said(coach, { ...BOARD, placements: 1, rotatable: true })).toBe('R rotate')
  })

  it('agrees with the board about which parts those are', () => {
    // The predicate is computed from the real shapes, so it cannot drift from them.
    const cells = (id: string) => (r: 0 | 1 | 2 | 3) =>
      rotate(shapeOf(id as never), r).map(([x, y]) => ({ x, y }))
    expect(rotates(cells('arc'))).toBe(false)      // 1 cell
    expect(rotates(cells('pulse'))).toBe(true)     // 3-cell T
    expect(rotates(cells('lance'))).toBe(true)     // 2-cell line
  })

  it('never offers SCRAP before there is anything to scrap', () => {
    const coach = createCoach(['place', 'holding', 'move', 'rotate', 'fight'])
    expect(said(coach, { ...BOARD, placements: 0 })).toBeUndefined()
    expect(said(coach, { ...BOARD, placements: 1 })).toBe('BACKSPACE scrap')
  })

  it('keeps the field\u2019s two verbs separate from the board\u2019s six (§111.1)', () => {
    // `walk` and `move` are the two things this game calls MOVE, and a player who has
    // learned one has not learned the other.
    const coach = createCoach()
    expect(said(coach, FIELD)).toBe('WASD move')
    coach.learn('walk')
    expect(said(coach, FIELD)).toBe('SHIFT dash')
    coach.learn('dash')
    expect(said(coach, FIELD)).toBeUndefined()
    // …and the board has taught nothing, because the player has not opened it.
    expect(said(coach, BOARD)).toBe('ENTER place')
  })

  it('names keys the player actually has, on a pad as on a keyboard (§82.1)', () => {
    // §82.1's fourth gate criterion is reachability ON A PAD, and a coach naming keys
    // the player does not have is worse than no coach.
    const coach = createCoach()
    expect(coach.next(BOARD, 'pad')?.key).toBe('A')
    expect(coach.next(BOARD, 'keyboard')?.key).toBe('ENTER')
  })

  it('names every verb from §102.2’s label table, so it costs no prose', () => {
    // §64.5 and §141.4 both put a keycap legend outside prose; the verb beside it is a
    // label. Together that is a tutorial that localises with the string table and adds
    // nothing to §23 task 17's ~640 human-written words.
    const ids = new Set(LABELS.map((l) => l.id))
    const seen = new Set<string>()
    const all: Lesson[] = ['place', 'holding', 'move', 'rotate', 'fight', 'scrap', 'walk', 'dash']
    for (const lesson of all) {
      const c = createCoach(all.filter((l) => l !== lesson))
      const line = c.next(
        { ...BOARD, tab: lesson === 'walk' || lesson === 'dash' ? 'run' : 'workbench',
          placements: 1, onPlacement: lesson === 'move', rotatable: true },
        'keyboard')
      if (line === undefined) continue
      seen.add(line.verb)
      expect(ids.has(line.verb), `${line.verb} is not a label`).toBe(true)
    }
    expect(seen.size).toBeGreaterThanOrEqual(7)
  })

  it('is driven by the same board the player is looking at', () => {
    // `situationOf` reads the prototype rather than tracking a copy beside it, so the
    // line shown and the act a confirm performs are one question asked once (§134.6).
    const p = createPrototype()
    p.holding = TRAY.indexOf('arc')
    expect(situationOf(p).onPlacement).toBe(false)
    place(p.board, 'arc', p.cursor, 0)
    expect(situationOf(p).onPlacement).toBe(true)
    expect(situationOf(p).placements).toBe(1)
  })

  it('walks a first run from PLACE to silence, and stays silent', () => {
    // The whole sequence, driven through the real `apply` — which is the only evidence
    // that the order is reachable rather than merely declared.
    const coach = createCoach()
    const p = createPrototype()
    const board = (command: Command): void => {
      const was = situationOf(p)
      apply(p, command)
      if (command === 'confirm') {
        if (was.carrying) coach.learn('move')
        else if (!was.onPlacement) coach.learn('place')
      } else if (command === 'rotate') coach.learn('rotate')
      else if (command === 'scrap') coach.learn('scrap')
      else if (command === 'nextPart' || command === 'prevPart') coach.learn('holding')
      else if (command === 'hotter' || command === 'cooler') coach.learn('fight')
    }
    const line = (): string | undefined => said(coach, situationOf(p))

    expect(line()).toBe('ENTER place')
    board('confirm')
    expect(line()).toBe('Q E holding')
    board('nextPart'); board('down'); board('down')
    board('confirm')
    expect(line()).toBe('ENTER move')     // the cursor rests on what it just placed
    board('confirm')                       // pick it up — half a verb, teaches nothing
    expect(line()).toBe('ENTER move')
    board('right'); board('confirm')       // put it down: the verb is complete
    expect(line()).toBe('[ ] fight')
    board('hotter')
    expect(line()).toBe('BACKSPACE scrap')
    board('scrap')
    expect(line()).toBeUndefined()
    // And it stays gone wherever the cursor goes next.
    board('up'); board('left')
    expect(line()).toBeUndefined()
  })
})
