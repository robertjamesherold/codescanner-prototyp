import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleApi, type Store } from './server/core'

/* ============================================================================
   Dev-/Preview-Backend: dünner Datei-Store-Adapter um die geteilte Logik in
   server/core.ts. In Produktion übernimmt die Netlify Function dieselbe Logik
   mit einem Netlify-Blobs-Store (netlify/functions/api.mts). Die Endpunkte
   (/api/state, /api/settings, /api/overview, /api/analyze) sind identisch.
   ========================================================================== */
const FILE_FOR: Record<string, string> = {
  state: path.resolve(process.cwd(), 'server/db.json'),
  settings: path.resolve(process.cwd(), 'server/settings.json'),
  overview: path.resolve(process.cwd(), 'server/overview.json'),
  security: path.resolve(process.cwd(), 'server/security.json'),
}

const readJson = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

const writeJson = (file: string, data: unknown): void => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2))
}

const fileStore: Store = {
  get: (key) => Promise.resolve(FILE_FOR[key] ? readJson(FILE_FOR[key]) : undefined),
  set: (key, value) => {
    if (FILE_FOR[key]) writeJson(FILE_FOR[key], value)
    return Promise.resolve()
  },
}

const sendJson = (res: ServerResponse, code: number, body: unknown): void => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => resolve(raw))
  })

const backend = (): Plugin => {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/')) return next()

    const pathname = url.split('?')[0]
    const method = req.method ?? 'GET'

    const run = (raw: string): void => {
      void handleApi(method, pathname, raw, fileStore).then((r) => sendJson(res, r.status, r.body))
    }

    if (method === 'GET' || method === 'HEAD') run('')
    else void readBody(req).then(run)
  }

  return {
    name: 'codescanner-backend',
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
    backend(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@layout': path.resolve(__dirname, './src/layout'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@icons': path.resolve(__dirname, './src/assets/icons')
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
})
