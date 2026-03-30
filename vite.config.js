import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_LOCAL === 'true'
    ? 'http://localhost:3001'
    : 'https://comunideskiudc-production.up.railway.app'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        }
      },
      watch: {
        ignored: ['**/bridge/**', '**/server/**']
      }
    }
  }
})
