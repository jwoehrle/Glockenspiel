import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";

// Live site: https://jwoehrle.github.io/Glockenspiel/
// Pull-request previews (see .github/workflows/pages.yml) are built with
//   BASE_PATH=/Glockenspiel/pr-preview/pr-<n>/  VITE_PREVIEW="PR <n>"
const base = process.env.BASE_PATH ?? "/Glockenspiel/";
const preview = process.env.VITE_PREVIEW;

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      // Keep the worker at /Glockenspiel/sw.js, the same URL as before, so installed apps pick it up.
      injectManifest: { globPatterns: ["**/*.{js,css,html,png,webmanifest}"] },
      injectRegister: false,
      manifest: {
        name: preview ? `Mein Glockenspiel (${preview})` : "Mein Glockenspiel",
        short_name: preview ? `Glockenspiel ${preview}` : "Glockenspiel",
        description: "Glockenspiel-Lieder lernen mit Farben und Mikrofon",
        lang: "de",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "any",
        background_color: "#FBF6EE",
        theme_color: "#FBF6EE",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
