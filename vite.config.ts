import { readFileSync } from "node:fs";
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
          formats: ["es"],
        },
        rolldownOptions: {
          output: {
            comments: {
              legal: true,
              jsdoc: false,
            },
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
                return "#!/usr/bin/env node\n";
              }
              return "";
            },
          },
        },
      },
    },
  },
  plugins: [
    {
      name: "emit-custom-dts",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "wa-sqlite.d.ts", // Output path relative to dist/
          source: readFileSync(
            resolve(import.meta.dirname, "src/wa-sqlite.d.ts"),
            "utf-8",
          ),
        });
      },
    },
  ],
});
