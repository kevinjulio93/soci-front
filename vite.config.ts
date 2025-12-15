import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// Plugin para servir el service worker en desarrollo
function serviceWorkerPlugin(): Plugin {
  return {
    name: 'service-worker-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/service-worker.js') {
          try {
            const swPath = path.resolve(__dirname, 'src/service-worker.ts')
            let swContent = fs.readFileSync(swPath, 'utf-8')
            
            // Limpiar tipos de TypeScript
            swContent = swContent
              .replace(/\/\/\/ <reference[^>]+>/g, '')
              .replace(/declare const self: ServiceWorkerGlobalScope/g, 'const self = globalThis')
              .replace(/: ServiceWorkerGlobalScope/g, '')
              .replace(/: ExtendableEvent/g, '')
              .replace(/: FetchEvent/g, '')
              .replace(/: ExtendableMessageEvent/g, '')
              .replace(/: Request/g, '')
              .replace(/: Response/g, '')
              .replace(/: Promise<Response>/g, '')
              .replace(/: URL/g, '')
              .replace(/: boolean/g, '')
              .replace(/: string\[\]/g, '')
              .replace(/: string/g, '')
              .replace(/export \{\s*\}/g, '')
            
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            res.setHeader('Service-Worker-Allowed', '/')
            res.statusCode = 200
            res.end(swContent)
          } catch (error) {
            console.error('[SW Plugin] Error:', error)
            res.statusCode = 500
            res.end('console.error("Service Worker error")')
          }
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    serviceWorkerPlugin(),
  ],
  server: {
    middlewareMode: false,
  },
  publicDir: 'public',
  // Configuración para desarrollo offline
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'service-worker': resolve(__dirname, 'src/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'service-worker' 
            ? 'service-worker.js' 
            : 'assets/[name]-[hash].js'
        },
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
