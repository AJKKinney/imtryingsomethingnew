# VOICE.md — how the game's ~640 words are written

Authored, and **it ships no string of its own**. That is why it sits on my side of §18's
boundary: the disclosure position attaches to generative-AI content *players consume*, and
a style guide is consumed by the writer. `PIPELINE.md` lists every shipped string and which
side of the line it falls on; CI fails on one that is on neither (A-044).

**Who this is for:** §23's task 17 — roughly 3.5 hours of writing, split by §102.3's wire
format into **128 words of machine-name parts by phase 3b** and **the remaining ~512 by
phase 6**. Every word is human-written. The reason is not a wording trick: games carrying
Steam's AI-disclosure label see up to a 53% sales drop, and the goal is that the form can be
answered truthfully rather than carefully.

---

## The voice: deadpan machine telemetry

The game has almost no words, so each one is load-bearing. §54.2 already rethemed the
vocabulary — a machine has **integrity**, not hit points; it runs a **cycle**, not a level;
it is rated for a **duty**, not an ascension; and it records a **fault trace**. The voice
is what that vocabulary implies, made explicit.

### 1. The machine reports. It never judges.

States, times and quantities. Never the player's skill.

> `FAULT TRACE — last recoverable state found: 08:14. The machine ran for eleven more
> minutes.`

That sentence is the hardest thing in the game to write and it is one bad phrasing from
§2's *cheated*. It works because it is a **record**, not a verdict: the machine logging what
it could have been. The same finding delivered as *"you were doomed for eleven minutes"* is
condescension, and condescension is on the negative watchlist.

**And it must cut both ways, or it is a scolding.** When there was no point of no return,
the trace says so — and **that is the compliment**:

> `FAULT TRACE — no unrecoverable state. The machine held to the end.`

A player who dies while still viable has just been told they were beaten by the war and not
by themselves. That is the good death, and it currently goes unnamed everywhere else.

### 2. Only words the machine could know.

If a sentence implies a human observer, it is out of register. The corruption is never
described, only measured (§134.5: the codex's Field tab carries HP, speed, contact, hitbox
and the telegraph, and **not one sentence** about what the thing *is* — because §6's top
rung is *what is this place*, and a bestiary answers the question the whole design is built
on not answering).

### 3. No exclamation, no encouragement, no second person in a judgemental register.

§107.7: a judgment must answer two questions — is it fair, and does it tell the player what
to do differently. Encouragement does neither. *"Nice run!"* is the machine breaking
character to reassure someone, which is the one thing a machine cannot do.

### 4. Where a surface can be a number, it is a number.

The game is wordless by design. Prefer `POWER 1 / 3 — running at 33%` to a sentence about
insufficient power. §141.4 adds the corollary: **no locale ever formats a number** — no
thousands separator anywhere, `mm:ss` in every language — because machine telemetry does
not have one, and because a separator that inverts between locales is the standard
localized-number defect.

---

## The eight surfaces

| Surface | Words | Due | The constraint that is specific to it |
|---|---|---|---|
| **Machine-name parts** — 64 prefixes × 32 roots × 32 numerals | 128 | 3b | One semantic register, industrial and thermal. **Any prefix must combine with any root**, because all 65,536 combinations ship and none can be vetoed after the format freezes. Numerals are part numbers, not counts. `HEARTBURN-7` works; a prefix that only lands as a joke makes 32 roots unusable |
| **FAULT TRACE**, both variants | 60 | 6 | Rules 1 and 2, hardest. It says **"found"** rather than "existed": the solver's search is bounded, and the sentence must not outrun the computation |
| **Build-report template** | 120 | 6 | Narrates cause from quantities the simulation already has. Names the overflow conversion, and names the scrap refund **as a refund rather than as income** |
| **20 achievements** | 180 | 6 | Each names an object the renderer draws, because §140.3 generates both of its icons from that object |
| **8 anomaly lines** | 64 | 6 | The name on first encounter; the real numbers on every one after |
| **Death copy** | 12 | 6 | Leads with *the machine you built*. **The victory ships zero strings** |
| **Crash and error copy** | 40 | 6 | States what was recovered, hands over a copyable code. A crash is a fault the machine reports — the one place the voice is literally true |
| **Onboarding and the single prompt** | 36 | 6 | One prompt in twenty minutes, fired on a placement that visibly has a consequence. It names a key, not a lesson |

---

## The one place with no words at all

**The victory.** On beating THE FOUNDRY the camera pulls back and your core is revealed as
a single component on a vastly larger board. §4.4 defines it as the game's one deliberately
languageless moment and keeps it out of all marketing; §134.3 then found §102.2 had budgeted
sixty words across death *and* victory, and cut the victory's half to nothing.

Any sentence arriving with that camera move is a sentence **explaining the image**. There is
nothing to add and twenty minutes of build-up to lose.

## Three things that are true and are never said

§4's standing position, applied to character rather than to mechanics: a quirk that is
pointed at stops being a quirk.

- **You can name your machine and nobody will ever see it.** §66.1 replaced typed names in
  share codes with a procedural index to remove a moderation surface, and produced the best
  joke in the game by accident.
- **A player who plays badly builds a worse final boss**, because THE FOUNDRY is composited
  from their own wrecks.
- **The game pays you 20 salvage for destroying part of your own machine.**

A player telling another player about these is worth more than the game saying them.
