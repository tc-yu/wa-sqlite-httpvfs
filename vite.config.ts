import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'wa-sqlite-httpvfs',
      // the proper extensions will be added
      // fileName: 'my-lib',
    },
    rolldownOptions: {
      output: {
        entryFileNames: `[name].js`,
      },
    },
  },
})