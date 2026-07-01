import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from the root of the custom domain https://patrologija.online/.
  // (If you ever drop the custom domain and use https://<user>.github.io/patrologija/
  // instead, change this back to '/patrologija/'.)
  base: '/',
  plugins: [react()],
})
