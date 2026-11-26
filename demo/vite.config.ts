import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    forwardConsole: {
      unhandledErrors: true,
      logLevels: ["warn", "error"],
    },
    proxy: {
      // string shorthand:
      // http://localhost:5173/foo
      //   -> http://localhost:4567/foo
      // '/northwind_small.sqlite': {
      //   target: 'https://www.timestored.com/data/sample/',
      //   changeOrigin: true,
      //   // rewrite: (path) => path.replace(/^\/db/, ''),
      // },
    },
    headers: {
      // Required for SharedArrayBuffer & multi-threaded Web Workers
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ["wa-sqlite"],
  },
  input: {
    main: resolve(import.meta.dirname, "index.html"),
    fullDb: resolve(import.meta.dirname, "full-db/index.html"),
    chunkedDb: resolve(import.meta.dirname, "chunked-db/index.html"),
  },
  appType: "mpa",
});
