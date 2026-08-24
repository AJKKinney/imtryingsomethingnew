# MELTLINE

**A bullet-heaven roguelite where your build is a circuit board you route power through.**

> Power wants your build compact and close to the core. Heat wants it spread out.
> Every placement trades one against the other. No layout wins both.

Heat is not a property of your layout — it is a property of the **work your machine is
doing**, so a board that sits cool in a lull climbs as the crowd thickens, and the same
build is safe at minute two and three seconds from meltdown at minute eighteen. Overclock
pays +50% rate and damage past a line you can cross deliberately; crossing it raises the
region's own heat generation, which is what makes the edge an edge.

```
npm install
npm run dev      # play it
npm run ci       # what CI runs: gendocs, typecheck, lint, build, test
```

**Zero runtime dependencies. Zero asset bytes.** Every silhouette, glyph, letterform,
palette and sound is generated — by a seeded shape grammar, a build-time stroke table and
WebAudio oscillators.

## Where things are

| | |
|---|---|
| `ROADMAP.md` | Where the project is, what a run is like, and what is still a prior |
| `CLAUDE.md` | How to work here: commands, the determinism policy, layering, conventions |
| `DECISIONS.md` | Every settled decision, its current owner, and what it supersedes |
| `LAWS.md` | What may never be done — as against what was done |
| `PIPELINE.md` | Every shipped asset and string, and how each was made |
| `docs/appendix-a.md` | Every canonical constant — **generated from `src/data/`** |
| `TELEMETRY.md` · `STORE.md` · `VOICE.md` | What is sent, what is sold, and how the words are written |

Five of those are emitted by `npm run gendocs` and fail CI if edited by hand. `src/data/` is
the specification; the documents are rendered views of it.
