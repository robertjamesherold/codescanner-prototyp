/* ============================================================================
   Geteilte Backend-Logik (storage-agnostisch, ohne Node-/Netlify-Spezifika).
   Genutzt von:
   - der Vite-Dev-Middleware  (vite.config.ts)        → Datei-Store, lokal
   - der Netlify Function      (netlify/functions/api) → Netlify-Blobs-Store, prod

   Routing + Geschäftslogik liegen hier EINMAL; die beiden Adapter liefern nur
   einen Storage (get/set) und übersetzen Request/Response.

   Endpunkte:
   - GET/PUT  /api/state     → persistierter Interaktions-Zustand
   - GET/PUT  /api/settings  → Nutzerdaten + API-Keys (Keys nie im GET zurück)
   - GET/PUT  /api/overview  → Übersichts-Kennzahlen (Sicherheit/Optimierung/Verlauf)
   - POST     /api/analyze   → Projektdateien per Claude/OpenAI analysieren
   ========================================================================== */

/** Minimaler Key-Value-Storage. Werte sind bereits geparste JSON-Objekte. */
export type Store = {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown): Promise<void>
}

export type ApiResponse = { status: number; body: unknown }

/* --- Defaults ------------------------------------------------------------- */
export const DEFAULT_STATE = {
  activeProjectId: null as string | null,
  demoApplied: [] as string[],
  projects: [] as unknown[],
}

export const DEFAULT_SETTINGS = {
  name: '',
  email: '',
  provider: 'anthropic' as 'anthropic' | 'openai',
  anthropicApiKey: '',
  openaiApiKey: '',
  anthropicModel: 'claude-opus-4-8',
  openaiModel: 'gpt-4o',
}
export type AppSettings = typeof DEFAULT_SETTINGS

export const DEFAULT_OVERVIEW = {
  security: { critical: 8 },
  optimization: { open: 25, loc: 1183, minutes: 44, high: 7, medium: 12, low: 5 },
  history: {
    dates: ['3. Feb', '5. Feb', '7. Feb', '9. Feb', '11. Feb'],
    totalDelta: -23,
    series: [
      { key: 'security', name: 'Sicherheit', value: 15, delta: -4, data: [28, 27, 26, 24, 22, 20, 19, 17, 16, 15] },
      { key: 'quality', name: 'Qualität', value: 17, delta: -5, data: [32, 31, 29, 28, 26, 24, 22, 20, 18, 17] },
      { key: 'performance', name: 'Leistung', value: 24, delta: -6, data: [40, 38, 36, 34, 32, 30, 29, 27, 25, 24] },
    ],
  },
}

/* --- Sicherheits-Befunde (Absichern) -------------------------------------- */
export type Severity = 'kritisch' | 'hoch' | 'mittel' | 'niedrig'
export type CweCardData = {
  id: string
  description: string
  time: string
  open: number
  done: number
  total: number
  highlighted?: boolean
}
export type SecurityCode = {
  fileTitle: string
  lineRange: string
  fileIndex: number
  fileTotal: number
  description: string
  before: string
  after: string
}
export type SeverityData = { cards: CweCardData[]; code?: SecurityCode }
export type Security = Record<Severity, SeverityData>

const KRITISCH_AFTER = `type SettingsPayload = {
  language: 'de' | 'en';
  theme: 'light' | 'dark';
  notifications: boolean;
};

export function saveSettings(payload: SettingsPayload) {
  if (!['de', 'en'].includes(payload.language)) {
    throw new Error('Ungültige Sprache');
  }

  if (!['light', 'dark'].includes(payload.theme)) {
    throw new Error('Ungültiges Theme');
  }

  if (typeof payload.notifications !== 'boolean') {
    throw new Error('Ungültiger Wert für Benachrichtigungen');
  }

  return db.settings.update(payload);
}`

const HOCH_BEFORE = `export async function deleteUser(req, res) {
  const userId = req.params.userId;

  await userService.deleteUser(userId);
  res.status(204).send();
}`

const HOCH_AFTER = `export async function deleteUser(req, res) {
  const userId = req.params.userId;
  const currentUser = req.user;

  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }

  await userService.deleteUser(userId);
  res.status(204).send();
}`

const GENERIC_DESC =
  "Die Anwendung verarbeitet Benutzereingaben ohne eine angemessene Validierung. Dies bedeutet, dass fehlerhafte, unerwartete oder sogar manipulierte Werte in die Anwendung gelangen können, was zu potenziellen Sicherheitsrisiken und unerwartetem Verhalten der Anwendung führen kann. Eine ordnungsgemäße Validierung der Eingaben ist daher unerlässlich, um die Integrität und Sicherheit der Anwendung zu gewährleisten."

const SAVE_BEFORE = "export function saveSettings(payload: any) {\n  return db.settings.update(payload);\n}"

export const DEFAULT_SECURITY: Security = {
  kritisch: {
    cards: [
      { id: 'CWE-20', description: 'Fehlende Eingabevalid.', time: '~32', open: 4, done: 0, total: 4, highlighted: true },
      { id: 'CWE-284', description: 'Schwache Zugriffskontrolle', time: '~15', open: 1, done: 0, total: 1 },
      { id: 'CWE-532', description: 'Sensible Daten in Logs', time: '~32', open: 3, done: 0, total: 3 },
    ],
    code: {
      fileTitle: 'Datei 1: utils.js',
      lineRange: 'Zeile 12-28',
      fileIndex: 1,
      fileTotal: 4,
      description: GENERIC_DESC,
      before: SAVE_BEFORE,
      after: KRITISCH_AFTER,
    },
  },
  hoch: {
    cards: [
      { id: 'CWE-209', description: 'Unsichere Fehlerbehandlung', time: '~18', open: 2, done: 1, total: 2, highlighted: true },
    ],
    code: {
      fileTitle: 'Datei 1: utils.js',
      lineRange: 'Zeile 12-28',
      fileIndex: 1,
      fileTotal: 2,
      description: GENERIC_DESC,
      before: HOCH_BEFORE,
      after: HOCH_AFTER,
    },
  },
  mittel: {
    cards: [
      { id: 'CWE-798', description: 'Fest codierte Secrets', time: '~21', open: 4, done: 2, total: 6, highlighted: true },
      { id: 'CWE-89', description: 'SQL-Injektion', time: '~12', open: 3, done: 0, total: 3 },
      { id: 'CWE-78', description: 'Befehlsinjektion', time: '~8', open: 1, done: 0, total: 1 },
    ],
    code: {
      fileTitle: 'Datei 3: user.settings.ts',
      lineRange: 'Zeile 12-28',
      fileIndex: 3,
      fileTotal: 6,
      description:
        "Die Anwendung ist anfällig für Cross-Site-Scripting (XSS), da die Benutzereingabe im Feld 'Benutzername' nicht ausreichend bereinigt wird.",
      before: SAVE_BEFORE,
      after: "export function saveSettings(payload: SettingsPayload) {\n  if (!['de', 'en'].includes(payload.language)) {\n    throw new Error('Ungültige Sprache');\n  }\n}",
    },
  },
  niedrig: {
    cards: [
      { id: 'CWE-311', description: 'Fehlende Verschlüsselung', time: '~0', open: 0, done: 2, total: 2 },
      { id: 'CWE-918', description: 'Server Side Request Forgery', time: '~15', open: 1, done: 0, total: 1, highlighted: true },
    ],
    code: {
      fileTitle: 'Datei 1: auth.controller.ts',
      lineRange: 'Zeile 12-28',
      fileIndex: 1,
      fileTotal: 1,
      description:
        'Die Benutzereingaben werden ohne ausreichende Validierung übernommen. Dadurch können fehlerhafte, unerwartete oder manipulierte Werte in die Anwendung gelangen.',
      before: SAVE_BEFORE,
      after: KRITISCH_AFTER,
    },
  },
}

/* --- KI-Analyse ----------------------------------------------------------- */
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

/* --- Routing -------------------------------------------------------------- */
const ok = (body: unknown): ApiResponse => ({ status: 200, body })
const badJson: ApiResponse = { status: 400, body: { ok: false, error: 'invalid json' } }
const methodNotAllowed: ApiResponse = { status: 405, body: { ok: false } }

const parseBody = (raw: string): unknown | undefined => {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return undefined
  }
}

const readSettings = async (store: Store): Promise<AppSettings> => ({
  ...DEFAULT_SETTINGS,
  ...(((await store.get('settings')) as Partial<AppSettings> | null) ?? {}),
})

/**
 * Eine API-Anfrage verarbeiten. `pathname` ist der reine Pfad (ohne Query),
 * z. B. "/api/state". Liefert Status + JSON-Body.
 */
export async function handleApi(
  method: string,
  pathname: string,
  rawBody: string,
  store: Store,
): Promise<ApiResponse> {
  // --- /api/state ---
  if (pathname.startsWith('/api/state')) {
    if (method === 'GET') return ok((await store.get('state')) ?? DEFAULT_STATE)
    if (method === 'PUT' || method === 'POST') {
      const data = parseBody(rawBody)
      if (data === undefined) return badJson
      await store.set('state', data)
      return ok({ ok: true })
    }
    return methodNotAllowed
  }

  // --- /api/settings (Keys werden beim GET nie zurückgegeben) ---
  if (pathname.startsWith('/api/settings')) {
    const current = await readSettings(store)
    if (method === 'GET') {
      return ok({
        name: current.name,
        email: current.email,
        provider: current.provider,
        anthropicModel: current.anthropicModel,
        openaiModel: current.openaiModel,
        hasAnthropicKey: Boolean(current.anthropicApiKey),
        hasOpenaiKey: Boolean(current.openaiApiKey),
      })
    }
    if (method === 'PUT' || method === 'POST') {
      const incoming = parseBody(rawBody) as Partial<AppSettings> | undefined
      if (incoming === undefined) return badJson
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
      await store.set('settings', merged)
      return ok({
        ok: true,
        hasAnthropicKey: Boolean(merged.anthropicApiKey),
        hasOpenaiKey: Boolean(merged.openaiApiKey),
      })
    }
    return methodNotAllowed
  }

  // --- /api/overview ---
  if (pathname.startsWith('/api/overview')) {
    if (method === 'GET') return ok((await store.get('overview')) ?? DEFAULT_OVERVIEW)
    if (method === 'PUT' || method === 'POST') {
      const data = parseBody(rawBody)
      if (data === undefined) return badJson
      await store.set('overview', data)
      return ok({ ok: true })
    }
    return methodNotAllowed
  }

  // --- /api/security ---
  if (pathname.startsWith('/api/security')) {
    if (method === 'GET') return ok((await store.get('security')) ?? DEFAULT_SECURITY)
    if (method === 'PUT' || method === 'POST') {
      const data = parseBody(rawBody)
      if (data === undefined) return badJson
      await store.set('security', data)
      return ok({ ok: true })
    }
    return methodNotAllowed
  }

  // --- /api/analyze ---
  if (pathname.startsWith('/api/analyze')) {
    if (method !== 'POST') return methodNotAllowed
    const body = parseBody(rawBody) as { files?: AnalyzeFile[] } | undefined
    if (body === undefined) return badJson
    const files = Array.isArray(body.files) ? body.files : []
    if (files.length === 0) return { status: 400, body: { ok: false, error: 'Keine Dateien übergeben.' } }
    try {
      const settings = await readSettings(store)
      const result = await runAnalysis(files, settings)
      return ok({ ok: true, ...(result as object) })
    } catch (err) {
      return { status: 500, body: { ok: false, error: err instanceof Error ? err.message : 'Analyse fehlgeschlagen.' } }
    }
  }

  return { status: 404, body: { ok: false, error: 'not found' } }
}
