import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
        HttpHelper: resolve(import.meta.dirname, "src/HttpHelper.ts"),
        prepareDb: resolve(import.meta.dirname, "src/prepareDb.ts"),
      },
      name: "wa-sqlite-httpvfs",
      // the proper extensions will be added
      // fileName: 'my-lib',
    },
    rolldownOptions: {
      output: {
        comments: {
          legal: true,
        },
        entryFileNames: `[name].js`,
        banner: (chunk) =>
          chunk.name === "prepareDb" ? "#!/usr/bin/env node" : "",
      },
    },
  },
});
