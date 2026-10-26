import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Deploying to a subpath (e.g. GitHub Pages at /studycircle/) requires the
  // asset URLs to be prefixed. Vercel/local builds leave this unset -> "/".
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
