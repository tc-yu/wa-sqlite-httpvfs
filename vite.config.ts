import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  environments: {
    client: {
      build: {
        lib: {
          entry: {
            index: resolve(import.meta.dirname, "src/index.ts"),
            HttpHelper: resolve(import.meta.dirname, "src/HttpHelper.ts"),
          },
          name: "wa-sqlite-httpvfs",
        },
        rolldownOptions: {
          output: {
            comments: {
              legal: true,
              jsdoc: false,
            },
            entryFileNames: `[name].js`,
          },
          external: [/^wa-sqlite($|\/)/],
        },
      },
    },
    node: {
      consumer: "server",
      build: {
        emptyOutDir: false,
        lib: {
          entry: {
            prepareDb: resolve(import.meta.dirname, "src/prepareDb.ts"),
          },
          formats: ["es"],
        },
        rolldownOptions: {
          output: {
            comments: {
              legal: true,
              jsdoc: false,
            },
            entryFileNames: `[name].js`,
            banner: (chunk) => {
              // Add shebang only to the CLI entry points
              if (chunk.name === "prepareDb") {
                return "#!/usr/bin/env node";
              }
              return "";
            },
          },
        },
      },
    },
  },
});
