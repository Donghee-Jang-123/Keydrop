import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 1. 일반 API 요청 중계 (/api 로 시작하면 8080으로 보냄)
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // 2. 웹소켓 요청 중계 (/ws 로 시작하면 8080으로 보냄)
      '/ws': {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})