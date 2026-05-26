import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const BACKEND_URL = "http://localhost:8001";
const proxiedPrefixes = ["/auth", "/credential", "/workf", "/webh", "/api"];

const proxy = Object.fromEntries(
  proxiedPrefixes.map((p) => [p, { target: BACKEND_URL, changeOrigin: true }]),
);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
  },
}));
