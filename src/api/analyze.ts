import type { CleanupAccordion } from "@/data/cleanupTypes";

/* Projektanalyse über das Backend (/api/analyze → Claude API). */

export type AnalyzeFile = { path: string; content: string };

type AnalyzeResponse = {
  ok: boolean;
  error?: string;
  accordions?: unknown[];
};

/**
 * Schickt die Dateien ans Backend und liefert die analysierten Accordions zurück.
 * Wirft mit einer verständlichen Meldung, wenn kein API-Key hinterlegt ist o. Ä.
 */
export const analyzeProject = async (files: AnalyzeFile[]): Promise<CleanupAccordion[]> => {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files }),
  });

  const data = (await res.json()) as AnalyzeResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Analyse fehlgeschlagen.");
  }

  const accordions = Array.isArray(data.accordions) ? (data.accordions as unknown as CleanupAccordion[]) : [];
  // Sicherstellen, dass jede Zeile anwendbar ist (Backend liefert applyable nicht).
  return accordions.map((a) => ({
    ...a,
    rows: (a.rows ?? []).map((r) => ({ ...r, applyable: true })),
  }));
};
