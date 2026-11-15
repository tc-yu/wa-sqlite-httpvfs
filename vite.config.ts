import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        cli: resolve(import.meta.dirname, 'src/cli.ts'),
      },
      name: 'wa-sqlite-httpvfs',
      // the proper extensions will be added
      // fileName: 'my-lib',
    },
    rolldownOptions: {
      output: {
        entryFileNames: `[name].js`,
        banner: (chunk) =>
          chunk.name === 'cli' ? '#!/usr/bin/env node' : '',
      },
    },
  },
})