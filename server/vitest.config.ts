import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      JWT_SECRET: "test-secret-only-for-vitest",
    },
  },
});
