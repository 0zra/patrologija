import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://<user>.github.io/patrologija/ on GitHub Pages.
  // If you name the repo something other than "patrologija", change this to match.
  base: '/patrologija/',
  plugins: [react()],
})
