import type { AnalyzeFile } from "@/api/analyze";

/* Flüchtiger Zwischenspeicher für gerade ausgewählte Dateien.
   Wird NICHT persistiert (Datei-Inhalte können groß sein) — nur für die
   Übergabe von Home an die Import-Zwischenseite. */

export type PendingImport = { files: AnalyzeFile[]; folderName: string };

let pending: PendingImport | null = null;

export const setPendingImport = (p: PendingImport) => {
  pending = p;
};

export const peekPendingImport = (): PendingImport | null => pending;

export const clearPendingImport = () => {
  pending = null;
};
