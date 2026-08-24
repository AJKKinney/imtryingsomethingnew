/**
 * The no-transcendentals lint rule (§14).
 *
 * IEEE-754 exactly specifies `+ - * / %` and `Math.sqrt`. It does NOT specify
 * `sin cos tan atan2 pow exp log`, which legitimately differ across engines,
 * versions and platforms. One of those in the simulation desynchronises replays,
 * crash reproduction, balance sweeps, leaderboard verification, PAR and the daily
 * — silently, and in a way that looks like a mysterious bug rather than a spec
 * violation, which is exactly why it is caught at authoring time instead.
 *
 * Rendering is deliberately exempt: §14 says "rendering may use whatever it likes
 * — it never feeds back into the sim", so the scope is the simulation and the data
 * it runs on, not the whole tree.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** The simulation and everything it reads. `render/`, `ui/` and `growth/` are exempt. */
export const SIM_DIRS = ['src/core', 'src/data', 'src/gen', 'src/grid', 'src/game'] as const

/** Exactly specified for every input the language accepts, so exactly reproducible. */
const ALLOWED_MATH = new Set([
  'sqrt', 'floor', 'ceil', 'round', 'trunc', 'abs', 'sign', 'min', 'max',
  // Exact 32-bit integer multiply. `core/rng` needs it: a plain `*` would lose
  // precision above 2^53 and produce a different sequence on a different engine,
  // which is the failure this rule exists to prevent rather than an instance of it.
  'imul',
  'fround',
  // Not functions, and the constants are exact doubles.
  'PI', 'E', 'LN2', 'LN10', 'SQRT2',
])

export interface Violation {
  readonly file: string
  readonly line: number
  readonly text: string
  readonly why: string
}

/** An author who needs an exception says so, on the line or the one above it. */
const ALLOW = /\/\/\s*lint-math-allow:/

const MATH_MEMBER = /\bMath\.([A-Za-z0-9_]+)/g

/**
 * Removes string literals and trailing line comments, so the check reads CODE.
 * Deliberately crude — it does not parse — because the failure mode of a crude
 * stripper is a violation hidden inside a template expression, and a template
 * expression that calls `Math.sin` in the simulation would also have to survive
 * `tsc`, the step manifest and A-005's golden hash to reach a player.
 */
export const strip = (line: string): string =>
  line
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\$]|\\.|\$(?!\{))*`/g, '``')
    .replace(/\/\/.*$/, '')

export const scan = (file: string, source: string): Violation[] => {
  const found: Violation[] = []
  const lines = source.split('\n')
  lines.forEach((line, i) => {
    const previous = lines[i - 1] ?? ''
    if (ALLOW.test(line) || ALLOW.test(previous)) return
    // A line that is only a comment is prose about the rule, not a use of it. This is
    // what lets this file, and every module that explains WHY it may not call sin,
    // survive its own check.
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return

    // And a STRING is not a call either. `src/data/laws.ts` states the rule verbatim
    // and `src/data/decisions.ts` records the decision that established it — both in
    // quoted prose, and both flagged by this check the moment those files existed.
    // A lint that fires on a document describing the lint teaches a session to add
    // exception comments, which is exactly how the rule stops meaning anything.
    const code = strip(line)

    for (const [, member] of code.matchAll(MATH_MEMBER)) {
      if (member === undefined || ALLOWED_MATH.has(member)) continue
      found.push({
        file, line: i + 1, text: line.trim(),
        why: member === 'random'
          ? 'Math.random cannot be seeded, so the run is not a function of (seed, input log).'
          : `Math.${member} is implementation-defined; use core/fixedmath.`,
      })
    }
    if (/\*\*/.test(code) && !/\/\*\*/.test(code)) {
      found.push({ file, line: i + 1, text: line.trim(), why: '** is Math.pow by another name.' })
    }
    if (/\b(Date\.now|performance\.now)\b/.test(code)) {
      found.push({ file, line: i + 1, text: line.trim(), why: 'Wall clock is an unrecorded input.' })
    }
    if (/\bfor\s*\(\s*(const|let|var)\s+\w+\s+in\s/.test(code)) {
      found.push({
        file, line: i + 1, text: line.trim(),
        why: 'Object key order is not part of the simulation; entities live in dense arrays.',
      })
    }
  })
  return found
}

const walk = (dir: string): string[] => {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out = out.concat(walk(path))
    else if (path.endsWith('.ts')) out.push(path)
  }
  return out
}

export const lintMath = (): Violation[] => {
  const out: Violation[] = []
  for (const dir of SIM_DIRS) {
    const abs = join(ROOT, ...dir.split('/'))
    let files: string[]
    try {
      files = walk(abs)
    } catch {
      continue // A system that does not exist yet cannot violate the rule.
    }
    for (const file of files) {
      out.push(...scan(relative(ROOT, file).split(sep).join('/'), readFileSync(file, 'utf8')))
    }
  }
  return out
}

if (import.meta.filename === process.argv[1]) {
  const violations = lintMath()
  for (const v of violations) console.error(`${v.file}:${v.line}  ${v.why}\n    ${v.text}`)
  console.log(violations.length === 0 ? 'no-transcendentals: clean' : `no-transcendentals: ${violations.length} violation(s)`)
  process.exitCode = violations.length === 0 ? 0 : 1
}
