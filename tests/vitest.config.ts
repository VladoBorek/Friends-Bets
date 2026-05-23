import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    setupFiles: ["./test-setup.ts"],
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/db",
      JWT_SECRET: "test-secret-only-for-vitest",
    },
  },
  resolve: {
    alias: {
      "@client": resolve(__dirname, "../client/src"),
      "@server": resolve(__dirname, "../server/src"),
      "@pb138/shared": resolve(__dirname, "../shared/src"),
    },
  },
});
