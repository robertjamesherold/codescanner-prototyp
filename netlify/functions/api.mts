/// <reference types="node" />
/* ============================================================================
   Produktions-Backend als Netlify Function.
   Bedient /api/* (via Redirect in netlify.toml) mit derselben Logik wie die
   Vite-Dev-Middleware (server/core.ts) — hier persistiert über Netlify Blobs
   (serverloser Key-Value-Store, ohne Extra-Hosting).

   Zugangsschutz: Wenn die Env-Variable API_SECRET gesetzt ist, muss jeder
   Request den Header "Authorization: Bearer <secret>" mitschicken. Ohne
   gültiges Token antwortet die Function mit 401.
   ========================================================================== */
import { getStore } from '@netlify/blobs'
import { handleApi, type Store } from '../../server/core'

const STORE_NAME = 'codescanner'

const blobStore: Store = {
  async get(key) {
    const store = getStore(STORE_NAME)
    return (await store.get(key, { type: 'json' })) ?? undefined
  },
  async set(key, value) {
    const store = getStore(STORE_NAME)
    await store.setJSON(key, value)
  },
}

/** Den reinen API-Pfad (/api/…) aus der Function-URL rekonstruieren. */
const apiPath = (rawUrl: string): string => {
  const { pathname } = new URL(rawUrl)
  const i = pathname.indexOf('/api/')
  if (i >= 0) return pathname.slice(i)
  return pathname.replace(/^\/\.netlify\/functions\/api/, '/api')
}

export default async (req: Request): Promise<Response> => {
  // OPTIONS (CORS-Preflight) benötigt keinen Auth-Check.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 })
  }

  // Zugangscode-Prüfung: Wenn API_SECRET in den Netlify-Umgebungsvariablen
  // gesetzt ist, muss der Request das korrekte Bearer-Token mitschicken.
  const secret = process.env.API_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
  }

  const method = req.method ?? 'GET'
  const rawBody = method === 'GET' || method === 'HEAD' ? '' : await req.text()

  const { status, body } = await handleApi(method, apiPath(req.url), rawBody, blobStore)

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
