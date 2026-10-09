import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En desarrollo, /api se redirige al backend local
    proxy: { "/api": "http://localhost:4000" },
  },
});
