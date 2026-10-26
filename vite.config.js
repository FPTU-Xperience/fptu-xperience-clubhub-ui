import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  return {
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  server: {
    open: '/v2',
    watch: {
      // Browser QA artifacts contain files that Chrome locks on Windows.
      ignored: ['**/.tmp/**'],
    },
  }
  };
})
