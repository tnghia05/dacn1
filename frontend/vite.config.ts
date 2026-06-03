import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/dacn1/'

  return {
    base: basePath.endsWith('/') ? basePath : `${basePath}/`,
    plugins: [react()],
  }
})
