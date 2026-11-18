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
    open: '/',
    watch: {
      // Browser QA artifacts contain files that Chrome locks on Windows.
      ignored: ['**/.tmp/**'],
    },
  }
  };
})
