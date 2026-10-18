import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // In production Vercel serves /api functions itself. In dev we run `vercel dev`
  // on :3000 and proxy /api requests to it so uploads & messages work on localhost.
  server: {
    port: 5173,
    proxy: {
      "^/api/(.*)": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
