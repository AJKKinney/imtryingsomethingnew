# TELEMETRY.md — everything the game sends, and everything it does not

Authored, and it exists for the reason `PIPELINE.md` exists: **a claim is only auditable if
it is enumerated.** This game is played by strangers who did not sign up for anything, so
the constraints below are decided here and are not negotiable at implementation time.

---

## Why it exists at all

§68.5 gave this project dated decision points and a stop condition, because a project with
no deadline and no stop condition is not cancelled — it is abandoned silently, which is
worse, because nothing is learned. §98.1 then checked whether each signal could actually be
read, and **the very first one could not**: *"+2 weeks: fewer than 200 total web-demo
sessions"* had no mechanism anywhere, and it is the earliest and cheapest signal in the
project — the one that separates *the game is wrong* from *the posts are wrong*.

And the ratio is the argument. §41.2 budgets the entire human signal in this plan at **~48
runs by one person**; the free public web build is a population of **52,000–195,000 runs**
of the shipping code, every one of which already computes every metric §2.4 asks for.
§41.1's ~190-character summary code was built to carry exactly that and is displayed on
screen and discarded.

**A stop condition you cannot evaluate is not a stop condition; it is a sentence about one.**

## The two tiers

**Tier 1 — session counting.** Cloudflare Web Analytics: free, cookieless, no identifiers,
one script tag. This alone closes the +2-week decision point — sessions, uniques, referrer,
which is exactly *is the link being clicked, and from where*. It is not a backend; it is a
counter.

**Tier 2 — the run summary.** A stateless, **write-only** Cloudflare Worker taking §41.1's
existing summary code. No read path from the game, no session state, no accounts. At the
target scenario that is ~1,100 writes a day against a 100,000/day free tier; above 20,000
sessions in a rolling day it **samples one run in ten**, selected on a hash of the per-run
id, and ships the sample rate in the payload so the bands weight correctly (§137.5 — the
free tier binds at ~38,000 players a day, which is precisely what one front-page post
produces, so the instrument would otherwise break at the event the whole funnel aims at).

**This is consistent with §55.4's server-free position rather than a reversal of it.** That
position exists because a *game server* — one the simulation depends on, that must stay up,
that has a read path, that fails the player when it fails — is what kills a solo project. A
write-only counter the game never reads, and that can be down for a week with no
player-visible effect, is not that thing.

---

## What the payload contains

| Field | |
|---|---|
| A **per-run random id** | Not per player. There is deliberately no way to join two runs by the same person |
| Seed, build version, content hash | So a run can be reproduced (§14) |
| Duration and minute reached | §105.5's skill-growth band |
| §2's emotion metrics | Time overclocked, meltdowns, first overclock, board decisions |
| `F` markers | Six fixed categories, as an enum |
| Sample rate | 1, or 10 above the threshold |

## What it never contains

- **No identifiers of any kind.** No account, no cookie, no fingerprint, no IP retention.
  The per-run id deliberately gives up cohort retention — a real analytic loss, accepted,
  because the alternative is tracking people who came to play a game.
- **No free text, ever.** §66.1 already removed player-typed names from share codes to close
  a moderation surface; the same rule applies here for the same reason.
- **Nothing at all from the paid build.** The Steam build uses Steamworks' aggregate Stats,
  which Valve hosts and which the player already consented to by using Steam. §148.4 makes
  this a **forbidden symbol** check over the emitted bundle rather than a flag read at
  runtime, because a flag read at runtime is a flag that shipped.

## What the player sees

One line in the pause menu of the web build:

> *this build reports anonymous run statistics — turn off*

Off means the code is not sent. Nothing else changes. It is a settings row (§101.4's Game
group) rather than a policy page, because a policy nobody opens is not consent.

---

## What it converts, and what it does not

Every run-derived band in this project is currently stamped with a **bot's** policy, and the
game ships to people. From phase 3b these stop being bot numbers: time overclocked,
voluntary meltdowns, time to first overclock, board decisions per run, the demo-completion
gate, run length by mode, and §123.7's deliberation share.

**One of them has never been measurable by any instrument this plan owns**: §2.4's
quit-point metric — *no cluster above 15% at any minute* — is the most commercially direct
signal in the list, and **a bot never quits.**

**Two limits, stated rather than discovered.** Telemetry measures the **demo** — Lattice
only, capped at 10:00 — so every human-measured band carries `scope: demo` and says nothing
about the Primes, THE FOUNDRY, ascension or the other two cores. And it does not replace the
playtester: a hundred thousand anonymous runs can say *minute seven loses people*, and only
a person can say *because the board felt like a chore*.

**Every §68.5 decision point names the mechanism that produces it, in the same sentence.**
A decision point with no source is not a decision point.
