/**
 * Assertion coverage, per phase — the single highest-value line in §63.4's resume
 * set, and it costs one generated string.
 *
 * A session with no memory needs an unambiguous "where am I", and no amount of
 * narrative provides one. `phase 2: 4/25 implemented, 41 planned` does.
 *
 * `tools/gendocs.ts` writes this between ROADMAP.md's sentinels once that file
 * exists (§147.2 — generators write only inside their region, and CI fails in both
 * directions). Until then it prints, and `npm run coverage` is how a session asks.
 */
import { ASSERTIONS, PLANNED, coverage } from '../tests/assertions.ts'
import type { Phase } from '../tests/assertions.ts'

const PHASES: readonly Phase[] = [1, 2, 3, 4, 5, 6]

export const render = (): string => {
  const lines = PHASES.map((phase) => {
    const { implemented, seeded, planned } = coverage(phase)
    // `seeded` and `planned` are different numbers on purpose: a phase is seeded as
    // its work is reached, and PLANNED is §71.2's measured total, so the gap is
    // visible rather than quietly absent.
    const seed = seeded === planned ? 'seeded' : `${seeded} seeded`
    return `phase ${phase}: ${implemented}/${seeded} implemented · ${planned} planned (${seed})`
  })
  const done = ASSERTIONS.filter((x) => x.status === 'implemented').length
  const total = PHASES.reduce((n, p) => n + PLANNED[p], 0)
  lines.push(`total:   ${done}/${ASSERTIONS.length} implemented · ${total} planned`)

  const failing = ASSERTIONS.filter((x) => x.status === 'expected-fail')
  if (failing.length > 0) {
    // §115.7 — §88 wrote an assertion it expected to fail and left it for twenty-seven
    // passes while two other passes quietly supplied the answer. An assertion with no
    // owner is a note, so this list is never allowed to go quiet.
    lines.push('', 'expected-fail (§115.7 — report at every phase boundary):')
    for (const x of failing) lines.push(`  ${x.id} ${x.source} — ${x.statement}`)
  }
  return lines.join('\n')
}

if (import.meta.filename === process.argv[1]) console.log(render())
