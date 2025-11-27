import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import * as tsconfigPaths from "tsconfig-paths";

tsconfigPaths.register({
  baseUrl: __dirname,
  paths: {
    "@/*": ["./*"],
  },
});

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});

