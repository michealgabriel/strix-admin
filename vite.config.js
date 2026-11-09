import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  build: {
    // React, the router, Redux and Radix together are ~190 kB gzipped; pages load on demand
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 3000,
    host: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    css: false,
    env: { VITE_API_URL: "http://api.test/api" },
  },
});
