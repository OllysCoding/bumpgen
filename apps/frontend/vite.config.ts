import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: "../../dist/frontend",
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api/v1/ws": {
        target: "ws://localhost:4000",
        ws: true,
      },
      "/api": "http://localhost:4000",
    },
  },
});
