import { defineConfig } from "vitest/config";

// Separate config so `npm test` (plain unit tests, no emulator needed)
// never accidentally tries to run this — it requires the Firestore
// emulator already running (see the repo-root `npm run test:rules`).
export default defineConfig({
  test: {
    environment: "node",
    include: ["firestore.rules.test.ts"],
    testTimeout: 20000,
  },
});
