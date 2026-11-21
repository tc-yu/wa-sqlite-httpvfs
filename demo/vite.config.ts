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
  appType: "mpa",
});
