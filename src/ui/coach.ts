/**
 * §11's onboarding, which is a **sequence** rather than a card.
 *
 * §11 asks for *"90 seconds of tutorial-by-play with no text walls"*, §64.5 allows the
 * game **one** prompt in twenty minutes, and §9 forbids a mandatory modal outright. The
 * prototype had none of that and a card: two permanent lines naming eight bindings, put
 * on screen at the first gate because a tester *"could read the board and had NO MOVE"*.
 * That fixed the reachability and not the teaching — a list of eight verbs, shown at the
 * moment of least context and never changing, is the text wall §11 names by name. It is
 * read once or never, nothing in it is attached to a consequence, and it is still there
 * on run forty, which is §47.3's finding about the cold open in a smaller frame.
 *
 * So: **one line, naming one verb, chosen by what is true at the cursor right now, and
 * retired for good the moment the player uses it.** The sequence ends empty.
 *
 * Three properties follow, and each is a rule this document already wrote:
 *
 * **It teaches on a consequence rather than on a schedule.** §69.6's whole design is a
 * placement that *visibly has one* — the third component lands under-powered, so the
 * prompt fires where the board has just done something the player can see. Here the
 * board is placed by hand, so the trigger is read instead of scripted: the moment the
 * cursor rests on a component, MOVE is what that cell affords, and §85.2's trace has
 * already drawn whether it is fed. A player who starves one and moves it has been taught
 * power, decay and the move verb in one interaction, without a sentence about any of it.
 *
 * **It cannot nag.** A lesson is learned by DOING it, never by being shown it, so the
 * line a player ignores is the line they see again — and the one they act on is gone.
 * §82.1's fourth gate criterion is that a tester *moves something without being asked*;
 * a coach that retires on use is the only kind that leaves that measurable.
 *
 * **It costs no words.** Every verb is one of §102.2's existing labels and every key is
 * a keycap legend, which §64.5 and §141.4 both put outside prose — so this localises
 * with the label table and adds nothing to §23 task 17's ~640 human-written words.
 */
import type { Rotation } from '../grid/board.ts'

/**
 * The verbs, in the order the player needs them rather than the order a keyboard has
 * them. `walk` and `move` are deliberately distinct: one is the field verb and one is
 * §112.2's board verb, they are the two things called MOVE in this game, and a player
 * who has learned one has not learned the other.
 */
export type Lesson =
  | 'walk' | 'dash'
  | 'place' | 'move' | 'holding' | 'rotate' | 'scrap' | 'fight'

/** What is true where the player is standing, which is what decides the next line. */
export interface Situation {
  readonly tab: 'run' | 'workbench'
  /** A component is picked up: the only verb that matters is putting it down. */
  readonly carrying: boolean
  /** The cursor rests on a placement, so this cell affords a MOVE rather than a PLACE. */
  readonly onPlacement: boolean
  /** The board holds something — so there is something to scrap, and something to read. */
  readonly placements: number
  /** The held part has a footprint that rotation changes. A 1-cell part does not. */
  readonly rotatable: boolean
}

/** A keycap and a label id. The caller resolves the id, so this module holds no text. */
export interface Line {
  readonly key: string
  readonly verb: string
}

export type Device = 'keyboard' | 'pad'

/**
 * §12's two control columns, as data.
 *
 * A coach that names keys the player does not have is worse than no coach, and §82.1's
 * fourth gate criterion is that every cell and rotation be reachable **on a pad**. The
 * field row has no pad entry because the prototype's pad path drives the board and not
 * the player — naming a stick that does nothing would be the same defect pointed the
 * other way.
 */
const KEYS: Readonly<Record<Lesson, readonly [string, string | undefined]>> = {
  walk: ['WASD', undefined],
  dash: ['SHIFT', undefined],
  place: ['ENTER', 'A'],
  move: ['ENTER', 'A'],
  holding: ['Q E', 'LB RB'],
  rotate: ['R', 'X'],
  scrap: ['BACKSPACE', 'Y'],
  fight: ['[ ]', 'LT RT'],
}

/** The label id each verb is named by — §102.2's `action` and `hud` groups, unchanged. */
const VERBS: Readonly<Record<Lesson, string>> = {
  walk: 'move', dash: 'dash',
  place: 'place', move: 'move', holding: 'holding',
  rotate: 'rotate', scrap: 'scrap', fight: 'fight',
}

/** A footprint of one cell is the same footprint at every rotation (§34.1). */
export const rotates = (cells: (r: Rotation) => readonly { x: number; y: number }[]): boolean => {
  const at = (r: Rotation): string =>
    [...cells(r)].map((c) => `${c.x},${c.y}`).sort().join(' ')
  return at(0) !== at(1)
}

export interface Coach {
  readonly learned: ReadonlySet<Lesson>
  readonly learn: (lesson: Lesson) => void
  /** Every lesson at once — a returning player is not taught the game again (§47.3). */
  readonly learnAll: () => void
  readonly next: (situation: Situation, device: Device) => Line | undefined
}

/**
 * The order, and the reason for it: **blocked first, then consequence, then damage.**
 *
 * Nothing at all happens until the player places, so PLACE outranks everything, and
 * HOLDING follows because it is what makes a second placement different from the first.
 * MOVE is third and is deliberately NOT hurried: it is offered where it exists — on a
 * cell that holds something — and §82.1's fourth gate criterion is that a tester *moves
 * something without being asked to*, which a coach that leads with it makes impossible
 * to measure. ROTATE appears only while holding a part whose footprint it would change,
 * so the verb arrives when it becomes meaningful rather than when a list is printed.
 * FIGHT is the one that demonstrates the game — §51.2's claim is that heat tracks the
 * war rather than the layout and the slider is the whole proof — so it is taught on a
 * board that already has something to heat up. SCRAP is last because it is the only one
 * that destroys something, and a verb offered before it is wanted is a verb tried on a
 * board the player was happy with.
 */
const ORDER: readonly Lesson[] = ['place', 'holding', 'move', 'rotate', 'fight', 'scrap']

const available = (lesson: Lesson, s: Situation): boolean => {
  switch (lesson) {
    // Both are the same key, and which one it is is a property of the cell.
    case 'place': return !s.onPlacement
    // Offered where the verb exists, which is a cell that holds something. It does not
    // outrank HOLDING, so on the cell a placement has just landed in the player is
    // still being told how to choose the NEXT part rather than how to undo the last —
    // which is ORDER's doing rather than this predicate's, and is why the two are
    // written down together.
    case 'move': return s.onPlacement
    case 'rotate': return s.rotatable && !s.carrying
    case 'scrap': return s.placements > 0 && !s.carrying
    case 'fight': return s.placements > 0
    default: return true
  }
}

export const createCoach = (learned: Iterable<Lesson> = []): Coach => {
  const known = new Set<Lesson>(learned)
  return {
    learned: known,
    learn: (lesson) => { known.add(lesson) },
    learnAll: () => { for (const l of ORDER) known.add(l); known.add('walk'); known.add('dash') },
    next: (s, device) => {
      // The field has two verbs and the board has six. They are separate sequences
      // because they are separate tabs, and a player who has never opened one has not
      // failed to learn it.
      const queue: readonly Lesson[] = s.tab === 'run' ? ['walk', 'dash'] : ORDER
      // Carrying is the one state that leaves the queue entirely. A component is in
      // the air: the only thing worth saying is how to put it down, and if the player
      // already knows that, the only thing worth saying is nothing. Falling through to
      // the next lesson here would name a verb the board cannot currently perform.
      const wanted = s.carrying
        ? (known.has('move') ? undefined : 'move')
        : queue.find((l) => !known.has(l) && available(l, s))
      if (wanted === undefined) return undefined
      const [keyboard, pad] = KEYS[wanted]
      return { key: (device === 'pad' ? pad : keyboard) ?? keyboard, verb: VERBS[wanted] }
    },
  }
}
