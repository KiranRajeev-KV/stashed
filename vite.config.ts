import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { tanstackRouter } from "@tanstack/router-plugin/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    cloudflare(),
    tailwindcss(),
  ],
  // Keep the OAuth callback origin stable. GitHub requires the redirect URI to
  // exactly match one of the URLs configured for the GitHub App.
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
