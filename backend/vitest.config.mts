import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "src/handlers/**/*.ts",
        "src/validators/**/*.ts",
        "src/services/passwordService.ts",
        "src/services/tokenService.ts",
        "src/services/monthlyDates.ts",
        "src/services/monthlyPaymentService.ts",
      ],
    },
  },
});
