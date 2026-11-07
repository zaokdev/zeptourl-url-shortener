import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // A fixed origin (http://localhost:5173) to match the API's CORS allow-list.
  // strictPort fails loudly instead of silently moving to another port.
  server: { port: 5173, strictPort: true },
  // One folder per build: dist/production (npm run build) and
  // dist/development (npm run build:dev). `vite preview --mode …` serves the matching one.
  build: { outDir: `dist/${mode}` },
}))
