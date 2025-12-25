import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },

  // ✅ REQUIRED for GitHub Pages
  base: "/stopwatch/",

  plugins: [
    react(),
    mode === "development" && componentTagger(),

    VitePWA({
      registerType: "autoUpdate",

      // ✅ Files must be inside /public
      includeAssets: ["icon-192.png", "icon-512.png"],

      manifest: {
        name: "Stopwatch - Modern Time Tracker",
        short_name: "Stopwatch",
        description:
          "A modern, aesthetic stopwatch with lap tracking and history features.",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "any",

        // ✅ GitHub Pages paths
        scope: "/stopwatch/",
        start_url: "/stopwatch/",

        icons: [
          {
            src: "/stopwatch/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/stopwatch/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },

      workbox: {
        // ✅ Fix blank page on refresh
        navigateFallback: "/stopwatch/index.html",
        navigateFallbackDenylist: [/^\/api/],

        // ✅ Correct asset caching
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],

        // ✅ Required for custom notifications
        importScripts: ['/stopwatch/sw-custom.js'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
