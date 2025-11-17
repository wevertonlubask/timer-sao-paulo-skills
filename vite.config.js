import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Descomente e ajuste a linha abaixo se for usar GitHub Pages
  // base: '/competition-timer/',
})
