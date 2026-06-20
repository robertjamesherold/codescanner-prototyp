/* ============================================================================
   Persistenz-Client für die Übersichts-Kennzahlen.
   Liefert die Daten der Übersichtsseite, die NICHT aus den Bereinigungs-Befunden
   abgeleitet werden (die kommen live aus @/data/cleanup):
     - security      → Sicherheits-/Risiko-Karte (kritische Risiken)
     - optimization  → Optimierungs-Karte (Kennzahlen)
     - history       → Risikoverlauf-Diagramm (letzte Analysen)

   Primär gegen das Mini-Backend (/api/overview, siehe vite.config.ts); fällt auf
   den eingebauten Default zurück, falls kein Backend erreichbar ist (statischer
   Build / Offline). Defaults entsprechen den vormals hartkodierten Werten.
   ========================================================================== */

export type RiskSeriesKey = "security" | "quality" | "performance";

export type RiskSeries = {
  key: RiskSeriesKey;
  /** Anzeigename in der Legende. */
  name: string;
  /** Aktueller Score (letzter Datenpunkt). */
  value: number;
  /** Veränderung zum Vorzeitraum (negativ = Verbesserung). */
  delta: number;
  /** Verlaufswerte (älteste → neueste). */
  data: number[];
};

export type Overview = {
  /** Sicherheitslage → RiskCard. */
  security: {
    /** Anzahl kritischer Risiken (sofort absichern). */
    critical: number;
  };
  /** Optimierungs-Kennzahlen → StatCard "Optimierungen". */
  optimization: {
    open: number;
    loc: number;
    minutes: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Risikoverlauf → DiagramCard. */
  history: {
    dates: string[];
    /** Gesamtveränderung des Risiko-Scores (Badge im Header). */
    totalDelta: number;
    series: RiskSeries[];
  };
};

export const DEFAULT_OVERVIEW: Overview = {
  security: { critical: 8 },
  optimization: { open: 25, loc: 1183, minutes: 44, high: 7, medium: 12, low: 5 },
  history: {
    dates: ["3. Feb", "5. Feb", "7. Feb", "9. Feb", "11. Feb"],
    totalDelta: -23,
    series: [
      { key: "security", name: "Sicherheit", value: 15, delta: -4, data: [28, 27, 26, 24, 22, 20, 19, 17, 16, 15] },
      { key: "quality", name: "Qualität", value: 17, delta: -5, data: [32, 31, 29, 28, 26, 24, 22, 20, 18, 17] },
      { key: "performance", name: "Leistung", value: 24, delta: -6, data: [40, 38, 36, 34, 32, 30, 29, 27, 25, 24] },
    ],
  },
};

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const ALLOWED_KEYS: RiskSeriesKey[] = ["security", "quality", "performance"];

/** Eingehende, evtl. unvollständige Daten in eine sichere Overview-Form bringen. */
const normalize = (raw: unknown): Overview => {
  const o = (raw ?? {}) as Partial<Overview>;
  const sec = (o.security ?? {}) as Partial<Overview["security"]>;
  const opt = (o.optimization ?? {}) as Partial<Overview["optimization"]>;
  const hist = (o.history ?? {}) as Partial<Overview["history"]>;
  const d = DEFAULT_OVERVIEW;

  const series = Array.isArray(hist.series)
    ? (hist.series as Partial<RiskSeries>[])
        .filter((s) => s && ALLOWED_KEYS.includes(s.key as RiskSeriesKey))
        .map((s) => {
          const fallback = d.history.series.find((x) => x.key === s.key) ?? d.history.series[0];
          return {
            key: s.key as RiskSeriesKey,
            name: String(s.name ?? fallback.name),
            value: num(s.value, fallback.value),
            delta: num(s.delta, fallback.delta),
            data: Array.isArray(s.data) && s.data.length > 1 ? s.data.map((v) => num(v, 0)) : fallback.data,
          };
        })
    : d.history.series;

  return {
    security: { critical: num(sec.critical, d.security.critical) },
    optimization: {
      open: num(opt.open, d.optimization.open),
      loc: num(opt.loc, d.optimization.loc),
      minutes: num(opt.minutes, d.optimization.minutes),
      high: num(opt.high, d.optimization.high),
      medium: num(opt.medium, d.optimization.medium),
      low: num(opt.low, d.optimization.low),
    },
    history: {
      dates: Array.isArray(hist.dates) && hist.dates.length > 0 ? hist.dates.map(String) : d.history.dates,
      totalDelta: num(hist.totalDelta, d.history.totalDelta),
      series: series.length > 0 ? series : d.history.series,
    },
  };
};

/** Übersichts-Kennzahlen laden: Backend zuerst, sonst Default. */
export const loadOverview = async (): Promise<Overview> => {
  try {
    const res = await fetch("/api/overview");
    if (res.ok) return normalize(await res.json());
  } catch {
    /* Backend nicht erreichbar → Default */
  }
  return DEFAULT_OVERVIEW;
};

/** Übersichts-Kennzahlen ans Backend schreiben (für spätere Analyse-Flows). */
export const saveOverview = async (overview: Overview): Promise<void> => {
  try {
    await fetch("/api/overview", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overview),
    });
  } catch {
    /* Offline → ignorieren */
  }
};
