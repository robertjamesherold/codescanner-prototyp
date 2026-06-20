import { authHeaders } from './auth'

export type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

export type SecurityFinding = {
  id: string;
  fileTitle: string;
  lineRange: string;
  description: string;
  before: string;
  after: string;
};

export type CweCardData = {
  id: string;
  description: string;
  time: string;
  findings: SecurityFinding[];
  highlighted?: boolean;
};

export type SeverityData = { cards: CweCardData[] };
export type Security = Record<Severity, SeverityData>;

const SEVERITIES: Severity[] = ["kritisch", "hoch", "mittel", "niedrig"];

export const EMPTY_SECURITY: Security = {
  kritisch: { cards: [] },
  hoch: { cards: [] },
  mittel: { cards: [] },
  niedrig: { cards: [] },
};

const normalizeFinding = (raw: unknown): SecurityFinding => {
  const f = (raw ?? {}) as Partial<SecurityFinding>;
  return {
    id: String(f.id ?? ""),
    fileTitle: String(f.fileTitle ?? ""),
    lineRange: String(f.lineRange ?? ""),
    description: String(f.description ?? ""),
    before: String(f.before ?? ""),
    after: String(f.after ?? ""),
  };
};

const normalizeCard = (raw: unknown): CweCardData => {
  const c = (raw ?? {}) as Partial<CweCardData>;
  return {
    id: String(c.id ?? ""),
    description: String(c.description ?? ""),
    time: String(c.time ?? "~0"),
    highlighted: Boolean(c.highlighted),
    findings: Array.isArray(c.findings)
      ? c.findings.map(normalizeFinding).filter((f) => f.id)
      : [],
  };
};

const normalize = (raw: unknown): Security => {
  const obj = (raw ?? {}) as Partial<Record<Severity, SeverityData>>;
  const out = {} as Security;
  for (const sev of SEVERITIES) {
    const sd = (obj[sev] ?? {}) as Partial<SeverityData>;
    out[sev] = {
      cards: Array.isArray(sd.cards) ? sd.cards.map(normalizeCard).filter((c) => c.id) : [],
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
