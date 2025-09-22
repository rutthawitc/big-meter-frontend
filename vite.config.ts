import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwind from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_API_BASE_URL || 'http://localhost:8080'
  return {
    plugins: [react(), tailwind()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: api,
          changeOrigin: true,
        },
      },
    },
  }
})
