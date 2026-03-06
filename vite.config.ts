import { defineConfig } from "vite";

/**
 * Bundles dependencies into dist/segment-gauge.js (no bare imports at runtime).
 */
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: () => "segment-gauge.js",
    },
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "test/setup.ts",
    globals: true,
  },
});
