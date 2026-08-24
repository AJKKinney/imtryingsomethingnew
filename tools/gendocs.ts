// §63.3 — Appendix A is GENERATED from src/data/, and CI fails on drift. The
// dependency inverts: code is the specification, the document is a rendered view.
// §147.2 — a file is generated, authored, or a source; where it must be more than
// one, the generated regions are marked by sentinels and enforced BOTH ways.

import { writeFileSync } from 'node:fs'
import { PARTITIONS, MODEL_VERSION, type Provenance } from '../src/data/index.ts'

export const BEGIN = '<!-- BEGIN GENERATED: appendix-a -->'
export const END = '<!-- END GENERATED: appendix-a -->'

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

const isMain = process.argv[1]?.endsWith('gendocs.ts')
if (isMain) {
  const out = new URL('../docs/appendix-a.md', import.meta.url)
  writeFileSync(out, render())
  console.log(`wrote ${out.pathname}`)
}
