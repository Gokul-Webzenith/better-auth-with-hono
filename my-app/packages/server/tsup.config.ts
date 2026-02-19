import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',

  outDir: 'dist',
  clean: true,
  sourcemap: false,

  splitting: false,
  bundle: true,

 
  noExternal: ['@repo/db'],

  // Native deps only
  external: ['pg'],
})
