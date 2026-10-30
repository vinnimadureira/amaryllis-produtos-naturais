import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "https://www.imperiocones.com.br",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Registramos o SW manualmente apenas dentro do /admin autenticado.
      registerType: "prompt",
      injectRegister: null,
      // Não injeta <link rel="manifest"> automaticamente — adicionamos
      // dinamicamente só quando o admin está logado.
      manifest: false,
      includeAssets: ["pwa-icon-192.png", "pwa-icon-512.png"],
      // Manifest gerado em /admin-manifest.webmanifest, exposto sob demanda.
      manifestFilename: "admin-manifest.webmanifest",
      devOptions: {
        enabled: false,
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/(?!admin)/],
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
