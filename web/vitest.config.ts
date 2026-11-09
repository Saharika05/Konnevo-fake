import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for the Core admin: pnpm test:unit
export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/unit/setup.ts"],
    globals: false,
  },
});
