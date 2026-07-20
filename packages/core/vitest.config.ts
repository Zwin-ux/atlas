import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // National generation suites can exceed the default 5s under load.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
