import { defineConfig } from "vite";
import { resolve } from "node:path";

const root = resolve(__dirname);
const workspaceRoot = resolve(__dirname, "..");

export default defineConfig({
  root,
  server: {
    port: 5174,
    fs: {
      allow: [workspaceRoot],
    },
  },
  build: {
    outDir: resolve(root, "dist"),
    emptyOutDir: true,
  },
});
