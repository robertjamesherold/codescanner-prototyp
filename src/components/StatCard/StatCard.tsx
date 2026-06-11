import Icon from "@/assets/icons";

type IconName = Parameters<typeof Icon>[0]["name"];
type Metric = { value: string; label: string; icon?: IconName };

type StatCardProps = {
  icon: IconName;
  /** Akzent-Farbtoken (IconBox), z.B. "performance" / "quality". */
  color: string;
  title: string;
  primaryValue: string | number;
  primaryUnit?: string;
  metrics: Metric[];
  /** Severity-Verteilung → Score-Balken + Badges. */
  high: number;
  medium: number;
  low: number;
  /** Hervorgehoben: Rahmen in Akzentfarbe. */
  highlighted?: boolean;
};

/**
 * Stat-Karte: IconBox + Titel + Primärwert, Metrik-Zeile,
 * Score-Balken (High/Medium/Low proportional) und Badges.
 */
const StatCard = ({ icon, color, title, primaryValue, primaryUnit = "offen", metrics, high, medium, low, highlighted }: StatCardProps) => {
  const accent = `var(--${color})`;
  const segments = [
    { n: high, label: "Hoch", c: "var(--high)" },
    { n: medium, label: "Mittel", c: "var(--medium)" },
    { n: low, label: "Niedrig", c: "var(--low)" },
  ];

  return (
    <div
      data-layer="StatCard"
      className="flex h-35 w-full flex-col justify-between gap-4 rounded-md border border-border-2 bg-grouped-1 p-5"
      style={highlighted ? { borderColor: accent } : undefined}
    >
      {/* Kopf: IconBox + Titel/Primärwert + Metriken */}
      <div className="flex items-center gap-4">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm">
          <span aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundColor: accent }} />
          <Icon name={icon} size={26} strokeWidth={2} color={accent} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex w-full items-start justify-between gap-2">
            <span className="text-xl font-bold leading-6 font-display text-text-1 whitespace-nowrap">{title}</span>
            <span className="flex items-end gap-1 text-lg leading-none whitespace-nowrap">
              <span className="text-text-1">{primaryValue}</span>
              {primaryUnit && <span className="text-text-2">{primaryUnit}</span>}
            </span>
          </div>

          <div className="flex h-4 items-center gap-3">
            {metrics.map((m, i) => (
              <div key={m.label} className="flex h-4 items-center gap-3">
                <div className="flex items-center gap-2">
                  <Icon name={m.icon ?? "Info"} size={14} strokeWidth={2} className="text-text-3" />
                  <span className="text-sm text-text-1">{m.value}</span>
                  <span className="text-sm text-text-3">{m.label}</span>
                </div>
                {i < metrics.length - 1 && <span aria-hidden className="h-full w-px bg-border-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score-Balken + Badges */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-2 w-full gap-1">
          {segments.map((s) => (
            <span key={s.label} className="rounded-full opacity-70" style={{ flex: s.n, backgroundColor: s.c }} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.c }} />
              <span className="text-base whitespace-nowrap" style={{ color: s.c }}>
                {s.n} {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
