import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'

/* ============================================================================
   Mini-Backend (Node-Middleware im Vite Dev-/Preview-Server, ohne Extra-Deps).
   - GET/PUT  /api/state     → persistierter Interaktions-Zustand (server/db.json)
   - GET/PUT  /api/settings  → Nutzerdaten + API-Key (server/settings.json)
   - POST     /api/analyze   → Projektdateien per Claude API analysieren
   ========================================================================== */
const DB_PATH = path.resolve(process.cwd(), 'server/db.json')
const SETTINGS_PATH = path.resolve(process.cwd(), 'server/settings.json')
const DEFAULT_STATE = { activeProjectId: null, demoApplied: [] as string[], projects: [] }
const DEFAULT_SETTINGS = {
  name: '',
  email: '',
  // Aktiver Anbieter für die Analyse.
  provider: 'anthropic' as 'anthropic' | 'openai',
  // Schlüssel + Modell je Anbieter (getrennt gespeichert).
  anthropicApiKey: '',
  openaiApiKey: '',
  anthropicModel: 'claude-opus-4-8',
  openaiModel: 'gpt-4o',
}
type AppSettings = typeof DEFAULT_SETTINGS

const readJson = (file: string, fallback: unknown): unknown => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

const writeJson = (file: string, data: unknown): void => {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(data, null, 2))
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

/* --- Claude-Analyse ------------------------------------------------------- */
const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    accordions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          category: { type: 'string', enum: ['Redundanz', 'Ballast', 'Struktur'] },
          rows: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                id: { type: 'string' },
                label: { type: 'string' },
                severity: { type: 'string', enum: ['hoch', 'mittel', 'niedrig'] },
                path: { type: 'string' },
                loc: { type: 'integer' },
                minutes: { type: 'integer' },
                detail: { type: 'string' },
              },
              required: ['id', 'label', 'severity', 'path', 'loc', 'minutes', 'detail'],
            },
          },
        },
        required: ['title', 'category', 'rows'],
      },
    },
  },
  required: ['accordions'],
}

const ANALYSIS_SYSTEM = `Du bist ein KI-Code-Scanner. Analysiere die übergebenen Projektdateien auf Bereinigungs-Befunde und gruppiere sie in drei Kategorien:
- "Redundanz": doppelte Dateien, duplizierter Code.
- "Ballast": toter Code, ungenutzte Exports/Abhängigkeiten.
- "Struktur": Namens-Inkonsistenzen, schlechte Ordnerstruktur.
Erzeuge pro thematischem Accordion einen Eintrag (title), die jeweilige category und konkrete rows.
Jede row: eindeutige id (kebab-case), prägnantes deutsches label, severity (hoch/mittel/niedrig),
betroffener path, geschätzte loc (Zeilen), minutes (Aufwand), und ein erklärendes detail auf Deutsch.
Erfinde keine Dateien, die nicht übergeben wurden. Wenn nichts gefunden wird, gib leere rows zurück.`

type AnalyzeFile = { path: string; content: string }

const buildPrompt = (files: AnalyzeFile[]): string => {
  // Inhalt begrenzen, damit der Request handhabbar bleibt.
  const corpus = files
    .slice(0, 60)
    .map((f) => `### ${f.path}\n${(f.content ?? '').slice(0, 6000)}`)
    .join('\n\n')
  return `Analysiere dieses Projekt (${files.length} Dateien) und liefere die Befunde:\n\n${corpus}`
}

/** Analyse über die Anthropic Claude API. */
const runAnthropic = async (files: AnalyzeFile[], apiKey: string, model: string): Promise<unknown> => {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: ANALYSIS_SYSTEM,
      output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
      messages: [{ role: 'user', content: buildPrompt(files) }],
    }),
  })

  const data = (await resp.json()) as {
    content?: { type: string; text?: string }[]
    error?: { message?: string }
  }
  if (!resp.ok) throw new Error(data.error?.message || `Claude API Fehler (${resp.status})`)
  const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('')
  return JSON.parse(text)
}

/** Analyse über die OpenAI Chat Completions API (Structured Outputs). */
const runOpenAI = async (files: AnalyzeFile[], apiKey: string, model: string): Promise<unknown> => {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM },
        { role: 'user', content: buildPrompt(files) },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'cleanup_findings', strict: true, schema: ANALYSIS_SCHEMA },
      },
    }),
  })

  const data = (await resp.json()) as {
    choices?: { message?: { content?: string } }[]
    error?: { message?: string }
  }
  if (!resp.ok) throw new Error(data.error?.message || `OpenAI API Fehler (${resp.status})`)
  const text = data.choices?.[0]?.message?.content ?? ''
  return JSON.parse(text)
}

/** Richtigen Anbieter wählen und analysieren. */
const runAnalysis = (files: AnalyzeFile[], settings: AppSettings): Promise<unknown> => {
  if (settings.provider === 'openai') {
    if (!settings.openaiApiKey) throw new Error('Kein OpenAI API-Key hinterlegt. Bitte in den Einstellungen speichern.')
    return runOpenAI(files, settings.openaiApiKey, settings.openaiModel || DEFAULT_SETTINGS.openaiModel)
  }
  if (!settings.anthropicApiKey) throw new Error('Kein Anthropic API-Key hinterlegt. Bitte in den Einstellungen speichern.')
  return runAnthropic(files, settings.anthropicApiKey, settings.anthropicModel || DEFAULT_SETTINGS.anthropicModel)
}

const backend = (): Plugin => {
  const middleware = (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
    const url = req.url ?? ''

    // --- /api/state ---
    if (url.startsWith('/api/state')) {
      if (req.method === 'GET') return sendJson(res, 200, readJson(DB_PATH, DEFAULT_STATE))
      if (req.method === 'PUT' || req.method === 'POST') {
        void readBody(req).then((raw) => {
          try {
            writeJson(DB_PATH, JSON.parse(raw || '{}'))
            sendJson(res, 200, { ok: true })
          } catch {
            sendJson(res, 400, { ok: false, error: 'invalid json' })
          }
        })
        return
      }
      return sendJson(res, 405, { ok: false })
    }

    // --- /api/settings (Keys werden beim GET nie zurückgegeben) ---
    if (url.startsWith('/api/settings')) {
      if (req.method === 'GET') {
        const s = { ...DEFAULT_SETTINGS, ...(readJson(SETTINGS_PATH, {}) as Partial<AppSettings>) }
        return sendJson(res, 200, {
          name: s.name ?? '',
          email: s.email ?? '',
          provider: s.provider ?? 'anthropic',
          anthropicModel: s.anthropicModel ?? DEFAULT_SETTINGS.anthropicModel,
          openaiModel: s.openaiModel ?? DEFAULT_SETTINGS.openaiModel,
          hasAnthropicKey: Boolean(s.anthropicApiKey),
          hasOpenaiKey: Boolean(s.openaiApiKey),
        })
      }
      if (req.method === 'PUT' || req.method === 'POST') {
        void readBody(req).then((raw) => {
          try {
            const incoming = JSON.parse(raw || '{}') as Partial<AppSettings>
            const current = { ...DEFAULT_SETTINGS, ...(readJson(SETTINGS_PATH, {}) as Partial<AppSettings>) }
            const merged: AppSettings = {
              name: incoming.name ?? current.name,
              email: incoming.email ?? current.email,
              provider: incoming.provider ?? current.provider,
              anthropicModel: incoming.anthropicModel || current.anthropicModel,
              openaiModel: incoming.openaiModel || current.openaiModel,
              // Leerer Key im Request lässt den jeweils gespeicherten Key unverändert.
              anthropicApiKey: incoming.anthropicApiKey ? incoming.anthropicApiKey : current.anthropicApiKey,
              openaiApiKey: incoming.openaiApiKey ? incoming.openaiApiKey : current.openaiApiKey,
            }
            writeJson(SETTINGS_PATH, merged)
            sendJson(res, 200, {
              ok: true,
              hasAnthropicKey: Boolean(merged.anthropicApiKey),
              hasOpenaiKey: Boolean(merged.openaiApiKey),
            })
          } catch {
            sendJson(res, 400, { ok: false, error: 'invalid json' })
          }
        })
        return
      }
      return sendJson(res, 405, { ok: false })
    }

    // --- /api/analyze ---
    if (url.startsWith('/api/analyze')) {
      if (req.method !== 'POST') return sendJson(res, 405, { ok: false })
      void readBody(req).then(async (raw) => {
        try {
          const body = JSON.parse(raw || '{}') as { files?: { path: string; content: string }[] }
          const files = Array.isArray(body.files) ? body.files : []
          if (files.length === 0) return sendJson(res, 400, { ok: false, error: 'Keine Dateien übergeben.' })

          const settings = { ...DEFAULT_SETTINGS, ...(readJson(SETTINGS_PATH, {}) as Partial<AppSettings>) }
          const result = await runAnalysis(files, settings)
          sendJson(res, 200, { ok: true, ...(result as object) })
        } catch (err) {
          sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : 'Analyse fehlgeschlagen.' })
        }
      })
      return
    }

    next()
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
