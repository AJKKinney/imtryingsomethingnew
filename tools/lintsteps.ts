/**
 * The step-declaration rule (§142.6).
 *
 * §26 stated the stakes in pass 26 — "ordering IS the simulation's semantics and a
 * reordering is a silent desync" — and then sat in a paragraph while a hundred and
 * fifteen passes added twenty-two tick-ordered behaviours to it, FOURTEEN of which
 * landed nowhere. The one that was ever checked was checked by accident.
 *
 * So a simulation module declares the step it runs at and the world attributes it
 * owns, the loop is generated from the manifest rather than hand-wired, and this
 * fails the build on the four ways that can go wrong.
 *
 * What this file enforces STATICALLY: a step id the manifest does not contain, two
 * modules claiming one step, two modules claiming one attribute, and a direct
 * assignment to a world attribute the module does not own. What it cannot see is a
 * mutation THROUGH a reference (`const h = world.hash; h.count = 0`), which is why
 * `tests/unit/loop.test.ts` also fingerprints every top-level attribute around every
 * step and fails when an unowned one moves. Declaration, text and behaviour: the
 * third is the one that actually holds.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Simulation systems. `render/` never writes to the world at all (§14, §145.4). */
const SIM_ROOTS = ['core', 'grid', 'game', 'ui', 'growth'] as const

export interface StepViolation {
  readonly file: string
  readonly why: string
}

const STEP_RE = /export const STEP = '([a-z]+)'/
const WRITES_RE = /export const WRITES: readonly string\[\] = \[([^\]]*)\]/
/** `world.x =`, `world.x +=`, `world.x++` and the same through a short alias. */
const ASSIGN_RE = /\b(?:world|w)\.([A-Za-z_$][\w$]*)\s*(?:=[^=]|\+\+|--|[-+*/%|&^]=)/g

const walk = (dir: string): string[] => {
  let out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) out = out.concat(walk(path))
    else if (path.endsWith('.ts')) out.push(path)
  }
  return out
}

export const lintSteps = (manifestIds: readonly string[]): StepViolation[] => {
  const out: StepViolation[] = []
  const claimedStep = new Map<string, string>()
  const claimedWrite = new Map<string, string>()

  for (const root of SIM_ROOTS) {
    for (const path of walk(join(ROOT, 'src', root))) {
      const file = relative(ROOT, path).split(sep).join('/')
      const source = readFileSync(path, 'utf8')
      const step = STEP_RE.exec(source)?.[1]
      const writesRaw = WRITES_RE.exec(source)?.[1]

      const assigned = new Set<string>()
      for (const [, attr] of source.matchAll(ASSIGN_RE)) if (attr !== undefined) assigned.add(attr)

      if (step === undefined) {
        // A module that touches the world and claims no step is a behaviour with no
        // place in the order — §142.1's fourteen, exactly.
        if (assigned.size > 0) {
          out.push({ file, why: `writes world.${[...assigned].join(', world.')} and declares no STEP` })
        }
        continue
      }

      if (!manifestIds.includes(step)) {
        out.push({ file, why: `declares step '${step}', which src/data/tickorder.ts does not contain` })
      }
      const other = claimedStep.get(step)
      if (other !== undefined) out.push({ file, why: `claims step '${step}', already claimed by ${other}` })
      claimedStep.set(step, file)

      if (writesRaw === undefined) {
        out.push({ file, why: 'declares a STEP and no WRITES; ownership is not optional' })
        continue
      }
      const writes = [...writesRaw.matchAll(/'([^']+)'/g)].map((m) => m[1] ?? '')
      for (const attr of writes) {
        const owner = claimedWrite.get(attr)
        if (owner !== undefined) out.push({ file, why: `claims world.${attr}, already owned by ${owner}` })
        claimedWrite.set(attr, file)
      }
      for (const attr of assigned) {
        // `tick` is the loop's own, written at step 24 and by nobody else.
        if (attr === 'tick') {
          out.push({ file, why: 'writes world.tick; step 24 owns it' })
        } else if (!writes.includes(attr)) {
          out.push({ file, why: `writes world.${attr} without declaring it in WRITES` })
        }
      }
    }
  }
  return out
}

if (import.meta.filename === process.argv[1]) {
  const { TICK_ORDER } = await import('../src/data/tickorder.ts')
  const violations = lintSteps(TICK_ORDER.map((s) => s.id))
  for (const v of violations) console.error(`${v.file}  ${v.why}`)
  console.log(violations.length === 0 ? 'steps: clean' : `steps: ${violations.length} violation(s)`)
  process.exitCode = violations.length === 0 ? 0 : 1
}
