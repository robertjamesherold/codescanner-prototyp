import { useOptimizeApplied } from "@/store/appState";

export type OptimizeSeverity = "hoch" | "mittel" | "niedrig";

export type OptimizeFinding = {
  id: string;
  severity: OptimizeSeverity;
  fileTitle: string;
  lineRange: string;
  description: string;
  before: string;
  after: string;
  loc: number;
  minutes: number;
};

export type OptimizeCategory = {
  id: string;
  title: string;
  icon: string;
  findings: OptimizeFinding[];
};

export const OPTIMIZE_CATEGORIES: OptimizeCategory[] = [
  {
    id: "bundle",
    title: "Bundle",
    icon: "Package",
    findings: [
      {
        id: "bundle-1", severity: "hoch",
        fileTitle: "Datei 1: config/imports.ts", lineRange: "Zeile 1–2",
        description: "Lodash wird vollständig importiert (+70 kB). Nur benötigte Funktionen per Named Import laden spart ~60 kB gzip.",
        before: "import _ from 'lodash';\nconst grouped = _.groupBy(items, 'type');",
        after: "import { groupBy } from 'lodash-es';\nconst grouped = groupBy(items, 'type');",
        loc: 2, minutes: 5,
      },
      {
        id: "bundle-2", severity: "mittel",
        fileTitle: "Datei 2: utils/date.ts", lineRange: "Zeile 1–2",
        description: "moment.js (+230 kB) kann durch date-fns ersetzt werden, das per Tree-Shaking auf ~15 kB schrumpft.",
        before: "import moment from 'moment';\nexport const fmt = (d: Date) => moment(d).format('DD.MM.YYYY');",
        after: "import { format } from 'date-fns';\nexport const fmt = (d: Date) => format(d, 'dd.MM.yyyy');",
        loc: 2, minutes: 10,
      },
      {
        id: "bundle-3", severity: "mittel",
        fileTitle: "Datei 3: build/postcss.config.js", lineRange: "Zeile 2–4",
        description: "Ungenutzte CSS-Klassen werden im Production-Build nicht entfernt. PurgeCSS kann die CSS-Bundle-Größe um ~80% reduzieren.",
        before: "module.exports = {\n  plugins: [tailwindcss, autoprefixer],\n};",
        after: "module.exports = {\n  plugins: [\n    tailwindcss, autoprefixer,\n    NODE_ENV === 'production' && purgecss({ content: ['./src/**/*.tsx'] }),\n  ].filter(Boolean),\n};",
        loc: 6, minutes: 15,
      },
      {
        id: "bundle-4", severity: "mittel",
        fileTitle: "Datei 4: components/Hero.tsx", lineRange: "Zeile 8",
        description: "PNG-Bilder werden ohne Komprimierung und ohne LazyLoading eingebunden. WebP reduziert die Dateigröße um ~30%.",
        before: "<img src=\"/hero.png\" alt=\"Hero\" />",
        after: "<picture>\n  <source srcSet=\"/hero.webp\" type=\"image/webp\" />\n  <img src=\"/hero.png\" alt=\"Hero\" loading=\"lazy\" />\n</picture>",
        loc: 4, minutes: 8,
      },
      {
        id: "bundle-5", severity: "niedrig",
        fileTitle: "Datei 5: components/icons.ts", lineRange: "Zeile 1",
        description: "Die gesamte Icon-Bibliothek wird importiert. Einzelne Named Imports reduzieren die Bundle-Größe um ~90%.",
        before: "import * as Icons from 'react-icons/fa';",
        after: "import { FaUser, FaHome, FaCog } from 'react-icons/fa';",
        loc: 1, minutes: 3,
      },
    ],
  },
  {
    id: "performance",
    title: "Performance",
    icon: "Zap",
    findings: [
      {
        id: "perf-1", severity: "hoch",
        fileTitle: "Datei 1: components/DataTable.tsx", lineRange: "Zeile 4",
        description: "Eine teure Berechnung wird bei jedem Render neu ausgeführt. useMemo verhindert unnötige Neuberechnungen.",
        before: "const DataTable = ({ items }) => {\n  const processed = items.flatMap(groupAndSort);\n  return <Table data={processed} />;\n};",
        after: "const DataTable = ({ items }) => {\n  const processed = useMemo(\n    () => items.flatMap(groupAndSort), [items]\n  );\n  return <Table data={processed} />;\n};",
        loc: 6, minutes: 5,
      },
      {
        id: "perf-2", severity: "mittel",
        fileTitle: "Datei 2: hooks/usePolling.ts", lineRange: "Zeile 2–3",
        description: "useEffect startet ein Interval ohne Cleanup-Funktion. Das führt zu Memory Leaks wenn die Komponente unmountet.",
        before: "useEffect(() => {\n  const t = setInterval(fetchData, 5000);\n}, []);",
        after: "useEffect(() => {\n  const t = setInterval(fetchData, 5000);\n  return () => clearInterval(t);\n}, []);",
        loc: 4, minutes: 5,
      },
      {
        id: "perf-3", severity: "mittel",
        fileTitle: "Datei 3: components/Item.tsx", lineRange: "Zeile 1–3",
        description: "Die Komponente re-rendert jedes Mal wenn der Parent re-rendert, auch wenn sich ihre Props nicht geändert haben.",
        before: "const Item = ({ id, label, onClick }) => (\n  <div onClick={() => onClick(id)}>{label}</div>\n);",
        after: "const Item = React.memo(({ id, label, onClick }) => (\n  <div onClick={() => onClick(id)}>{label}</div>\n));",
        loc: 3, minutes: 5,
      },
      {
        id: "perf-4", severity: "mittel",
        fileTitle: "Datei 4: components/List.tsx", lineRange: "Zeile 2",
        description: "Ein Array-Literal wird bei jedem Render neu erstellt. Eine Modul-Konstante außerhalb der Komponente verhindert das.",
        before: "const List = ({ filter }) => {\n  const opts = ['a', 'b', 'c', 'd', 'e'];\n  return opts.filter(o => o.includes(filter)).map(...);\n};",
        after: "const OPTS = ['a', 'b', 'c', 'd', 'e'];\nconst List = ({ filter }) => (\n  OPTS.filter(o => o.includes(filter)).map(...)\n);",
        loc: 4, minutes: 3,
      },
      {
        id: "perf-5", severity: "niedrig",
        fileTitle: "Datei 5: handlers/form.ts", lineRange: "Zeile 2",
        description: "Synchrones localStorage-Schreiben blockiert den Main Thread bei jedem Keystroke. Debouncing verhindert das.",
        before: "input.addEventListener('change', (e) => {\n  localStorage.setItem('val', e.target.value);\n});",
        after: "let t: number;\ninput.addEventListener('change', (e) => {\n  clearTimeout(t);\n  t = setTimeout(() => localStorage.setItem('val', e.target.value), 300);\n});",
        loc: 5, minutes: 5,
      },
      {
        id: "perf-6", severity: "niedrig",
        fileTitle: "Datei 6: components/Gallery.tsx", lineRange: "Zeile 3",
        description: "Bilder werden alle sofort geladen, auch wenn sie sich unterhalb des Viewports befinden. LazyLoading spart initiale Ladezeit.",
        before: "<img src={photo.url} alt={photo.alt} />",
        after: "<img src={photo.url} alt={photo.alt} loading=\"lazy\" decoding=\"async\" />",
        loc: 1, minutes: 2,
      },
      {
        id: "perf-7", severity: "niedrig",
        fileTitle: "Datei 7: components/Feed.tsx", lineRange: "Zeile 12",
        description: "Listen ohne key-Props zwingen React zu unnötiger DOM-Diffing-Arbeit. Stabile IDs als Keys beheben das.",
        before: "{items.map((item) => <Item label={item.name} />)}",
        after: "{items.map((item) => <Item key={item.id} label={item.name} />)}",
        loc: 1, minutes: 2,
      },
    ],
  },
  {
    id: "architektur",
    title: "Architektur",
    icon: "Layers",
    findings: [
      {
        id: "arch-1", severity: "hoch",
        fileTitle: "Datei 1: components/Dashboard.tsx", lineRange: "Zeile 1–500",
        description: "Die Dashboard-Komponente enthält Fetch-Logik, Formular-State, Berechtigungen, Chart- und Export-Logik. Aufteilen in dedizierte Sub-Komponenten.",
        before: "const Dashboard = () => {\n  // 500+ Zeilen: Fetch, Formular,\n  // Chart, Export, Berechtigungen ...\n};",
        after: "const Dashboard = () => (\n  <DashboardLayout>\n    <DashboardStats />\n    <DashboardChart />\n    <DashboardActions />\n  </DashboardLayout>\n);",
        loc: 500, minutes: 45,
      },
      {
        id: "arch-2", severity: "mittel",
        fileTitle: "Datei 2: components/UserForm.tsx", lineRange: "Zeile 8–12",
        description: "Business-Logik (Passwort-Hashing, DB-Zugriff) liegt direkt in der UI-Komponente. In einen Service auslagern.",
        before: "const UserForm = () => {\n  const save = async () => {\n    const hash = await bcrypt.hash(pw, 12);\n    await db.users.update({ id, password: hash });\n  };\n};",
        after: "const UserForm = () => {\n  const { updatePassword } = useUserService();\n  const save = () => updatePassword(id, pw);\n};",
        loc: 6, minutes: 20,
      },
      {
        id: "arch-3", severity: "mittel",
        fileTitle: "Datei 3: api/users.ts", lineRange: "Zeile 2–5",
        description: "API-Calls und State-Management sind vermischt. Ein dedizierter Query-Hook trennt die Verantwortlichkeiten.",
        before: "const [users, setUsers] = useState([]);\nuseEffect(() => {\n  fetch('/api/users').then(r => r.json()).then(setUsers);\n}, []);",
        after: "// hooks/useUsers.ts\nexport const useUsers = () => useQuery('users', fetchUsers);\n\n// Component\nconst { data: users } = useUsers();",
        loc: 6, minutes: 15,
      },
      {
        id: "arch-4", severity: "mittel",
        fileTitle: "Datei 4: app/App.tsx", lineRange: "Zeile 3–7",
        description: "Fehlende Error Boundaries lassen Laufzeitfehler die gesamte Anwendung abstürzen. Eine Boundary fängt Fehler ab.",
        before: "const App = () => (\n  <Router>\n    <Routes>...</Routes>\n  </Router>\n);",
        after: "const App = () => (\n  <ErrorBoundary fallback={<ErrorPage />}>\n    <Router>\n      <Routes>...</Routes>\n    </Router>\n  </ErrorBoundary>\n);",
        loc: 7, minutes: 10,
      },
      {
        id: "arch-5", severity: "niedrig",
        fileTitle: "Datei 5: components/deep/Child.tsx", lineRange: "Zeile 1",
        description: "Props werden über 4 Ebenen weitergegeben. Ein Context oder ein State-Manager eliminiert das Props-Drilling.",
        before: "// App → Layout → Page → Section → Child\n<Child theme={theme} user={user} onLogout={onLogout} />",
        after: "// Child.tsx\nconst { theme, user, onLogout } = useAppContext();",
        loc: 2, minutes: 20,
      },
    ],
  },
  {
    id: "api",
    title: "API-Effizienz",
    icon: "Send",
    findings: [
      {
        id: "api-1", severity: "hoch",
        fileTitle: "Datei 1: api/orders.ts", lineRange: "Zeile 3–5",
        description: "Für jede Order wird eine separate DB-Query ausgeführt (N+1). Ein einziges JOIN reduziert die Datenbankaufrufe auf 1.",
        before: "const orders = await db.orders.findAll();\nfor (const o of orders) {\n  o.user = await db.users.findById(o.userId);\n}",
        after: "const orders = await db.orders.findAll({\n  include: [{ model: db.users, as: 'user' }],\n});",
        loc: 5, minutes: 15,
      },
      {
        id: "api-2", severity: "hoch",
        fileTitle: "Datei 2: api/stats.ts", lineRange: "Zeile 2–4",
        description: "Teure Statistik-Berechnungen werden bei jedem Request neu ausgeführt. Caching für 5 Minuten reduziert die Last drastisch.",
        before: "app.get('/api/stats', async (req, res) => {\n  const stats = await computeHeavyStats();\n  res.json(stats);\n});",
        after: "app.get('/api/stats', async (req, res) => {\n  const cached = await cache.get('stats');\n  if (cached) return res.json(cached);\n  const stats = await computeHeavyStats();\n  await cache.set('stats', stats, 300);\n  res.json(stats);\n});",
        loc: 7, minutes: 20,
      },
      {
        id: "api-3", severity: "hoch",
        fileTitle: "Datei 3: api/products.ts", lineRange: "Zeile 2–4",
        description: "Alle Datensätze werden ohne Limit zurückgegeben. Pagination verhindert Timeouts und reduziert die Übertragungsmenge.",
        before: "app.get('/api/products', async (req, res) => {\n  const products = await db.products.findAll();\n  res.json(products);\n});",
        after: "app.get('/api/products', async (req, res) => {\n  const page = Number(req.query.page) || 1;\n  const limit = Math.min(Number(req.query.limit) || 20, 100);\n  const { rows, count } = await db.products.findAndCountAll(\n    { limit, offset: (page - 1) * limit }\n  );\n  res.json({ data: rows, total: count, page });\n});",
        loc: 7, minutes: 20,
      },
      {
        id: "api-4", severity: "mittel",
        fileTitle: "Datei 4: api/user.ts", lineRange: "Zeile 2",
        description: "Alle 30 Nutzer-Felder werden zurückgegeben, obwohl nur 4 benötigt werden. Explizite Attribute-Selektion spart Bandbreite.",
        before: "const user = await db.users.findById(id);\nreturn user; // alle 30 Felder",
        after: "const user = await db.users.findById(id, {\n  attributes: ['id', 'name', 'email', 'avatar'],\n});\nreturn user;",
        loc: 4, minutes: 5,
      },
      {
        id: "api-5", severity: "mittel",
        fileTitle: "Datei 5: api/init.ts", lineRange: "Zeile 1–5",
        description: "3 separate API-Requests beim App-Start verursachen 3× Round-Trip-Latenz. Ein Batch-Endpoint spart ~200 ms.",
        before: "const [user, settings, notifs] = await Promise.all([\n  fetch('/api/user'),\n  fetch('/api/settings'),\n  fetch('/api/notifications'),\n]);",
        after: "const data = await fetch('/api/init');\nconst { user, settings, notifs } = await data.json();",
        loc: 5, minutes: 30,
      },
      {
        id: "api-6", severity: "mittel",
        fileTitle: "Datei 6: server/http.ts", lineRange: "Zeile 1–3",
        description: "Der Server läuft über HTTP/1.1. HTTP/2 ermöglicht Request-Multiplexing und Header-Kompression.",
        before: "const server = http.createServer(app);\nserver.listen(3000);",
        after: "const server = spdy.createServer({\n  key: fs.readFileSync('./server.key'),\n  cert: fs.readFileSync('./server.crt'),\n}, app);\nserver.listen(3000);",
        loc: 4, minutes: 20,
      },
      {
        id: "api-7", severity: "niedrig",
        fileTitle: "Datei 7: middleware/cache.ts", lineRange: "Zeile 3–5",
        description: "Statische Assets werden ohne Cache-Control- und ETag-Header ausgeliefert. Der Browser kann sie nicht cachen.",
        before: "app.get('/api/assets/:id', async (req, res) => {\n  const asset = await getAsset(req.params.id);\n  res.json(asset);\n});",
        after: "app.get('/api/assets/:id', async (req, res) => {\n  const asset = await getAsset(req.params.id);\n  res.set('Cache-Control', 'public, max-age=3600');\n  res.set('ETag', asset.hash);\n  res.json(asset);\n});",
        loc: 5, minutes: 10,
      },
      {
        id: "api-8", severity: "niedrig",
        fileTitle: "Datei 8: server/compression.ts", lineRange: "Zeile 1–2",
        description: "API-Antworten werden nicht komprimiert. Gzip/Brotli-Kompression reduziert die Übertragungsgröße um ~70%.",
        before: "const app = express();\napp.use(express.json());",
        after: "import compression from 'compression';\nconst app = express();\napp.use(compression());\napp.use(express.json());",
        loc: 3, minutes: 5,
      },
    ],
  },
];

type OptimizeStats = {
  open: number;
  high: number;
  medium: number;
  low: number;
  loc: number;
  minutes: number;
};

const statsOf = (findings: OptimizeFinding[], applied: Set<string>): OptimizeStats => {
  const open = findings.filter((f) => !applied.has(f.id));
  return {
    open: open.length,
    high: open.filter((f) => f.severity === "hoch").length,
    medium: open.filter((f) => f.severity === "mittel").length,
    low: open.filter((f) => f.severity === "niedrig").length,
    loc: open.reduce((s, f) => s + f.loc, 0),
    minutes: open.reduce((s, f) => s + f.minutes, 0),
  };
};

export const useOptimize = () => {
  const { optimizeApplied, mark, unmark, markMany } = useOptimizeApplied();
  const applied = new Set(optimizeApplied);
  const allFindings = OPTIMIZE_CATEGORIES.flatMap((c) => c.findings);

  const safeIds = allFindings
    .filter((f) => f.severity === "niedrig" && !applied.has(f.id))
    .map((f) => f.id);

  const totals = statsOf(allFindings, applied);

  return {
    categories: OPTIMIZE_CATEGORIES,
    applied,
    mark,
    unmark,
    markMany,
    totals,
    statsFor: (id: string) => {
      const cat = OPTIMIZE_CATEGORIES.find((c) => c.id === id);
      return statsOf(cat?.findings ?? [], applied);
    },
    categoryDone: (cat: OptimizeCategory) =>
      cat.findings.length > 0 && cat.findings.every((f) => applied.has(f.id)),
    safeIds,
    safeCount: safeIds.length,
    totalLow: allFindings.filter((f) => f.severity === "niedrig").length,
  };
};
