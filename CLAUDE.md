# CLAUDE.md — how to work in this repository

Authored, and read third (§63.4). `ROADMAP.md` says where the project is; `DECISIONS.md`
says what was settled and by whom; this says how to build without re-deriving the
conventions every session.

**The constraint everything here follows from:** nothing is carried between sessions
except this repository. Twenty memoryless sessions share only a git history, so a
convention that lives in someone's head is a convention that will be violated, and the
answer is never "remember" — it is a generator, a lint, or an assertion.

---

## Commands

| | |
|---|---|
| `npm run ci` | What CI runs: gendocs → typecheck → lint → build → test. **Run this before every commit.** |
| `npm run emit` | Emits the generated code. Runs automatically before typecheck, build, test and dev. |
| `npm run gendocs` | Emits Appendix A, `LAWS.md`, `DECISIONS.md`, `PIPELINE.md`, and `ROADMAP.md`'s four regions |
| `npm run coverage` | `phase N: x/y implemented` — the fastest "where am I" there is |
| `npm run lint` | The three static checks: determinism, tick steps, text rendering |
| `npm test` / `npm run test:watch` | Vitest |

## The exit protocol (§63.4)

A session ends with **green CI, a commit, and a `ROADMAP.md` delta** — or, if it must stop
mid-slice, with an explicit `IN PROGRESS:` block naming the files touched and the invariant
currently broken. A session that ends silently mid-change leaves the next one archaeology
it has no context to perform. **This is why CI exists from commit one: the build going red
is not merely the only external signal, it is the only memory.**

---

## Four things that are generated, and are never edited

§147.2 — a file is generated, authored, or a source; where it must be more than one, the
regions are marked and enforced **both ways**.

| Generated | From | Never |
|---|---|---|
| `docs/appendix-a.md`, `LAWS.md`, `DECISIONS.md`, `PIPELINE.md` | `src/data/` | edited by hand |
| `ROADMAP.md`'s four sentinel regions | `src/data/`, `tests/assertions.ts` | edited by hand — everything outside them is authored, including `IN PROGRESS:` |
| `src/gen/sintable.ts`, `src/gen/strokefont.ts`, `src/gen/loop.ts` | `tools/emit.ts` | **committed.** Generated code stays out of the tree, so the readable artifact is the source |
| §21's session totals | `src/data/plan.ts`'s deliverables | restated. A total moves when the items move, or not at all |

**So a number changes in exactly one place.** If you find yourself typing a constant into a
document, stop: the document is wrong about where it comes from.

---

## The determinism policy (§14), which is a lint rule and not a convention

The simulation uses **only** `+ - * / %`, comparisons, and a named allow-list of exact
`Math` functions. No `Math.sin`, `cos`, `tan`, `atan2`, `pow`, `exp`, `log`: IEEE-754 does
not specify them, and they legitimately differ between engines, versions and platforms.
Trigonometry reads the baked table in `src/gen/sintable.ts`.

No `Math.random`, no `Date.now`, no `**`, no `for...in`, no iteration over `Set`/`Map` in
an order-sensitive path. Sorts use total-order comparators with a tiebreak on entity id.
Neighbour order on the board is **N, E, S, W**, everywhere.

`npm run lint:math` fails the build on a violation, at authoring time rather than at replay
time — which matters because the failure mode is silent: a desynced replay looks like a
mysterious bug rather than a spec violation, and replays, crash reports, the daily, PAR and
the leaderboard all rest on this.

**Rendering may do whatever it likes.** It never feeds back into the simulation.

## The tick order is data (§142.6)

`src/data/tickorder.ts` holds twenty-four steps and `src/gen/loop.ts` is **generated from
it**. A simulation module declares its `STEP` and the attributes it `WRITES`; `npm run
lint:steps` fails on a module that declares none.

The reason is §26's own sentence — *ordering **is** the simulation's semantics and a
reordering is a silent desync* — and what happened to it: twenty-two tick-ordered
behaviours were added over a hundred and fifteen passes and **fourteen landed nowhere**.
The one that was ever checked was checked by accident.

**The time-scale is a tick gate, never a `dt` multiplier** (§142.4). The accumulator's
target interval is `TICK_MS ÷ scale`; scale 0 is zero ticks. A `dt` multiplier would make
the golden hash a function of frame timing.

## Layering (§145.4), enforced by `tools/deps.ts`

```
data/  gen/  core/(pure)     ← leaves. They import nothing from the game.
grid/  game/                 ← simulation systems. They never import each other.
core/loop                    ← the only module that crosses systems, and nobody writes it.
render/                      ← reads a snapshot. Never writes to the simulation.
ui/  growth/                 ← above render/.
```

A session working on one system reads ~10 modules rather than ~35 — 2.5× smaller — and the
rule is what makes that true. `grid/heat` needs *targets hit*, which is a `game/weapons`
quantity, and it receives it **as a step input rather than as an import**: a generated loop
is a dataflow specification, and a dataflow specification is what makes lateral imports
unnecessary.

---

## Conventions

- **TypeScript strict, no `any`.** There is no human reviewer; the type checker is the
  substitute, so weakening it removes the only second opinion in the project.
- **Zero runtime dependencies**, and CI fails if `dependencies` is non-empty. Three reasons,
  all commercial: a shipped binary cannot carry a compromised transitive package; §18's
  disclosure claim is only auditable if nothing third-party is vendored in; and the demo
  loads in about a second, which is what a link-clicker will wait.
- **Comments explain *why*, and specifically the counter-intuitive why.** Every assertion
  carries a `why` field for the same reason (§74.4): the most valuable findings here are
  the ones that look like bugs — overclock raising its own heat, a heatsink that could
  switch the mechanic off, thermal momentum — and a bare rule invites a future session to
  tidy it away.
- **Cite sections.** `§58.1` in a comment is greppable and a paraphrase is not.
- **Measure, then state.** If a number disagrees with the plan, the number wins and the
  disagreement is recorded (§121.5: an unstable answer is *reported* as unstable, never
  tuned until it agrees). §92.2: a baseline is never moved to accommodate the change it is
  measuring.

## Assertions (§71.2)

`tests/assertions.ts` is the manifest and CI fails **both ways**: an assertion marked
`implemented` with no citing test, and a test citing an id that does not exist. A citation
is an id in a `describe` or `it` **title**, so it is visible in the test output.

Every entry carries `phase · tier · cadence · source · statement · why`, plus
`status: todo | implemented | expected-fail` and an optional `quirk: true`. An
`expected-fail` is the most valuable test there is — a design question with a number
attached — and the one thing you may never do with it is let it go quiet.

## Adding scope

Cost it against the **increment**, add the deliverable to `src/data/plan.ts`, and let the
total move. §21 stated 19–24 sessions while twenty passes added 7.3–10.6 to it, each one
declaring the total unchanged, because an addition measured against a total never moves it.
