/**
 * The text-rendering rule (§140.2, scoped by §147.1).
 *
 * §39.2 measured `fillText` at 10-50x a `drawImage` and fixed twelve glyphs. §140.5
 * counted what the rest became: 29 live text runs a frame worth 290-1,450
 * draw-equivalents against a 103-draw margin, and 480 more on the Hall — the screen
 * §101.2 makes the game's home.
 *
 * The rule is NOT "no `fillText` anywhere", and the difference matters. §141 shipped
 * Simplified Chinese one pass after §140.2 designed a bounded glyph atlas, and a
 * glyph atlas is bounded for an alphabet and unbounded for a logographic script — at
 * 900 hanzi across three scales it is 7.1 MB against 0.8. So CJK prose renders with
 * `fillText` from §141.1's subsetted face, and the rule sharpens rather than bends:
 *
 *   NO `fillText` ON A FRAME THAT ALSO RENDERS ENTITIES.
 *
 * A module that draws prose and no entities — the build report, the codex, the Hall,
 * the settings screen, the run-end sequence — declares `export const ENTITY_FREE =
 * true` and may call it. Everything else may not, and the declaration is the thing a
 * reviewer reads, which is why it is a declaration rather than a comment.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, sep } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DRAW_ROOTS = ['render', 'ui', 'growth'] as const

export interface TextViolation {
  readonly file: string
  readonly line: number
  readonly why: string
}

const ENTITY_FREE = /export const ENTITY_FREE = true/

export const scanText = (file: string, source: string): TextViolation[] => {
  if (ENTITY_FREE.test(source)) return []
  const out: TextViolation[] = []
  source.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return
    if (/\bfillText\s*\(/.test(line)) {
      out.push({
        file, line: i + 1,
        why: 'fillText on a frame that may render entities; blit from the boot atlas, or declare ENTITY_FREE.',
      })
    }
  })
  return out
}

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

export const lintText = (): TextViolation[] => {
  const out: TextViolation[] = []
  for (const root of DRAW_ROOTS) {
    for (const path of walk(join(ROOT, 'src', root))) {
      out.push(...scanText(relative(ROOT, path).split(sep).join('/'), readFileSync(path, 'utf8')))
    }
  }
  return out
}

if (import.meta.filename === process.argv[1]) {
  const violations = lintText()
  for (const v of violations) console.error(`${v.file}:${v.line}  ${v.why}`)
  console.log(violations.length === 0 ? 'text: clean' : `text: ${violations.length} violation(s)`)
  process.exitCode = violations.length === 0 ? 0 : 1
}
