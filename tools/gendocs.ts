/**
 * The generators.
 *
 * §63.3 — Appendix A is GENERATED from `src/data/`, and CI fails on drift. The
 * dependency inverts: code is the specification, the document is a rendered view.
 *
 * §136.5 — an artifact that is READ may be prose; an artifact that is EXECUTED must
 * be generated or version-stamped. Six categories of truth were rescued into
 * machinery one pass at a time, and every one of them was a REFERENCE. The three
 * left in prose were the INSTRUCTIONS — what the game is, what to build first, and
 * how to judge the sweep — and all three had drifted 58, 65 and 64 passes, because
 * a reference that drifts gives a wrong answer to a question someone asked and **an
 * instruction that drifts is simply followed.**
 *
 * §147.2 — a file is generated, authored, or a source; where it must be more than
 * one, the regions are marked by sentinels and enforced BOTH ways. `ROADMAP.md` is
 * the file that forced the rule: §136.2 generates its opening pages, §145.6 reads
 * its deliverable list, and §63.4 has the session hand-write the `IN PROGRESS:`
 * block that is the only thing letting the next session recover. A generator that
 * rewrote the file would clobber exactly that.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { MODEL_VERSION, PARTITIONS, type Provenance } from '../src/data/index.ts'
import { LAWS } from '../src/data/laws.ts'
import { DECISIONS, supersessionRate } from '../src/data/decisions.ts'
import { LABELS, LABEL_BUDGET, PROSE, PROSE_BUDGET, PROSE_WORDS } from '../src/data/strings.ts'
import { ACHIEVEMENTS, ASSETS, GENERATED_ASSETS, ICON_COUNT, ICON_SIZE } from '../src/data/assets.ts'
import {
  CANONICAL_HOMES, COMMITS, DELIVERABLES, EA_PHASES, PHASE_NAMES, PHASE_ORDER,
  estimate, phaseEstimate,
} from '../src/data/plan.ts'
import { ENCOUNTERS, ENCOUNTER_ORDER, FOUNDRY_ESCALATION_FACTOR, FOUNDRY_ESCALATION_INTERVAL, FOUNDRY_ESCALATION_STEP, FOUNDRY_VENT_HEAT, RELEASE_BEAT_SECONDS } from '../src/data/encounters.ts'
import { APPROACH_START_MINUTE, RUN_SPAWN_STOP_MINUTE, SPAWN_BASE, SPAWN_PER_MINUTE } from '../src/data/waves.ts'
import { render as coverageTable } from './coverage.ts'

// ─────────────────────────────────────────────────────────── §147.2's sentinels

export const beginMark = (id: string): string => `<!-- BEGIN GENERATED: ${id} -->`
export const endMark = (id: string): string => `<!-- END GENERATED: ${id} -->`

/** Kept for the appendix, which is one region wrapping a whole file. */
export const BEGIN = beginMark('appendix-a')
export const END = endMark('appendix-a')

export const wrap = (id: string, body: string): string =>
  `${beginMark(id)}\n\n${body}\n\n${endMark(id)}`

/** The text a region currently holds on disk, or `undefined` if the region is absent. */
export const extract = (source: string, id: string): string | undefined => {
  const from = source.indexOf(beginMark(id))
  const to = source.indexOf(endMark(id))
  if (from < 0 || to < 0 || to < from) return undefined
  return source.slice(from + beginMark(id).length, to)
}

/**
 * Replaces one region and touches nothing else. This is the whole mechanism:
 * a generator that cannot express "write outside my region" cannot do it by
 * accident, and the test that a hand edit INSIDE one fails is the other direction.
 */
export const splice = (source: string, id: string, body: string): string => {
  const from = source.indexOf(beginMark(id))
  const to = source.indexOf(endMark(id))
  if (from < 0 || to < 0 || to < from) {
    throw new Error(`ROADMAP.md is missing the sentinel region "${id}" (§147.2)`)
  }
  return source.slice(0, from) + wrap(id, body) + source.slice(to + endMark(id).length)
}

// ───────────────────────────────────────────────────────────── Appendix A (§63.3)

const fmt = (v: unknown, depth = 0): string => {
  if (typeof v === 'function') return '_(derived function)_'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6)))
  if (typeof v === 'string') return `\`${v}\``
  if (typeof v === 'boolean' || v === null) return String(v)
  if (Array.isArray(v)) {
    if (depth >= 2) return `_(${v.length} entries)_`
    return `[${v.map((e) => fmt(e, depth + 1)).join(', ')}]`
  }
  if (typeof v === 'object') {
    if (depth >= 2) return '_(object)_'
    const entries = Object.entries(v as Record<string, unknown>)
    return `{ ${entries.map(([k, x]) => `${k}: ${fmt(x, depth + 1)}`).join(', ')} }`
  }
  return String(v)
}

const stamp = (p: Provenance): string => {
  const axes = p.axes.length ? p.axes.join('+') : '—'
  const solved = p.kind === 'solved' ? ` · ${p.solvedBy}` : ''
  return `${p.kind} · ${p.system} · axes ${axes} · ${p.derivedFrom} · ${p.source}${solved}`
}

export function render(): string {
  const lines: string[] = [BEGIN, '']
  lines.push('# APPENDIX A — CANONICAL CONSTANTS (generated)', '')
  lines.push('> **Do not edit.** `src/data/` is the single source of truth and this file is emitted')
  lines.push('> from it by `tools/gendocs.ts` (§63.3). CI fails if the committed copy differs from the')
  lines.push('> generated one. Where the narrative and this file disagree, this file wins, because it')
  lines.push('> is the code.', '')
  lines.push('> The document sources — laws, decisions, strings, assets, the schedule — are')
  lines.push('> deliberately **not** here. They are specification and they are not constants, and')
  lines.push('> folding them in would bury eighty gameplay numbers under three hundred rows of prose')
  lines.push('> *and* put a reworded law inside §16\'s content hash, where it would invalidate every')
  lines.push('> replay in existence. They are emitted into `LAWS.md`, `DECISIONS.md` and')
  lines.push('> `PIPELINE.md` instead.', '')
  lines.push('**Model versions (§61.5)** — a bump fails the build for every constant not re-derived since:', '')
  lines.push('| Axis | Version |', '|---|---|')
  for (const [axis, version] of Object.entries(MODEL_VERSION)) lines.push(`| ${axis} | ${version} |`)
  lines.push('')

  for (const part of PARTITIONS) {
    lines.push(`## ${part.name}`, '')
    lines.push('| Constant | Value | Provenance |', '|---|---|---|')
    // Sorted explicitly: a real ESM namespace object sorts its keys and Vite's
    // transform preserves declaration order, so the output must not depend on the
    // loader. A generated artifact that differs by how it was loaded is not generated.
    for (const key of Object.keys(part.module).sort()) {
      const value = (part.module as Record<string, unknown>)[key]
      if (key === 'provenance') continue
      const p = part.provenance[key]
      if (!p) continue
      lines.push(`| \`${key}\` | ${fmt(value)} | ${stamp(p)} |`)
    }
    lines.push('')
  }
  lines.push(END, '')
  return lines.join('\n')
}

// ────────────────────────────────────────────────────────────── LAWS.md (§114.4)

export function renderLaws(): string {
  const judgmentHalf = LAWS.filter((l) => l.enforcement === 'judgment')
  const enforcedHalf = LAWS.filter((l) => l.enforcement === 'enforced')
  const body: string[] = []
  body.push('# LAWS (generated from `src/data/laws.ts`)', '')
  body.push('> **Do not edit.** §114.4: `DECISIONS.md` says what *was* decided; this says what may')
  body.push('> never be done. Every law here exists because something broke first — which is the')
  body.push('> right way to discover one and the worst way to store one, because it files the law')
  body.push('> under the accident rather than under the principle. The `precedent` column is the')
  body.push('> accident, kept deliberately: a law with its precedent attached is one a session can')
  body.push('> apply to a case it has not seen.', '')
  body.push(`**${LAWS.length} laws · ${judgmentHalf.length} judgment · ${enforcedHalf.length} enforced.**`, '')
  body.push('§114.4 counted seventy-nine standing laws across the plan. The ones here govern code')
  body.push('that exists or that the next commit touches; the rest land with their systems, and the')
  body.push('phase-boundary sweep reports the gap rather than assuming it closed.', '')
  body.push('---', '')
  body.push('## The judgment half — read this')
  body.push('')
  body.push('§114.5, and it is what decides the resume cost (§135.3). These cannot be tested and')
  body.push('must therefore be read; the enforced half fails the build by itself and does not need')
  body.push('to be, which is why a session\'s resume set carries this half only.')
  body.push('')
  for (const law of judgmentHalf) {
    body.push(`### ${law.id} · ${law.system} · ${law.source}`, '')
    body.push(`**${law.law}**`, '')
    body.push(`*Precedent —* ${law.precedent}`, '')
  }
  body.push('---', '')
  body.push('## The enforced half — CI reads this')
  body.push('')
  body.push('Each names the assertion that fails the build for it. A law in this half with no')
  body.push('assertion is a law in the wrong half.')
  body.push('')
  body.push('| Law | System | Assertion | Source | What may never be done |', '|---|---|---|---|---|')
  for (const law of enforcedHalf) {
    body.push(`| ${law.id} | ${law.system} | ${law.assertion ?? '**none**'} | ${law.source} | ${law.law} |`)
  }
  return `${wrap('laws', body.join('\n'))}\n`
}

// ───────────────────────────────────────────────────────── DECISIONS.md (§75.3)

export function renderDecisions(): string {
  const systems = [...new Set(DECISIONS.map((d) => d.system))]
  const superseding = DECISIONS.filter((d) => d.supersedes !== undefined).length
  const body: string[] = []
  body.push('# DECISIONS (generated from `src/data/decisions.ts`)', '')
  body.push('> **Do not edit — and do not treat this as a summary.** §84.1: the index is the')
  body.push('> **source**. A decision is not settled until it is here, and the prose section is the')
  body.push('> rationale written afterwards. §84.1 found the first version 46% out of date eight')
  body.push('> passes after it was built, and fixed the cause rather than the contents.', '')
  body.push('> §75.1 measured why the file exists: **eleven places where reading the obvious section')
  body.push('> for a topic returns a confidently wrong answer.** Consult the owner column before any')
  body.push('> section, never the first section that mentions the topic.', '')
  body.push(`**${DECISIONS.length} decisions · ${superseding} supersede an earlier one · ` +
    `${Math.round(supersessionRate() * 100)}%.**`, '')
  body.push('That ratio is the finding, measured rather than asserted: four out of five settled')
  body.push('decisions in this project overwrite one, and until §75.3 nothing recorded it but prose.', '')
  body.push('The plan carries 246 indexed decisions. What is here is every decision governing code')
  body.push('that exists or that the next commit touches — which is what §135.3\'s partition means a')
  body.push('session actually loads. The rest arrive with their systems.', '')
  body.push('---', '')
  body.push('## The index')
  body.push('')
  body.push('§135.3 — a session reads this whole, then the full rows for the two or three systems')
  body.push('its slice touches. That is 3,980 tokens against 8,364, which is what keeps §63.4\'s')
  body.push('resume budget honest as this file grows.')
  body.push('')
  body.push('| Topic | System | Owner | Supersedes |', '|---|---|---|---|')
  for (const d of DECISIONS) {
    body.push(`| ${d.topic} | ${d.system} | ${d.owner} | ${d.supersedes ?? '—'} |`)
  }
  body.push('')
  body.push('---')
  body.push('')
  body.push('## The partitions')
  for (const system of systems) {
    const rows = DECISIONS.filter((d) => d.system === system)
    body.push('', `### ${system} — ${rows.length}`, '')
    for (const d of rows) {
      const sup = d.supersedes === undefined ? '' : ` *(supersedes ${d.supersedes})*`
      const ver = d.verifiedAgainst === undefined ? '' : ` · verified against ${d.verifiedAgainst}`
      body.push(`**${d.topic}** — ${d.owner}${sup}${ver}`, '', d.decision, '')
    }
  }
  return `${wrap('decisions', body.join('\n'))}\n`
}

// ────────────────────────────────────────────────────────── PIPELINE.md (§18)

export function renderPipeline(): string {
  const body: string[] = []
  body.push('# PIPELINE (generated from `src/data/`)', '')
  body.push('> **Do not edit.** §18 rests the disclosure position on a claim about *how every')
  body.push('> shipped thing was made*, and a claim is only auditable if it is enumerated. This is')
  body.push('> the enumeration, emitted from the manifests so it cannot describe a pipeline the')
  body.push('> project stopped having.', '')
  body.push('## The position', '')
  body.push('All art and audio are **algorithmic** — the seeded shape grammar, gradients, flood')
  body.push('fills and WebAudio oscillators. No model is sampled at build time or at runtime, and')
  body.push('no training data is involved. Valve\'s rule attaches to generative-AI content players')
  body.push('consume; the goal is that the game genuinely contains none, and that the form is')
  body.push('answered truthfully. **If anything ships that qualifies, it is disclosed.**', '')
  body.push('The one category §18 got wrong for eighty passes is text, and §102.1 is the correction:')
  body.push('§18 exempted machine names on the grounds that players write them, and §47.4 auto-names')
  body.push('every machine while §66.1 makes the *shared* name a procedural index — so the one')
  body.push('category it exempted is the category players never write. The word list is')
  body.push('player-consumed generated text and it is on the human side below.', '')
  body.push('## Generated code, which is never committed (§147.2)', '')
  body.push('Every typecheck, build and test re-emits first, so a fresh clone cannot lack it — and')
  body.push('the readable artifact is the **source**, not the emission.', '')
  for (const g of GENERATED_ASSETS) body.push(`- ${g}`)
  body.push('')
  body.push('## Art derivation', '')
  body.push('| What | Derived from |', '|---|---|')
  body.push('| Enemy and boss silhouettes | `gen/shapes.ts` — a seeded radial grammar: symmetry order, per-wedge vertices at perturbed radii, mirrored |')
  body.push('| Component glyphs | The same grammar, constrained symmetric, closed and axis-aligned — which *is* §46.2\'s friend/foe rule, one generator with the constraint as the faction |')
  body.push('| Rare variants / elites | The same grammar\'s asymmetric branch, plus an extra ring (§132.2) |')
  body.push('| Palette | `gen/palette.ts` — eight cool core hues, six warm corruption hues, a heat ramp |')
  body.push('| The board | `render/` over §85.2\'s grammar: power is the trace\'s **width**, heat is the cell fill of the **derived** region sum (§134.2) |')
  body.push('| Letterforms | `gen/strokefont.ts` — a 7x9 stroke table emitted at build time by the tool that bakes §14\'s sine table. **The bundle carries zero font bytes** |')
  body.push('| Text rendering | `gen/atlas.ts` — the locale-invariant glyph set at three scales plus §102.2\'s labels as whole words. No `fillText` on a frame that renders entities (§147.1) |')
  body.push('| Music and SFX | WebAudio oscillators and envelopes (§12, §29, §86.1). No sample, no recording, no licence, no bytes |')
  body.push('')
  body.push(`## The asset manifest (§140.4) — ${ASSETS.length} rows`, '')
  body.push('Every row is rendered by `growth/capsule.ts` from a scene and a seed, so the set')
  body.push('regenerates when the art it depicts does. **Sizes are claims about the world (§100.7)**:')
  body.push('they are verified at the partner site on upload, and an unverified row says so.', '')
  body.push('| Asset | Size | Target | Safe inset | Scene | Verified |', '|---|---|---|---|---|---|')
  for (const a of ASSETS) {
    body.push(`| \`${a.id}\` | ${a.width}x${a.height} | ${a.target} | ${a.safeInset} | ${a.scene} | ${a.verifiedAgainst ?? '**unverified**'} |`)
  }
  body.push('')
  body.push(`## Achievement icons (§140.3) — ${ACHIEVEMENTS.length} achievements, **${ICON_COUNT} icons** at ${ICON_SIZE}x${ICON_SIZE}`, '')
  body.push('Steamworks takes an API name, a display name, a description and **two** icons per')
  body.push('achievement, achieved and unachieved. The unachieved variant is the same mark at low')
  body.push('luminance and desaturated, which satisfies §12\'s never-hue-alone rule by construction.')
  body.push('Every scene is an object the renderer already draws — which is what makes an')
  body.push('*illustrative* asset generable at all.', '')
  body.push('| API name | Scope | Unlocks | Scene |', '|---|---|---|---|')
  for (const a of ACHIEVEMENTS) {
    body.push(`| \`${a.api}\` | ${a.scope} | ${a.unlocks ?? '—'} | ${a.scene} |`)
  }
  body.push('')
  body.push('## String provenance (§102.6)', '')
  body.push('Every player-visible string is on exactly one of these lists, and CI fails on a string')
  body.push('that is on neither. The test §102.2 drew: **a label names a thing the player manipulates')
  body.push('and could be an icon or an id; prose is written to be read.**', '')
  body.push(`**Labels — mine: ${LABELS.length} of §102.2\'s ${LABEL_BUDGET}.**`, '')
  const groups = [...new Set(LABELS.map((l) => l.group))]
  body.push('| Group | Count | Labels |', '|---|---|---|')
  for (const g of groups) {
    const rows = LABELS.filter((l) => l.group === g)
    body.push(`| ${g} | ${rows.length} | ${rows.map((l) => l.text).join(' · ')} |`)
  }
  body.push('')
  body.push(`**Prose — human-written: ${PROSE_WORDS} words against §102.2\'s ~${PROSE_BUDGET}.**`, '')
  body.push('§18 requires every one of these to be written by a person. `VOICE.md` is what they are')
  body.push('written to, and it ships no string of its own.', '')
  body.push('| Surface | Words | Due | Voice |', '|---|---|---|---|')
  for (const p of PROSE) body.push(`| ${p.surface} | ${p.words} | phase ${p.due} | ${p.voice} |`)
  body.push('')
  return `${wrap('pipeline', body.join('\n'))}\n`
}

// ──────────────────────────────────────────────── ROADMAP.md's regions (§136.2)

const mmss = (minutes: number): string => `${minutes}:00`

/**
 * §136.2 — the run, emitted from the encounter table rather than retold. §78.1 stood
 * as the first page a memoryless session reads for fifty-eight passes while fifteen
 * changes landed in the run it describes, one of which made a number wrong.
 */
export const renderRun = (): string => {
  const lines: string[] = []
  lines.push('## The run', '')
  lines.push('_Generated from the encounter table, the wave curve and the state manifest — so a beat')
  lines.push('this page names is a beat `src/data/` contains (§136.2)._', '')
  lines.push(`Spawn rate is \`${SPAWN_BASE} + ${SPAWN_PER_MINUTE}t\` per second until **${mmss(APPROACH_START_MINUTE)}**, where the`)
  lines.push('curve bends **down** for the only time in the run: spawning thins, derelicts stop')
  lines.push(`appearing, the horizon structures brighten and the clock counts down. At **${mmss(RUN_SPAWN_STOP_MINUTE)}**`)
  lines.push('spawning stops entirely, the field empties, and the thing you have been building toward')
  lines.push('walks in.', '')
  lines.push('| Time | Encounter | HP | Target | Phase ticks |', '|---|---|---|---|---|')
  for (const id of ENCOUNTER_ORDER) {
    const e = ENCOUNTERS[id]
    const ticks = e.phases.length === 0 ? '—' : e.phases.map((p) => `${Math.round(p * 100)}%`).join(' · ')
    lines.push(`| ${mmss(e.minute)} | ${e.name} | ${e.hp} | ${e.targetSeconds} s | ${ticks} |`)
  }
  lines.push('')
  lines.push(`Every boss kill banks salvage and starts a **${RELEASE_BEAT_SECONDS}-second release beat** — spawning stops,`)
  lines.push('heat drains, and the field\'s wrecks become visible at the edge of vision, named and')
  lines.push('ageing, some of them yours. It is also where the bezel\'s board tile brightens, because')
  lines.push('twenty seconds of free hands is where ten seconds of wanted head belong.', '')
  lines.push(`THE FOUNDRY's third phase vents **+${FOUNDRY_VENT_HEAT} region heat** into your board, and from`)
  lines.push(`**${FOUNDRY_ESCALATION_FACTOR}x the fight's target length** it steps +${FOUNDRY_ESCALATION_STEP} every ${FOUNDRY_ESCALATION_INTERVAL} seconds, uncapped. That is`)
  lines.push('the fight\'s only end condition, and a competent player never learns it exists.')
  return lines.join('\n')
}

/** §145.6 — emitted from the items, so a total cannot be restated without them moving. */
export const renderSchedule = (): string => {
  const lines: string[] = []
  const ea = estimate(EA_PHASES)
  const all = estimate(PHASE_ORDER)
  lines.push('## The schedule', '')
  lines.push('_Generated from the deliverable list in `src/data/plan.ts` (§145.6). §21 stated 19-24')
  lines.push('sessions while its own rows summed to 20-26, and twenty passes then added 7.3-10.6')
  lines.push('sessions of scope while declaring the total unchanged. **An addition is costed against')
  lines.push('the increment, never against the total.**_', '')
  lines.push('| Phase | | Sessions | Deliverables |', '|---|---|---|---|')
  for (const phase of PHASE_ORDER) {
    const e = phaseEstimate(phase)
    const n = DELIVERABLES.filter((d) => d.phase === phase).length
    lines.push(`| ${phase} | ${PHASE_NAMES[phase]} | ${e.low}–${e.high} | ${n} |`)
  }
  lines.push(`| | **To Early Access** | **${ea.low}–${ea.high}** | ${DELIVERABLES.filter((d) => EA_PHASES.includes(d.phase)).length} |`)
  lines.push(`| | **To 1.0** | **${all.low}–${all.high}** | ${DELIVERABLES.length} |`)
  lines.push('')
  lines.push('### The items', '')
  lines.push('| Phase | Sessions | Deliverable | Added by |', '|---|---|---|---|')
  for (const d of DELIVERABLES) {
    lines.push(`| ${d.phase} | ${d.low}–${d.high} | ${d.what} | ${d.source} |`)
  }
  return lines.join('\n')
}

/** §71.3 — the single highest-value line in the resume set, and it costs one string. */
export const renderCoverage = (): string =>
  ['## Assertion coverage', '', '```', coverageTable(), '```'].join('\n')

/** §71.4, re-derived in §136.3. */
export const renderCommits = (): string => {
  const lines: string[] = ['## The first ten commits', '']
  lines.push('_Ordered by dependency. Commits 1-3 contain no gameplay on purpose: they are the three')
  lines.push('machines that make every later session cheap — the external signal, the source of')
  lines.push('truth, and the contract._', '')
  for (const c of COMMITS) lines.push(`${c.n}. **${c.what}** — ${c.why}`)
  lines.push('')
  lines.push('### The canonical homes', '')
  lines.push('_§135.4: a canonical home is a **budget**, not just a location._', '')
  lines.push('| File | Holds | Source | Token ceiling | Generated |', '|---|---|---|---|---|')
  for (const h of CANONICAL_HOMES) {
    lines.push(`| \`${h.file}\` | ${h.holds} | ${h.source} | ${h.tokenCeiling} | ${h.generated ? 'yes' : 'no'} |`)
  }
  return lines.join('\n')
}

export const ROADMAP_REGIONS: Readonly<Record<string, () => string>> = Object.freeze({
  'roadmap-run': renderRun,
  'roadmap-schedule': renderSchedule,
  'roadmap-coverage': renderCoverage,
  'roadmap-commits': renderCommits,
})

/** Writes every generated region of an authored file, and nothing outside them. */
export const renderRoadmap = (existing: string): string => {
  let out = existing
  for (const [id, body] of Object.entries(ROADMAP_REGIONS)) out = splice(out, id, body())
  return out
}

// ───────────────────────────────────────────────────────────────────── the main

export interface Generated { readonly path: string; readonly render: () => string }

export const WHOLE_FILES: readonly Generated[] = Object.freeze([
  { path: 'docs/appendix-a.md', render },
  { path: 'LAWS.md', render: renderLaws },
  { path: 'DECISIONS.md', render: renderDecisions },
  { path: 'PIPELINE.md', render: renderPipeline },
])

const isMain = process.argv[1]?.endsWith('gendocs.ts')
if (isMain) {
  const root = new URL('../', import.meta.url)
  for (const file of WHOLE_FILES) {
    writeFileSync(new URL(file.path, root), file.render())
    console.log(`wrote ${file.path}`)
  }
  const roadmapPath = new URL('ROADMAP.md', root)
  const existing = readFileSync(roadmapPath, 'utf8')
  const next = renderRoadmap(existing)
  if (next !== existing) writeFileSync(roadmapPath, next)
  console.log(`wrote ROADMAP.md (${Object.keys(ROADMAP_REGIONS).length} regions, authored text untouched)`)
}
