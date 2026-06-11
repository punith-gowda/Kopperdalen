import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' so the build works on GitHub Pages subpaths as well as Netlify/Vercel
export default defineConfig({
  plugins: [react()],
  base: './',
})
