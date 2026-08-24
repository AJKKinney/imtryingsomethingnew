// The document sources, and the reason they are a second registry rather than more
// partitions.
//
// §63.3 makes `src/data/` the specification and Appendix A a rendered view of the
// CONSTANTS. Laws, decisions, strings, assets and the schedule are specification too,
// and they are not constants — so registering them beside the partitions would do
// three wrong things at once.
//
// It would bury eighty gameplay numbers under three hundred rows of prose in the one
// table §63.4 tells a session to read. It would fold them into §16's content hash,
// where **a reworded law would invalidate every replay, every snapshot and every
// share code in existence** — a content hash gates simulation compatibility, so only
// what the simulation runs on belongs in it. And it would pull all of it into the web
// bundle: §139.1's ceiling is 700 KB and §64.2 prices the first three seconds of a
// link-click at a tier of commercial outcome, so a graveyard of prose riding along
// with the game is not free. It was 58 KB when this file was written, which is how
// the problem was found — the bundle grew and nothing had asked it to.
//
// **A document source is not a runtime import** (§145.4, one layer out): `tools/` and
// `tests/` read this file, and the game does not. `strings.ts` is the one exception
// and it earns it — §141.4 makes those two lists the runtime string table, so the
// game imports it directly rather than through here.
//
// They keep the provenance discipline: A-004 walks both registries.
import * as assets from './assets.ts'
import * as builds from './builds.ts'
import * as decisions from './decisions.ts'
import * as laws from './laws.ts'
import * as plan from './plan.ts'
import * as strings from './strings.ts'
import type { Partition } from './index.ts'

export { assets, builds, decisions, laws, plan, strings }

export const DOCUMENTS: readonly Partition[] = Object.freeze([
  { name: 'laws', module: laws, provenance: laws.provenance },
  { name: 'decisions', module: decisions, provenance: decisions.provenance },
  { name: 'plan', module: plan, provenance: plan.provenance },
  { name: 'strings', module: strings, provenance: strings.provenance },
  { name: 'assets', module: assets, provenance: assets.provenance },
  // §148.4's four products and twenty-three flags. It belongs here for a reason the
  // other five do not share: §16's content hash is computed over the partitions, and
  // §80.2 promises that web and Steam play the IDENTICAL daily. A flag matrix inside
  // the hash would give one seed a different fingerprint per product, and §119.8's
  // fairness check — two live runs, one hash — would fail on two runs that agree.
  { name: 'builds', module: builds, provenance: builds.provenance },
])
