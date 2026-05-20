import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const apiTarget = process.env.VITE_API_TARGET ?? "http://localhost:3000";
const isDocker = process.env.IS_DOCKER === "true";
const usePolling = isDocker || process.env.VITE_USE_POLLING === "true";
const clientPort = Number(process.env.CLIENT_PORT ?? 5173);

export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
    }),
    react(),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    hmr: {
      host: "localhost",
      clientPort,
      protocol: "ws",
    },
    watch: usePolling
      ? {
          usePolling: true,
          interval: 300,
          ignored: ["**/node_modules/**", "**/.git/**"],
        }
      : undefined,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
  },
});