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
  // Vitest 환경에서 JSX 자동 런타임을 사용해
  // 컴포넌트 파일에 React import가 없어도 "React is not defined"가 발생하지 않게 한다.
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
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

