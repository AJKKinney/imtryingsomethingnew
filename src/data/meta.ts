// The specification's own schema.
//
// §63.3 inverted the source of truth: `src/data/` is authoritative and Appendix A
// is generated from it, so a session that changes a number changes it in one place.
// Three earlier findings are enforced here rather than remembered:
//
//   §96.6  every constant is tagged with the SYSTEM it belongs to, and a system is
//          audited whole or not at all.
//   §61.5  every constant records the AXES it is denominated in and the model
//          version each was last derived against; a model bump fails the build for
//          everything still stamped with the old one.
//   §131.6 a value is `authored` or `solved`, never both — and a solved value
//          carries the procedure that emits it.
//   §72.3  a value measured against the Python surrogate is a PRIOR until phase 3b
//          replaces it; `derivedFrom` says which, and nothing may reach 1.0 still
//          marked `surrogate`.

/** §96.6 — a system is audited whole. §135.3 partitions the resume set by this tag. */
export type System =
  | 'heat' | 'power' | 'board' | 'draft' | 'pickups'
  | 'economy' | 'field' | 'meta' | 'render' | 'ui' | 'build'

/** §61.5 — the two derived quantities, plus the axes that are not quantities. */
export type Axis = 'heat' | 'damage' | 'positioning' | 'bands' | 'provenance'

/** §61.5 — a model version per axis. A bump fails every constant not re-derived. */
export const MODEL_VERSION: Readonly<Record<Axis, number>> = Object.freeze({
  heat: 3,        // §31.1 equilibrium → §50–51 work-based → §58 overclock feedback
  damage: 4,      // §25 → §45 → §48 → §61.3, and §117.5's removal of crit
  positioning: 1, // §68's repositioning; §86.3 declared the axis, §87 ran it
  bands: 4,       // §89.3 · §90.3 · §93.1 policy · §120.7 duty · §149.4 cadence
  provenance: 1,  // §102.6's authored-by split
})

/** §72.3 — every number here is a prior until the real sweep replaces it. */
export type DerivedFrom = 'surrogate' | 'real-sim' | 'external' | 'definition'

/** §131.6 — authored or solved, never both. */
export type Provenance =
  | { kind: 'authored'; system: System; axes: Axis[]; source: string; derivedFrom: DerivedFrom }
  | {
      kind: 'solved'
      system: System
      axes: Axis[]
      source: string
      derivedFrom: DerivedFrom
      /** The procedure that emits it. §131.6: a solved value committed by hand fails CI. */
      solvedBy: string
    }

/** One module's provenance record: every exported constant name must appear. */
export type ProvenanceRecord = Readonly<Record<string, Provenance>>

/** §100.7 — a claim about the world carries the date it was checked, never reasoning. */
export interface ExternalClaim {
  readonly claim: string
  readonly source: string
  readonly verifiedAgainst: string
}

/**
 * §118.5 — every random draw is a weighted distribution object, never a range
 * literal. A range is a summary of a distribution, and this document shipped the
 * summaries for a hundred and eighteen sections.
 */
export interface Weighted<T> {
  readonly value: T
  readonly weight: number
}

export const distribution = <T>(entries: readonly Weighted<T>[]): readonly Weighted<T>[] => {
  const total = entries.reduce((sum, e) => sum + e.weight, 0)
  if (Math.abs(total - 1) > 1e-9) {
    throw new Error(`distribution weights must sum to 1, got ${total}`)
  }
  return Object.freeze(entries.map((e) => Object.freeze(e)))
}

export const mean = (entries: readonly Weighted<number>[]): number =>
  entries.reduce((sum, e) => sum + e.value * e.weight, 0)
