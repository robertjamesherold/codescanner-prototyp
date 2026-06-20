/* ============================================================================
   Persistenz-Client für die Sicherheits-Befunde (Absichern-Seite).
   Primär gegen das Mini-Backend (/api/security); fällt offline auf einen LEEREN
   Datensatz zurück (→ Empty-State statt veralteter Demo). Die Demo-/Default-
   Daten leben serverseitig in server/core.ts (DEFAULT_SECURITY).
   ========================================================================== */

import { authHeaders } from './auth'

export type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

export type CweCardData = {
  id: string;
  description: string;
  time: string;
  open: number;
  done: number;
  total: number;
  highlighted?: boolean;
};

export type SecurityCode = {
  fileTitle: string;
  lineRange: string;
  fileIndex: number;
  fileTotal: number;
  description: string;
  before: string;
  after: string;
};

export type SeverityData = { cards: CweCardData[]; code?: SecurityCode };
export type Security = Record<Severity, SeverityData>;

const SEVERITIES: Severity[] = ["kritisch", "hoch", "mittel", "niedrig"];

export const EMPTY_SECURITY: Security = {
  kritisch: { cards: [] },
  hoch: { cards: [] },
  mittel: { cards: [] },
  niedrig: { cards: [] },
};

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const normalizeCard = (raw: unknown): CweCardData => {
  const c = (raw ?? {}) as Partial<CweCardData>;
  return {
    id: String(c.id ?? ""),
    description: String(c.description ?? ""),
    time: String(c.time ?? "~0"),
    open: num(c.open),
    done: num(c.done),
    total: num(c.total),
    highlighted: Boolean(c.highlighted),
  };
};

const normalize = (raw: unknown): Security => {
  const obj = (raw ?? {}) as Partial<Record<Severity, SeverityData>>;
  const out = {} as Security;
  for (const sev of SEVERITIES) {
    const sd = (obj[sev] ?? {}) as Partial<SeverityData>;
    out[sev] = {
      cards: Array.isArray(sd.cards) ? sd.cards.map(normalizeCard).filter((c) => c.id) : [],
      code: sd.code,
    };
  }
  return out;
};

/** Sicherheits-Befunde laden: Backend zuerst, sonst leer. */
export const loadSecurity = async (): Promise<Security> => {
  try {
    const res = await fetch("/api/security", { headers: authHeaders() });
    if (res.ok) return normalize(await res.json());
  } catch {
    /* Backend nicht erreichbar → leer */
  }
  return EMPTY_SECURITY;
};
