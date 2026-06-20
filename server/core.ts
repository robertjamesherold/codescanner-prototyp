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
  securityFixed: [] as string[],
  optimizeApplied: [] as string[],
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

export type SecurityFinding = {
  id: string
  fileTitle: string
  lineRange: string
  description: string
  before: string
  after: string
}

export type CweCardData = {
  id: string
  description: string
  time: string
  findings: SecurityFinding[]
  highlighted?: boolean
}

export type SeverityData = { cards: CweCardData[] }
export type Security = Record<Severity, SeverityData>

export const DEFAULT_SECURITY: Security = {
  kritisch: {
    cards: [
      {
        id: 'CWE-20', description: 'Fehlende Eingabevalid.', time: '~32', highlighted: true,
        findings: [
          {
            id: 'cwe20-1', fileTitle: 'Datei 1: utils/settings.ts', lineRange: 'Zeile 3–5',
            description: 'Der Payload wird ohne Typprüfung direkt an die Datenbank weitergeleitet. Ungültige Werte können die Einstellungen korrumpieren.',
            before: "export function saveSettings(payload: any) {\n  return db.settings.update(payload);\n}",
            after: "export function saveSettings(payload: SettingsPayload) {\n  if (!['de', 'en'].includes(payload.language))\n    throw new Error('Ungültige Sprache');\n  if (!['light', 'dark'].includes(payload.theme))\n    throw new Error('Ungültiges Theme');\n  return db.settings.update(payload);\n}",
          },
          {
            id: 'cwe20-2', fileTitle: 'Datei 2: routes/upload.ts', lineRange: 'Zeile 8–11',
            description: 'Dateinamen werden ungeprüft übernommen. Path-Traversal-Angriffe ermöglichen das Überschreiben beliebiger Dateien auf dem Server.',
            before: "app.post('/upload', (req, res) => {\n  const { filename } = req.body;\n  fs.writeFile(`uploads/${filename}`, req.file.buffer,\n    () => res.json({ ok: true }));\n});",
            after: "app.post('/upload', (req, res) => {\n  const ext = path.extname(req.body.filename).toLowerCase();\n  if (!['.jpg', '.png', '.pdf'].includes(ext))\n    return res.status(400).json({ error: 'Ungültiger Dateityp' });\n  const safe = path.basename(req.body.filename);\n  fs.writeFile(`uploads/${safe}`, req.file.buffer,\n    () => res.json({ ok: true }));\n});",
          },
          {
            id: 'cwe20-3', fileTitle: 'Datei 3: api/search.ts', lineRange: 'Zeile 4–6',
            description: 'Suchanfragen werden ohne Längenbegrenzung oder Sanitisierung direkt ausgeführt. XSS und Denial-of-Service sind möglich.',
            before: "export function searchItems(query: string) {\n  return db.items.findAll({ where: { name: query } });\n}",
            after: "export function searchItems(query: string) {\n  const safe = query.trim().slice(0, 100).replace(/[<>\"'&]/g, '');\n  if (!safe) return [];\n  return db.items.findAll({ where: { name: { [Op.like]: `%${safe}%` } } });\n}",
          },
          {
            id: 'cwe20-4', fileTitle: 'Datei 4: config/update.ts', lineRange: 'Zeile 2–4',
            description: 'Konfigurationsschlüssel werden nicht gegen eine Allowlist geprüft. Angreifer können beliebige interne Parameter überschreiben.',
            before: "export function updateConfig(key: string, value: unknown) {\n  config[key] = value;\n}",
            after: "const ALLOWED = ['theme', 'language', 'notifications'] as const;\nexport function updateConfig(key: typeof ALLOWED[number], value: unknown) {\n  if (!ALLOWED.includes(key)) throw new Error('Ungültiger Schlüssel');\n  config[key] = value;\n}",
          },
        ],
      },
      {
        id: 'CWE-284', description: 'Schwache Zugriffskontrolle', time: '~15',
        findings: [
          {
            id: 'cwe284-1', fileTitle: 'Datei 1: controllers/user.controller.ts', lineRange: 'Zeile 4–8',
            description: 'Der Endpunkt löscht Nutzer ohne Prüfung der Berechtigungen. Jeder authentifizierte Nutzer kann damit beliebige Accounts entfernen.',
            before: "export async function deleteUser(req, res) {\n  const userId = req.params.userId;\n  await userService.deleteUser(userId);\n  res.status(204).send();\n}",
            after: "export async function deleteUser(req, res) {\n  if (!req.user || req.user.role !== 'admin') {\n    return res.status(403).json({ error: 'Zugriff verweigert' });\n  }\n  await userService.deleteUser(req.params.userId);\n  res.status(204).send();\n}",
          },
        ],
      },
      {
        id: 'CWE-532', description: 'Sensible Daten in Logs', time: '~30',
        findings: [
          {
            id: 'cwe532-1', fileTitle: 'Datei 1: auth/login.ts', lineRange: 'Zeile 3',
            description: 'Das Klartext-Passwort wird in den Server-Logs festgehalten. Log-Zugriff legt Nutzerkennwörter offen.',
            before: "async function login(email: string, password: string) {\n  console.log(`Login-Versuch: ${email} / ${password}`);\n  return authService.verify(email, password);\n}",
            after: "async function login(email: string, password: string) {\n  console.log(`Login-Versuch: ${email}`);\n  return authService.verify(email, password);\n}",
          },
          {
            id: 'cwe532-2', fileTitle: 'Datei 2: payment/checkout.ts', lineRange: 'Zeile 2–3',
            description: 'Kartennummer und CVV werden vollständig geloggt. PCI-DSS-Verletzung; bei Kompromittierung der Logs sind Zahlungsdaten offen.',
            before: "function processPayment(card: CardData) {\n  logger.info('Zahlung:', { number: card.number, cvv: card.cvv });\n  return stripe.charge(card);\n}",
            after: "function processPayment(card: CardData) {\n  logger.info('Zahlung initiiert', { last4: card.number.slice(-4) });\n  return stripe.charge(card);\n}",
          },
          {
            id: 'cwe532-3', fileTitle: 'Datei 3: middleware/session.ts', lineRange: 'Zeile 3',
            description: 'Session-Token werden im Klartext geloggt. Angreifer mit Log-Zugriff können jede Sitzung übernehmen.',
            before: "export function sessionMiddleware(req, res, next) {\n  const token = req.headers.authorization;\n  console.log('Session-Token:', token);\n  validateToken(token); next();\n}",
            after: "export function sessionMiddleware(req, res, next) {\n  const token = req.headers.authorization;\n  console.log('Session-Token empfangen (redacted)');\n  validateToken(token); next();\n}",
          },
        ],
      },
    ],
  },
  hoch: {
    cards: [
      {
        id: 'CWE-209', description: 'Unsichere Fehlerbehandlung', time: '~18', highlighted: true,
        findings: [
          {
            id: 'cwe209-1', fileTitle: 'Datei 1: middleware/errorHandler.ts', lineRange: 'Zeile 2–4',
            description: 'Stack-Traces werden direkt an den Client zurückgegeben. Angreifer erhalten detaillierte Infos über die Serverarchitektur.',
            before: "app.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message, stack: err.stack });\n});",
            after: "app.use((err: Error, req, res, next) => {\n  console.error(err);\n  res.status(500).json({ error: 'Interner Serverfehler' });\n});",
          },
          {
            id: 'cwe209-2', fileTitle: 'Datei 2: db/query.ts', lineRange: 'Zeile 5–7',
            description: 'SQL-Fehlermeldungen inklusive der ursprünglichen Query werden weitergeleitet. Tabellenstruktur und Spaltennamen werden öffentlich sichtbar.',
            before: "  } catch (err) {\n    throw new Error(`DB-Fehler: ${err.message} | Query: ${sql}`);\n  }",
            after: "  } catch (err) {\n    console.error('DB-Fehler:', err);\n    throw new Error('Datenbankfehler – bitte versuche es später.');\n  }",
          },
        ],
      },
    ],
  },
  mittel: {
    cards: [
      {
        id: 'CWE-798', description: 'Fest codierte Secrets', time: '~20', highlighted: true,
        findings: [
          {
            id: 'cwe798-1', fileTitle: 'Datei 1: config/api.ts', lineRange: 'Zeile 2',
            description: 'API-Key ist direkt im Quellcode hinterlegt und landet in der Versionsverwaltung. Jeder mit Repository-Zugriff kann ihn auslesen.',
            before: "export const config = {\n  apiKey: 'sk-live-abc123xyz789',\n  endpoint: 'https://api.example.com',\n};",
            after: "export const config = {\n  apiKey: process.env.API_KEY ?? '',\n  endpoint: process.env.API_ENDPOINT ?? 'https://api.example.com',\n};",
          },
          {
            id: 'cwe798-2', fileTitle: 'Datei 2: db/connection.ts', lineRange: 'Zeile 3–4',
            description: 'Datenbankpasswort ist hardcodiert. Ein Leak des Repositories gibt direkten Datenbankzugriff.',
            before: "const pool = new Pool({\n  host: 'localhost',\n  user: 'admin',\n  password: 'supersecret123',\n  database: 'production_db',\n});",
            after: "const pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n  ssl: { rejectUnauthorized: true },\n});",
          },
          {
            id: 'cwe798-3', fileTitle: 'Datei 3: auth/jwt.ts', lineRange: 'Zeile 1',
            description: 'JWT-Secret ist statisch im Code. Alle signierten Tokens lassen sich damit fälschen.',
            before: "const JWT_SECRET = 'my-super-secret-key';\n\nexport function signToken(payload: object) {\n  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });\n}",
            after: "const JWT_SECRET = process.env.JWT_SECRET;\nif (!JWT_SECRET) throw new Error('JWT_SECRET ist nicht gesetzt');\n\nexport function signToken(payload: object) {\n  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });\n}",
          },
          {
            id: 'cwe798-4', fileTitle: 'Datei 4: admin/setup.ts', lineRange: 'Zeile 2',
            description: 'Initial-Passwort für den Admin-Account ist fest codiert und ungehasht. Kompromittiert die gesamte Admin-Ebene.',
            before: "export async function createAdminUser() {\n  await db.users.create({\n    email: 'admin@app.com', password: 'Admin1234!', role: 'admin'\n  });\n}",
            after: "export async function createAdminUser() {\n  const pw = process.env.ADMIN_INITIAL_PASSWORD;\n  if (!pw) throw new Error('ADMIN_INITIAL_PASSWORD nicht gesetzt');\n  const hashed = await bcrypt.hash(pw, 12);\n  await db.users.create({ email: 'admin@app.com', password: hashed, role: 'admin' });\n}",
          },
        ],
      },
      {
        id: 'CWE-89', description: 'SQL-Injektion', time: '~12',
        findings: [
          {
            id: 'cwe89-1', fileTitle: 'Datei 1: repositories/users.ts', lineRange: 'Zeile 2',
            description: 'Nutzername wird per String-Konkatenation in die Query eingebaut. Ein Angreifer kann beliebige SQL-Befehle einschleusen.',
            before: "export function findUser(username: string) {\n  return db.execute(\n    `SELECT * FROM users WHERE username = '${username}'`);\n}",
            after: "export function findUser(username: string) {\n  return db.execute(\n    'SELECT * FROM users WHERE username = ?', [username]);\n}",
          },
          {
            id: 'cwe89-2', fileTitle: 'Datei 2: repositories/products.ts', lineRange: 'Zeile 2',
            description: 'Suchbegriff wird direkt in den LIKE-Ausdruck eingebaut. SQL-Injektion ermöglicht den Zugriff auf alle Tabellen.',
            before: "export function searchProducts(term: string) {\n  return db.execute(\n    `SELECT * FROM products WHERE name LIKE '%${term}%'`);\n}",
            after: "export function searchProducts(term: string) {\n  return db.execute(\n    'SELECT * FROM products WHERE name LIKE ?', [`%${term}%`]);\n}",
          },
          {
            id: 'cwe89-3', fileTitle: 'Datei 3: auth/login.ts', lineRange: 'Zeile 2',
            description: 'Login-Query wird aus E-Mail und Passwort konkateniert. SQL-Injection ermöglicht Authentifizierungs-Bypass.',
            before: "export function findByCredentials(email: string, pw: string) {\n  return db.execute(\n    `SELECT * FROM users WHERE email='${email}' AND password='${pw}'`);\n}",
            after: "export function findByCredentials(email: string, pw: string) {\n  return db.execute('SELECT * FROM users WHERE email = ?', [email])\n    .then(users => users.find(u => bcrypt.compareSync(pw, u.password)));\n}",
          },
        ],
      },
      {
        id: 'CWE-78', description: 'Befehlsinjektion', time: '~8',
        findings: [
          {
            id: 'cwe78-1', fileTitle: 'Datei 1: utils/shell.ts', lineRange: 'Zeile 2',
            description: 'Nutzereingaben werden direkt an exec() übergeben. Angreifer können beliebige Systembefehle ausführen.',
            before: "export function runCommand(input: string) {\n  exec(`convert ${input} output.png`,\n    (err, stdout) => console.log(stdout));\n}",
            after: "export function runCommand(filename: string) {\n  const safe = path.basename(filename).replace(/[^a-z0-9._-]/gi, '');\n  execFile('convert', [safe, 'output.png'],\n    (err, stdout) => console.log(stdout));\n}",
          },
        ],
      },
    ],
  },
  niedrig: {
    cards: [
      {
        id: 'CWE-311', description: 'Fehlende Verschlüsselung', time: '~6',
        findings: [
          {
            id: 'cwe311-1', fileTitle: 'Datei 1: api/client.ts', lineRange: 'Zeile 1',
            description: 'Interne API-Kommunikation läuft über unverschlüsseltes HTTP. Credentials und Daten sind im Netzwerk lesbar.',
            before: "const API_URL = 'http://api.internal.com/v1';\n\nexport async function fetchData(path: string) {\n  return fetch(`${API_URL}${path}`).then(r => r.json());\n}",
            after: "const API_URL = 'https://api.internal.com/v1';\n\nexport async function fetchData(path: string) {\n  return fetch(`${API_URL}${path}`).then(r => r.json());\n}",
          },
          {
            id: 'cwe311-2', fileTitle: 'Datei 2: auth/password.ts', lineRange: 'Zeile 2',
            description: 'Passwörter werden im Klartext verglichen. Ein Datenbank-Dump legt alle Passwörter offen.',
            before: "export function verifyPassword(input: string, stored: string): boolean {\n  return input === stored;\n}",
            after: "export async function verifyPassword(input: string, hash: string): Promise<boolean> {\n  return bcrypt.compare(input, hash);\n}",
          },
        ],
      },
      {
        id: 'CWE-918', description: 'Server Side Request Forgery', time: '~15', highlighted: true,
        findings: [
          {
            id: 'cwe918-1', fileTitle: 'Datei 1: api/proxy.ts', lineRange: 'Zeile 2–4',
            description: 'Externe URLs werden ohne Validierung abgerufen. Angreifer können interne Dienste (Metadaten-APIs, Admin-Endpunkte) über den Server ansprechen.',
            before: "export async function fetchExternal(url: string) {\n  const response = await fetch(url);\n  return response.json();\n}",
            after: "const ALLOWED = ['https://api.trusted.com', 'https://cdn.partner.com'];\n\nexport async function fetchExternal(url: string) {\n  const { origin } = new URL(url);\n  if (!ALLOWED.includes(origin)) throw new Error('URL nicht erlaubt');\n  const response = await fetch(url);\n  return response.json();\n}",
          },
        ],
      },
    ],
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
