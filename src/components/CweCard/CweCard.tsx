import Icon from "@/assets/icons";

type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

type CweCardProps = {
  severity: Severity;
  /** CWE-Kennung, z.B. "CWE-798". */
  id: string;
  description: string;
  time: string;
  timeUnit?: string;
  /** Anzahl offener Patterns. */
  open: number;
  /** Bereits abgearbeitete Patterns. */
  done: number;
  /** Gesamtzahl Patterns. */
  total: number;
  /** Hervorgehoben: farbiger Rahmen in Severity-Farbe. */
  highlighted?: boolean;
  onAction?: () => void;
};

const SEVERITY_COLOR: Record<Severity, string> = {
  kritisch: "var(--critical)",
  hoch: "var(--high)",
  mittel: "var(--medium)",
  niedrig: "var(--low)",
};

/** Shield-Icon je Schweregrad. */
const SEVERITY_ICON: Record<Severity, Parameters<typeof Icon>[0]["name"]> = {
  kritisch: "ShieldX",
  hoch: "ShieldMinus",
  mittel: "ShieldAlert",
  niedrig: "Shield",
};

/**
 * CWE-/Pattern-Karte: Severity-IconBox + CWE-ID + Beschreibung/Zeit,
 * Fortschrittsbalken (done/total) und "Pattern abarbeiten"-Aktion.
 */
const CweCard = ({
  severity,
  id,
  description,
  time,
  timeUnit = "Min",
  open,
  done,
  total,
  highlighted,
  onAction,
}: CweCardProps) => {
  const accent = SEVERITY_COLOR[severity];

  return (
    <div
      data-layer="CweCard"
      className="flex w-full flex-col gap-4 rounded-md border bg-grouped-1 p-5 shadow-md"
      style={{ borderColor: highlighted ? accent : "var(--border-2)" }}
    >
      {/* Kopf */}
      <div className="flex items-center gap-4">
        <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm">
          <span aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundColor: accent }} />
          <Icon name={SEVERITY_ICON[severity]} size={24} strokeWidth={2} color={accent} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex w-full items-start justify-between gap-2">
            <span className="text-xl font-bold leading-6 font-display text-text-1 whitespace-nowrap">{id}</span>
            <span className="flex items-end gap-1 text-lg leading-none whitespace-nowrap">
              <span className="text-text-1">{open}</span>
              <span className="text-text-2">offen</span>
            </span>
          </div>

          <div className="flex h-4 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon name="AlertTriangle" size={14} strokeWidth={2} className="text-text-1" />
              <span className="text-sm text-text-1 truncate w-36">{description}</span>
            </div>
            <span aria-hidden className="h-full w-px bg-border-2" />
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={14} strokeWidth={2} className="text-text-1" />
              <span className="text-sm text-text-1">{time}</span>
              <span className="text-sm text-text-3">{timeUnit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fortschritt */}
      <div className="flex w-full flex-col gap-2">
        <div className="flex h-2 w-full gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className="flex-1 rounded-full opacity-70"
              style={{ backgroundColor: i < done ? accent : "var(--grouped-3)" }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base text-text-3">
            {done}/{total} abgeschlossen
          </span>
          {done >= total ? (
            <span className="text-base text-text-3">Alle geschlossen</span>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="flex items-center gap-1 text-base cursor-pointer"
              style={{ color: accent }}
            >
              Pattern abarbeiten
              <Icon name="ChevronRight" size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CweCard;
