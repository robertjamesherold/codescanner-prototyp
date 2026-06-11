import Icon from "@/assets/icons";
import Button from "@/components/Button";
import SeverityBadge from "@/components/SeverityBadge";
import Link from "@/components/Link";

type IconName = Parameters<typeof Icon>[0]["name"];
type TopbarVariant = "recent" | "uebersicht" | "bereinigen" | "absichern" | "optimieren";
type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

type TopbarProps = {
  variant: TopbarVariant;
  /** Nur bei variant="absichern" relevant. */
  severity?: Severity;
  projectName?: string;
  onBack?: () => void;
  onSkip?: () => void;
  onPrimaryAction?: () => void;
};

/** Headline-Konfiguration je Seite: Icon, Farb-Token, Titel. */
const HEAD: Record<TopbarVariant, { icon: IconName; color: string; title: string }> = {
  recent: { icon: "History", color: "primary", title: "Deine letzten Projekte" },
  uebersicht: { icon: "LayoutDashboard", color: "primary", title: "Übersicht" },
  bereinigen: { icon: "Eraser", color: "quality", title: "Bereinigen" },
  absichern: { icon: "Shield", color: "security", title: "Absichern" },
  optimieren: { icon: "TrendingUp", color: "performance", title: "Optimieren" },
};

type InfoItem = { icon: IconName; value: string; label: string };
const INFO: Partial<Record<TopbarVariant, InfoItem[]>> = {
  uebersicht: [
    { icon: "File", value: "8", label: "Dateien" },
    { icon: "AlertTriangle", value: "32", label: "Probleme gefunden" },
    { icon: "Calendar", value: "18.2.2026", label: "Zuletzt analysiert" },
  ],
  bereinigen: [
    { icon: "Copy", value: "120", label: "Dopplungen" },
    { icon: "Code", value: "931", label: "LOC" },
    { icon: "Clock", value: "~8", label: "Min" },
  ],
  optimieren: [
    { icon: "Sparkles", value: "25", label: "Optimierungen" },
    { icon: "Code", value: "771", label: "LOC" },
    { icon: "Clock", value: "~44", label: "Min" },
  ],
};

const SEVERITY_PATTERNS: Record<Severity, string[]> = {
  kritisch: ["Fehlende Eingabevalidierung", "Sensible Daten in Logs", "Schwache Zugriffskontrolle"],
  hoch: ["Unsichere Fehlerbehandlung"],
  mittel: ["Fest codierte Secrets", "SQL-Injektion", "Befehlsinjektion"],
  niedrig: ["Fehlender Verschlüsselung", "Server Side Request Forgery"],
};

const SEVERITY_COLOR: Record<Severity, "critical" | "high" | "medium" | "low"> = {
  kritisch: "critical",
  hoch: "high",
  mittel: "medium",
  niedrig: "low",
};

/** Shield-Icon je Schweregrad (für die Absichern-Headline). */
const SEVERITY_ICON: Record<Severity, IconName> = {
  kritisch: "ShieldX",
  hoch: "ShieldMinus",
  mittel: "ShieldAlert",
  niedrig: "Shield",
};

/** Headline: getönte IconBox + Titel (+ optionales Badge). */
const Headline = ({
  variant,
  badge,
  iconOverride,
}: {
  variant: TopbarVariant;
  badge?: React.ReactNode;
  iconOverride?: IconName;
}) => {
  const { icon, color, title } = HEAD[variant];
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm">
        <span aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundColor: `var(--${color})` }} />
        <Icon name={iconOverride ?? icon} size={26} strokeWidth={2} color={`var(--${color})`} />
      </div>
      <h1 className="text-2xl font-bold leading-9 font-display text-text-1 whitespace-nowrap">{title}</h1>
      {badge}
    </div>
  );
};

const ProjectLabel = ({ name }: { name: string }) => (
  <div className="flex items-center gap-2 text-base whitespace-nowrap">
    <span className="text-text-3">Projekt:</span>
    <span className="text-text-1">{name}</span>
  </div>
);

const InfoRow = ({ items }: { items: InfoItem[] }) => (
  <div className="flex min-h-7 items-center gap-3 text-sm">
    {items.map((it, i) => (
      <div key={it.label} className="flex items-center gap-3">
        {i > 0 && <span aria-hidden className="h-7 w-px bg-border-1" />}
        <div className="flex items-center gap-2">
          <Icon name={it.icon} size={16} strokeWidth={2} className="text-text-1" />
          <span className="text-text-1">{it.value}</span>
          <span className="text-text-3">{it.label}</span>
        </div>
      </div>
    ))}
  </div>
);

const PatternRow = ({ patterns }: { patterns: string[] }) => (
  <div className="flex min-h-7 items-center gap-2 text-sm text-text-1">
    <Icon name="AlertTriangle" size={16} strokeWidth={2} className="text-text-1" />
    {patterns.map((p, i) => (
      <div key={p} className="flex items-center gap-2">
        {i > 0 && <span aria-hidden className="mx-1 h-7 w-px bg-border-2" />}
        <span>{p}</span>
      </div>
    ))}
  </div>
);

/**
 * Seitenkopf (Topbar) für: recent, übersicht, bereinigen, alle absichern-Seiten, optimieren.
 * Konsistente 3-Zeilen-Struktur (Back-Link/Projekt · Headline/Actions · Info/Patterns);
 * "recent" weicht ab (Tabs + Suche + Neues Projekt).
 */
const Topbar = ({
  variant,
  severity = "kritisch",
  projectName = "Webanwendung",
  onBack,
  onSkip,
  onPrimaryAction,
}: TopbarProps) => {
  const wrapper =
    "w-full border-b border-border-1 bg-bg-2  py-6 shadow-[0px_1px_2px_rgba(0,0,0,0.15),0px_1px_3px_rgba(0,0,0,0.1)]";

  // --- recent: Sonderlayout ---
  if (variant === "recent") {
    return (
      <header data-layer="Topbar" className={wrapper}>
        <div className="mx-auto flex max-w-300  flex-col gap-4">
          {/* Reserviert die Höhe der fehlenden obersten Reihe (Back-Link/Projekt),
              damit die recent-Topbar genauso hoch ist wie die anderen Varianten. */}
          <div aria-hidden className="h-10" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <Headline variant="recent" />
              <div className="flex items-center gap-2">
                <button type="button" className="rounded-sm border border-border-1 bg-grouped-1 px-2 py-1 text-sm text-text-1 cursor-pointer">
                  Zuletzt angesehen
                </button>
                <button type="button" className="rounded-sm px-2 py-1 text-sm text-text-2 cursor-pointer hover:text-text-2-hover">
                  Freigegebene Dateien
                </button>
                <button type="button" className="rounded-sm px-2 py-1 text-sm text-text-2 cursor-pointer hover:text-text-2-hover">
                  Geteilte Projekte
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-[280px] items-center gap-1 rounded-sm bg-bg-3 pl-3 pr-6">
                <Icon name="Search" size={18} strokeWidth={2} className="text-text-3" />
                <input
                  className="w-full bg-transparent text-base text-text-1 outline-none placeholder:text-text-3"
                  placeholder="Suche"
                />
              </div>
              <Button
                color="primary"
                variant="filled"
                label="Neues Projekt erstellen"
                rightIcon="Plus"
                onClick={onPrimaryAction}
              />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // --- Standard-Layout (übersicht / bereinigen / absichern / optimieren) ---
  const backLabel = variant === "uebersicht" ? "Zurück zur Projektauswahl" : "Zurück zur Übersicht";
  const backTo = variant === "uebersicht" ? "/home" : "/übersicht";

  const badge =
    variant === "absichern" ? <SeverityBadge severity={severity} variant="filled" /> : undefined;

  let actions: React.ReactNode = null;
  if (variant === "bereinigen") {
    actions = (
      <>
        <Button color="primary" variant="filled" label="15 Sicher bereinigen" leftIcon="Sparkles" onClick={onPrimaryAction} />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={onSkip} />
      </>
    );
  } else if (variant === "absichern") {
    actions = (
      <>
        <Button color={SEVERITY_COLOR[severity]} variant="filled" label="Nächstes Pattern" leftIcon="ArrowRight" onClick={onPrimaryAction} />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={onSkip} />
      </>
    );
  } else if (variant === "optimieren") {
    actions = (
      <>
        <Button color="success" variant="filled" label="6 Sicher optimieren" leftIcon="Check" onClick={onPrimaryAction} />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={onSkip} />
      </>
    );
  }

  const bottom =
    variant === "absichern" ? (
      <PatternRow patterns={SEVERITY_PATTERNS[severity]} />
    ) : INFO[variant] ? (
      <InfoRow items={INFO[variant]!} />
    ) : null;

  return (
    <header data-layer="Topbar" className={wrapper}>
      <div className="mx-auto flex max-w-300  flex-col gap-4">
        {/* Zeile 1: Back-Link + Projekt */}
        <div className="flex items-center justify-between">
          <Link to={backTo} label={backLabel} rightIcon={null} onClick={onBack} />
          <ProjectLabel name={projectName} />
        </div>

        {/* Zeile 2: Headline + Actions */}
        <div className="flex items-center justify-between gap-4">
          <Headline variant={variant} badge={badge} iconOverride={variant === "absichern" ? SEVERITY_ICON[severity] : undefined} />
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Zeile 3: Info / Patterns */}
        {bottom}
      </div>
    </header>
  );
};

export default Topbar;
