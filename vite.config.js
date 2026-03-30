import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tailwind is loaded via CDN in index.html until npm packages are installed.
// To switch to the Vite plugin: npm i -D tailwindcss @tailwindcss/vite
// then re-add `import tailwindcss from '@tailwindcss/vite'` and tailwindcss() below.
export default defineConfig({
  plugins: [
    react(),
  ],
})
