import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/service-worker.ts',
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'sw') {
            return 'service-worker.js'
          }
          return '[name].js'
        },
      },
    },
  },
})
