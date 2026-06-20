import { useCleanupApplied, useFindings } from "@/store/appState";
import type {
  CleanupAccordion,
  CleanupCategory,
  CleanupRow,
  CleanupSeverity,
  CleanupStats,
} from "@/data/cleanupTypes";

export type { CleanupAccordion, CleanupCategory, CleanupRow, CleanupSeverity, CleanupStats };

/* ============================================================================
   Bereinigungs-Daten + abgeleitete Kennzahlen.
   Eine einzige Quelle, die sowohl die Bereinigen-Seite (Karten/Accordions) als
   auch die Übersicht (Bereinigung-Karte, Empfehlungs-Karte) speist — beide
   reagieren so live auf den persistierten Interaktions-Zustand.
   Liegen analysierte Befunde (vom Backend) im Store, ersetzen sie die Demo-Daten.
   ========================================================================== */

/** Bereinigungs-Befunde je Accordion. Jede Zeile hat eine eindeutige ID. */
export const CLEANUP_ACCORDIONS: CleanupAccordion[] = [
  {
    title: "Doppelte Dateien",
    category: "Redundanz",
    rows: [
      { id: "dup-1", label: "utils-copy.ts ist identisch mit utils.ts", severity: "niedrig", path: "src/lib/utils-copy.ts", loc: 87, minutes: 2, detail: "100% identischer Inhalt. Die Kopie wird nirgends importiert und kann gefahrlos gelöscht werden.", applyable: true },
      { id: "dup-2", label: "config.backup.ts dupliziert config.ts", severity: "niedrig", path: "src/config/config.backup.ts", loc: 124, minutes: 2, detail: "Veraltete Sicherungskopie der Konfiguration. Im Projekt wurden keine Referenzen gefunden.", applyable: true },
      { id: "dup-3", label: "types-v2.d.ts überlappt mit types.d.ts", severity: "mittel", path: "src/types/types-v2.d.ts", loc: 45, minutes: 5, detail: "87% überschneidende Typdefinitionen. Beide Dateien zusammenführen und Importe anpassen.", applyable: true },
    ],
  },
  {
    title: "Doppelter Code",
    category: "Redundanz",
    rows: [
      { id: "code-1", label: "fetchWithRetry() in api/ und services/ kopiert", severity: "hoch", path: "src/services/http.ts", loc: 58, minutes: 8, detail: "Nahezu identische Retry-Logik an zwei Stellen. In einen gemeinsamen HTTP-Client auslagern.", applyable: true },
      { id: "code-2", label: "formatDate() dreifach dupliziert", severity: "mittel", path: "src/utils/date.ts", loc: 36, minutes: 4, detail: "Gleiche Datumsformatierung in date.ts, table.tsx und export.ts. In eine Hilfsfunktion zentralisieren.", applyable: true },
      { id: "code-3", label: "E-Mail-Validierung mehrfach implementiert", severity: "niedrig", path: "src/forms/validate.ts", loc: 22, minutes: 3, detail: "Identische Regex in vier Formularen. In eine wiederverwendbare Validierung überführen.", applyable: true },
    ],
  },
  {
    title: "Toter Code",
    category: "Ballast",
    rows: [
      { id: "dead-1", label: "parseLegacyFormat() wird nie aufgerufen", severity: "mittel", path: "src/import/legacy.ts", loc: 41, minutes: 4, detail: "Funktion ohne Aufrufer seit der API-Umstellung. Kann ersatzlos entfernt werden.", applyable: true },
      { id: "dead-2", label: "Auskommentierter Login-Flow in auth.service.ts", severity: "niedrig", path: "src/auth/auth.service.ts", loc: 18, minutes: 1, detail: "Veralteter, auskommentierter Codeblock. Der Versionsverlauf macht ihn überflüssig.", applyable: true },
    ],
  },
  {
    title: "Ungenutzte Exports",
    category: "Ballast",
    rows: [
      { id: "exp-1", label: "5 ungenutzte Abhängigkeiten in package.json", severity: "hoch", path: "package.json", loc: 12, minutes: 6, detail: "moment, left-pad u. a. werden nicht mehr verwendet. Deinstallieren reduziert die Bundle-Größe.", applyable: true },
      { id: "exp-2", label: "<LegacyButton/> wird nicht referenziert", severity: "mittel", path: "src/components/LegacyButton.tsx", loc: 64, minutes: 3, detail: "Komponente ohne Import. Wurde durch <Button/> ersetzt und kann gelöscht werden.", applyable: true },
      { id: "exp-3", label: "export OLD_API_URL nirgends importiert", severity: "niedrig", path: "src/config/endpoints.ts", loc: 1, minutes: 1, detail: "Konstante ohne Verwendung. Kann sicher entfernt werden.", applyable: true },
    ],
  },
  {
    title: "Namen-Inkonsistenzen",
    category: "Struktur",
    rows: [
      { id: "name-1", label: "Gemischte Schreibweise: userId vs. user_id", severity: "mittel", path: "src/models/", loc: 14, minutes: 4, detail: "camelCase und snake_case in sechs Modulen vermischt. Auf eine einheitliche Konvention bringen.", applyable: true },
      { id: "name-2", label: "Dateinamen teils PascalCase, teils kebab-case", severity: "niedrig", path: "src/components/", loc: 8, minutes: 2, detail: "Uneinheitliche Benennung erschwert die Navigation. Auf PascalCase vereinheitlichen.", applyable: true },
    ],
  },
  {
    title: "Ordnerstruktur",
    category: "Struktur",
    rows: [
      { id: "folder-1", label: "Komponenten über 3 Ordner verstreut", severity: "mittel", path: "src/", loc: 6, minutes: 5, detail: "Gleichartige Komponenten liegen in components/, ui/ und shared/. In einen Ordner zusammenführen.", applyable: true },
      { id: "folder-2", label: "Tests neben Quellcode statt in __tests__", severity: "niedrig", path: "src/", loc: 5, minutes: 2, detail: "Testdateien liegen verteilt neben den Modulen. In dedizierte Testordner verschieben.", applyable: true },
    ],
  },
];

/** Kennzahlen über die noch offenen (nicht angewendeten) Befunde berechnen. */
const statsOf = (rows: CleanupRow[], applied: Set<string>): CleanupStats => {
  const open = rows.filter((r) => !applied.has(r.id));
  const count = (sev: CleanupSeverity) => open.filter((r) => r.severity === sev).length;
  return {
    open: open.length,
    high: count("hoch"),
    medium: count("mittel"),
    low: count("niedrig"),
    loc: open.reduce((sum, r) => sum + r.loc, 0),
    minutes: open.reduce((sum, r) => sum + r.minutes, 0),
  };
};

/**
 * Zentraler Bereinigungs-Hook: persistierter Zustand + Mutatoren + abgeleitete
 * Kennzahlen (Gesamt & je Kategorie). Wird von Bereinigen- und Übersicht-Seite genutzt.
 * Quelle: analysierte Befunde aus dem Store (falls vorhanden), sonst Demo-Daten.
 */
export const useCleanup = () => {
  const { applied, ready, add, remove, addMany } = useCleanupApplied();
  const findings = useFindings();

  // Analysiert? → echte Befunde. Sonst die statischen Beispiel-Accordions.
  const accordions = findings && findings.length > 0 ? findings : CLEANUP_ACCORDIONS;
  const allRows = accordions.flatMap((a) => a.rows);

  return {
    applied,
    ready,
    add,
    remove,
    addMany,
    accordions,
    /** Wurde das Projekt bereits analysiert (echte Befunde im Store)? */
    analyzed: Boolean(findings && findings.length > 0),
    /** Kennzahlen über alle Kategorien. */
    totals: statsOf(allRows, applied),
    /** Kennzahlen einer einzelnen Kategorie. */
    statsFor: (category: CleanupCategory) =>
      statsOf(accordions.filter((a) => a.category === category).flatMap((a) => a.rows), applied),
    /** Ein Accordion gilt als erledigt, wenn alle seine Zeilen angewendet sind. */
    accordionDone: (a: CleanupAccordion) => a.rows.length > 0 && a.rows.every((r) => applied.has(r.id)),
    /** IDs aller niedrig eingestuften Befunde ("sicher bereinigbar"). */
    safeIds: allRows.filter((r) => r.severity === "niedrig").map((r) => r.id),
    /** Noch offene niedrig eingestufte Befunde. */
    safeCount: allRows.filter((r) => r.severity === "niedrig" && !applied.has(r.id)).length,
    /** Gesamtzahl niedrig eingestufter Befunde. */
    totalLow: allRows.filter((r) => r.severity === "niedrig").length,
  };
};
