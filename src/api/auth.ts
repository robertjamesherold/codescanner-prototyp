/* Zugangscode-Verwaltung: wird ausschließlich im localStorage des Browsers
   gehalten und NIE ans Backend geschickt (außer als Auth-Header). */

const LS_KEY = 'codescanner:token'

export const getToken = (): string => {
  try { return localStorage.getItem(LS_KEY) ?? '' } catch { return '' }
}

export const setToken = (token: string): void => {
  try {
    if (token) localStorage.setItem(LS_KEY, token)
    else localStorage.removeItem(LS_KEY)
  } catch {}
}

/** Gibt `{ Authorization: 'Bearer …' }` zurück, wenn ein Token gesetzt ist. */
export const authHeaders = (): Record<string, string> => {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
