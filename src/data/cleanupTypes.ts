/* Reine Typen für Bereinigungs-Befunde (keine Laufzeit-Importe → kein Zyklus). */

export type CleanupSeverity = "hoch" | "mittel" | "niedrig";
export type CleanupCategory = "Redundanz" | "Ballast" | "Struktur";

export type CleanupRow = {
  id: string;
  label: string;
  severity: CleanupSeverity;
  path: string;
  loc: number;
  /** Geschätzter Aufwand in Minuten. */
  minutes: number;
  detail: string;
  applyable: boolean;
};

export type CleanupAccordion = { title: string; category: CleanupCategory; rows: CleanupRow[] };

export type CleanupStats = {
  open: number;
  high: number;
  medium: number;
  low: number;
  loc: number;
  minutes: number;
};
