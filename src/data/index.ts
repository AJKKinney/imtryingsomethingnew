// The specification's registry. §63.3: `src/data/` is authoritative and Appendix A
// is a rendered view of it — so a session that changes a number changes it once.
// §135.3 partitions this by system so a slice reads its own systems and an index,
// rather than 18,028 tokens of everything.

import * as cores from './cores.ts'
import * as emitters from './emitters.ts'
import * as encounters from './encounters.ts'
import * as enemies from './enemies.ts'
import * as heat from './heat.ts'
import * as player from './player.ts'
import * as waves from './waves.ts'
import * as builds from './builds.ts'
import * as tickorder from './tickorder.ts'
import type { ProvenanceRecord } from './meta.ts'

export * from './meta.ts'
export { cores, emitters, encounters, enemies, heat, player, waves, builds, tickorder }

export interface Partition {
  readonly name: string
  readonly module: Record<string, unknown>
  readonly provenance: ProvenanceRecord
}

/** Every data module, in generation order. Appendix A is emitted from this list. */
export const PARTITIONS: readonly Partition[] = Object.freeze([
  { name: 'player', module: player, provenance: player.provenance },
  { name: 'heat', module: heat, provenance: heat.provenance },
  { name: 'cores', module: cores, provenance: cores.provenance },
  { name: 'enemies', module: enemies, provenance: enemies.provenance },
  { name: 'emitters', module: emitters, provenance: emitters.provenance },
  { name: 'waves', module: waves, provenance: waves.provenance },
  { name: 'encounters', module: encounters, provenance: encounters.provenance },
  { name: 'tickorder', module: tickorder, provenance: tickorder.provenance },
  { name: 'builds', module: builds, provenance: builds.provenance },
])
