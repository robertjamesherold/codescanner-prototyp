import { useSyncExternalStore } from "react";
import { DEFAULT_STATE, loadState, saveState, type AppState, type Project } from "@/api/state";
import type { CleanupAccordion } from "@/data/cleanupTypes";

/* ============================================================================
   Globaler Interaktions-Store (modul-global, wie useSideBarOpen).
   - Lädt den Zustand beim ersten Import einmalig vom Backend.
   - Änderungen werden sofort im Speicher gehalten und gebündelt (debounced)
     persistiert (Backend + localStorage-Cache).
   ========================================================================== */

let state: AppState = DEFAULT_STATE;
let ready = false;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

// Einmaliges Laden beim Modul-Import anstoßen.
loadState()
  .then((loaded) => {
    state = loaded;
    ready = true;
    emit();
  })
  .catch(() => {
    ready = true;
    emit();
  });

let saveTimer: ReturnType<typeof setTimeout> | undefined;
const scheduleSave = () => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void saveState(state), 400);
};

const setState = (updater: (prev: AppState) => AppState) => {
  const next = updater(state);
  if (next === state) return;
  state = next;
  emit();
  scheduleSave();
};

const getSnapshot = () => state;

/** Roher Zugriff auf den gesamten Zustand. */
export const useAppState = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { state: snapshot, ready };
};

const activeProject = (s: AppState): Project | null =>
  s.projects.find((p) => p.id === s.activeProjectId) ?? null;

/** Anwenden-Zustand des aktiven Kontexts ändern (aktives Projekt oder Demo). */
const updateApplied = (updater: (applied: string[]) => string[]) =>
  setState((prev) => {
    if (prev.activeProjectId) {
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === prev.activeProjectId ? { ...p, applied: updater(p.applied) } : p,
        ),
      };
    }
    return { ...prev, demoApplied: updater(prev.demoApplied) };
  });

/** Befunde des aktiven Projekts (oder null → Demo-Daten). */
export const useFindings = (): CleanupAccordion[] | null => {
  const { state: snapshot } = useAppState();
  return activeProject(snapshot)?.findings ?? null;
};

/** Projektliste + aktives Projekt (für die Import-/Auswahl-Seite). */
export const useProjects = () => {
  const { state: snapshot } = useAppState();
  return { projects: snapshot.projects, activeProjectId: snapshot.activeProjectId };
};

/** Aktives Projekt setzen (null = Demo). */
export const setActiveProject = (id: string | null) =>
  setState((prev) => ({ ...prev, activeProjectId: id }));

/** Neues Projekt aus einem Analyse-Ergebnis anlegen und aktivieren. Gibt die ID zurück. */
export const createProjectFromAnalysis = (
  name: string,
  fileCount: number,
  findings: CleanupAccordion[],
): string => {
  const id = crypto.randomUUID();
  setState((prev) => ({
    ...prev,
    activeProjectId: id,
    projects: [
      ...prev.projects,
      { id, name, fileCount, editedLabel: "Gerade importiert", findings, applied: [] },
    ],
  }));
  return id;
};

/** Analyse-Ergebnis einem bestehenden Projekt hinzufügen und es aktivieren. */
export const addAnalysisToProject = (
  projectId: string,
  addedFileCount: number,
  findings: CleanupAccordion[],
) =>
  setState((prev) => ({
    ...prev,
    activeProjectId: projectId,
    projects: prev.projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            fileCount: p.fileCount + addedFileCount,
            editedLabel: "Gerade aktualisiert",
            findings: [...(p.findings ?? []), ...findings],
          }
        : p,
    ),
  }));

/** Optimierungs-Befunde: IDs der als angewendet markierten Findings + Mutatoren. */
export const useOptimizeApplied = () => {
  const { state: snapshot } = useAppState();
  return {
    optimizeApplied: snapshot.optimizeApplied,
    mark: (id: string) =>
      setState((prev) => ({
        ...prev,
        optimizeApplied: prev.optimizeApplied.includes(id) ? prev.optimizeApplied : [...prev.optimizeApplied, id],
      })),
    unmark: (id: string) =>
      setState((prev) => ({
        ...prev,
        optimizeApplied: prev.optimizeApplied.filter((x) => x !== id),
      })),
    markMany: (ids: string[]) =>
      setState((prev) => ({
        ...prev,
        optimizeApplied: Array.from(new Set([...prev.optimizeApplied, ...ids])),
      })),
  };
};

/** Sicherheits-Befunde: IDs der als gefixt markierten Findings + Mutatoren. */
export const useSecurityFixed = () => {
  const { state: snapshot } = useAppState();
  return {
    securityFixed: snapshot.securityFixed,
    mark: (id: string) =>
      setState((prev) => ({
        ...prev,
        securityFixed: prev.securityFixed.includes(id) ? prev.securityFixed : [...prev.securityFixed, id],
      })),
    unmark: (id: string) =>
      setState((prev) => ({
        ...prev,
        securityFixed: prev.securityFixed.filter((x) => x !== id),
      })),
  };
};

/**
 * Bereinigen-spezifischer Zugriff: angewendete Befund-IDs (aktiver Kontext) + Mutatoren.
 * Jede Mutation persistiert automatisch über den Store.
 */
export const useCleanupApplied = () => {
  const { state: snapshot, ready: isReady } = useAppState();
  const applied = new Set<string>(activeProject(snapshot)?.applied ?? snapshot.demoApplied);

  return {
    applied,
    ready: isReady,
    add: (id: string) => updateApplied((a) => (a.includes(id) ? a : [...a, id])),
    remove: (id: string) => updateApplied((a) => a.filter((x) => x !== id)),
    addMany: (ids: string[]) => updateApplied((a) => Array.from(new Set([...a, ...ids]))),
  };
};
