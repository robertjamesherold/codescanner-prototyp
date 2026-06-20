/* ============================================================================
   Persistenz-Client für den Interaktions-Zustand.
   Primär gegen das Mini-Backend (/api/state, siehe vite.config.ts); fällt auf
   localStorage zurück, falls kein Backend erreichbar ist (z. B. statischer Build).
   ========================================================================== */

import type { CleanupAccordion } from "@/data/cleanupTypes";

/** Ein importiertes Projekt mit eigenen Befunden und Anwenden-Zustand. */
export type Project = {
  id: string;
  name: string;
  /** Anzahl analysierter Dateien. */
  fileCount: number;
  /** Kurzer Bearbeitungsstand, z.B. "Gerade importiert". */
  editedLabel: string;
  findings: CleanupAccordion[] | null;
  applied: string[];
};

export type AppState = {
  /** Aktives Projekt (null = eingebaute Demo-Daten). */
  activeProjectId: string | null;
  /** Anwenden-Zustand der Demo-Daten (wenn kein Projekt aktiv ist). */
  demoApplied: string[];
  projects: Project[];
};

export const DEFAULT_STATE: AppState = { activeProjectId: null, demoApplied: [], projects: [] };

const LS_KEY = "codescanner:state";

const normalizeProject = (raw: unknown): Project => {
  const p = (raw ?? {}) as Partial<Project>;
  return {
    id: String(p.id ?? ""),
    name: String(p.name ?? "Projekt"),
    fileCount: Number(p.fileCount ?? 0),
    editedLabel: String(p.editedLabel ?? ""),
    findings: Array.isArray(p.findings) ? (p.findings as CleanupAccordion[]) : null,
    applied: Array.isArray(p.applied) ? p.applied.map(String) : [],
  };
};

/** Eingehende, evtl. unvollständige Daten in eine sichere AppState-Form bringen. */
const normalize = (raw: unknown): AppState => {
  const obj = (raw ?? {}) as {
    activeProjectId?: unknown;
    demoApplied?: unknown;
    projects?: unknown;
    cleanup?: { applied?: unknown }; // Migration aus altem Format
  };
  const projects = Array.isArray(obj.projects) ? obj.projects.map(normalizeProject).filter((p) => p.id) : [];
  const demoApplied = Array.isArray(obj.demoApplied)
    ? obj.demoApplied.map(String)
    : Array.isArray(obj.cleanup?.applied)
      ? obj.cleanup!.applied.map(String)
      : [];
  const activeProjectId =
    typeof obj.activeProjectId === "string" && projects.some((p) => p.id === obj.activeProjectId)
      ? obj.activeProjectId
      : null;
  return { activeProjectId, demoApplied, projects };
};

const cacheLocal = (state: AppState): void => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* localStorage nicht verfügbar — ignorieren */
  }
};

/** Zustand laden: Backend zuerst, sonst localStorage, sonst Default. */
export const loadState = async (): Promise<AppState> => {
  try {
    const res = await fetch("/api/state");
    if (res.ok) {
      const state = normalize(await res.json());
      cacheLocal(state);
      return state;
    }
  } catch {
    /* Backend nicht erreichbar → Fallback */
  }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* ignorieren */
  }
  return DEFAULT_STATE;
};

/** Zustand speichern: sofort lokal cachen, dann ans Backend schicken. */
export const saveState = async (state: AppState): Promise<void> => {
  cacheLocal(state);
  try {
    await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch {
    /* Offline → bleibt im localStorage-Cache erhalten */
  }
};
