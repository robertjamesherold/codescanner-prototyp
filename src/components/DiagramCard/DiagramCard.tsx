import React from "react";
import Icon from "@/assets/icons";

type SeriesKey = "security" | "quality" | "performance";
type Series = {
  key: SeriesKey;
  name: string;
  value: number;
  delta: number;
  color: string;
  data: number[];
};

/** Datenreihen (letzte 10 Analysen), absteigender Verlauf gemäß Figma. */
const SERIES: Series[] = [
  { key: "security", name: "Sicherheit", value: 15, delta: -4, color: "var(--security)", data: [28, 27, 26, 24, 22, 20, 19, 17, 16, 15] },
  { key: "quality", name: "Qualität", value: 17, delta: -5, color: "var(--quality)", data: [32, 31, 29, 28, 26, 24, 22, 20, 18, 17] },
  { key: "performance", name: "Leistung", value: 24, delta: -6, color: "var(--performance)", data: [40, 38, 36, 34, 32, 30, 29, 27, 25, 24] },
];

const DATES = ["3. Feb", "5. Feb", "7. Feb", "9. Feb", "11. Feb"];
const Y_TICKS = [60, 45, 30, 15, 0];
const W = 1000;
const H = 200;
const MAX = 60;

const toPoints = (data: number[]) =>
  data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - (v / MAX) * H }));

/** Catmull-Rom → Bézier für eine weiche Linie. */
const smoothPath = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

const linePath = (data: number[]) => smoothPath(toPoints(data));
const areaPath = (data: number[]) => `${smoothPath(toPoints(data))} L ${W} ${H} L 0 ${H} Z`;

/**
 * Diagramm-Karte "Risikoverlauf" — gestapelte Flächen für Sicherheit/Qualität/Leistung.
 * Klick auf einen Wert in der Legende zeigt die zugehörige Linie solo (erneuter Klick = alle).
 */
const DiagramCard = () => {
  const [solo, setSolo] = React.useState<SeriesKey | null>(null);

  const visible = solo ? SERIES.filter((s) => s.key === solo) : SERIES;
  // Größte Fläche zuerst zeichnen (hinten), kleinste vorne.
  const ordered = [...visible].sort((a, b) => Math.max(...b.data) - Math.max(...a.data));

  return (
    <div data-layer="DiagramCard" className="flex w-full flex-col gap-6 rounded-md border border-border-2 bg-grouped-1 p-5 shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Titel + Badge + Untertitel */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold leading-6 font-display text-text-1">Risikoverlauf</h3>
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm"
              style={{ backgroundColor: "color-mix(in srgb, var(--success) 20%, transparent)", color: "var(--success)" }}
            >
              <Icon name="TrendingDown" size={12} strokeWidth={2.5} />
              -23
            </span>
          </div>
          <span className="text-sm text-text-3">Letzte 10 Analysen</span>
        </div>

        {/* Mid: klickbare Legende (Solo) */}
        <div className="flex items-center gap-4">
          {SERIES.map((s) => {
            const active = solo === s.key;
            const dimmed = solo !== null && !active;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSolo((cur) => (cur === s.key ? null : s.key))}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-md px-1 py-0.5 cursor-pointer transition-opacity ${
                  dimmed ? "opacity-40 hover:opacity-70" : "opacity-100"
                }`}
              >
                <span className="h-[3px] w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-text-3">{s.name}</span>
                <span className="text-sm font-bold text-text-1">{s.value}</span>
                <span className="text-sm" style={{ color: "var(--success)" }}>
                  ({s.delta})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Info mit Hover-Tooltip */}
        <div className="relative">
          <button type="button" aria-label="Wie wird der Verlauf berechnet?" className="peer flex items-center rounded-md p-1 text-text-3 cursor-help hover:text-text-2">
            <Icon name="Info" size={16} strokeWidth={2} />
          </button>
          <div className="invisible absolute right-0 top-full z-20 mt-1 w-[281px] rounded-md border border-border-1 bg-grouped-1 p-5 opacity-0 shadow-card transition-opacity peer-hover:visible peer-hover:opacity-100">
            <p className="border-b border-border-1 pb-2 text-sm text-text-1">Wie wird der Verlauf berechnet?</p>
            <div className="flex flex-col gap-1 py-2">
              {[
                { c: "var(--critical)", n: "Kritisch", w: "x10" },
                { c: "var(--high)", n: "Hoch", w: "x5" },
                { c: "var(--medium)", n: "Mittel", w: "x2" },
                { c: "var(--low)", n: "Niedrig", w: "x1" },
              ].map((r) => (
                <div key={r.n} className="flex items-center gap-1.5 text-sm">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.c }} />
                  <span className="flex-1 text-text-3">{r.n}</span>
                  <span className="text-text-1">{r.w}</span>
                </div>
              ))}
            </div>
            <p className="border-t border-border-1 pt-2 text-sm text-text-3">Score = Σ (Gewicht × Anzahl)</p>
          </div>
        </div>
      </div>

      {/* Body: Y-Achse + Chart + X-Achse */}
      <div className="grid grid-cols-[auto_1fr] gap-x-3">
        {/* Y-Labels */}
        <div className="flex h-[204px] flex-col items-end justify-between text-sm text-text-3">
          {Y_TICKS.map((v) => (
            <span key={v} className="leading-none">{v}</span>
          ))}
        </div>

        {/* Chart */}
        <div className="relative h-[204px] overflow-hidden border-b border-l border-border-1">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <defs>
              {visible.map((s) => (
                <linearGradient key={s.key} id={`diag-grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            {/* Gitterlinien (gestrichelt) */}
            {[15, 30, 45, 60].map((v) => {
              const y = H - (v / MAX) * H;
              return (
                <line key={v} x1="0" y1={y} x2={W} y2={y} stroke="var(--border-1)" strokeWidth="1" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
              );
            })}
            {/* Flächen (hinten → vorne) */}
            {ordered.map((s) => (
              <path key={`area-${s.key}`} d={areaPath(s.data)} fill={`url(#diag-grad-${s.key})`} />
            ))}
            {/* Linien */}
            {ordered.map((s) => (
              <path key={`line-${s.key}`} d={linePath(s.data)} fill="none" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
        </div>

        {/* X-Labels */}
        <div />
        <div className="flex justify-between pt-2 text-sm text-text-3">
          {DATES.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiagramCard;
