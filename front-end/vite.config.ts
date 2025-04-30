import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.VITE_NODE_ENV !== "production" &&
    process.env.VITE_REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve("../front-end/client/src"),
      "@shared": path.resolve("../front-end/shared"),
      "@assets": path.resolve("../front-end/attached_assets"),
    },
  },
  root: "./client",
  build: {
    outDir: "./dist/public",
    emptyOutDir: true,
  },
});
