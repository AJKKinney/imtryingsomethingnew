import { defineConfig } from 'vite'

// §148.4: the target is a build input. MELTLINE_TARGET selects one of the four
// products; §148.1's flag set is resolved from src/data/builds at build time.
const target = process.env.MELTLINE_TARGET ?? 'web'

export default defineConfig({
  base: './',
  define: { __MELTLINE_TARGET__: JSON.stringify(target) },
  build: {
    target: 'es2022',
    outDir: `dist/${target}`,
    assetsInlineLimit: 0,
    reportCompressedSize: true,
  },
})
