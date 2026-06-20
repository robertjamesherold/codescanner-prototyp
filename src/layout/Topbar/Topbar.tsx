import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  /** Überschreibt das Label des Primär-Buttons (z.B. "12 Sicher bereinigen"). */
  primaryLabel?: string;
  /** Deaktiviert den Primär-Button. */
  primaryDisabled?: boolean;
  /** Erledigt-Zustand des Primär-Buttons → Success-Farbe (disabled). */
  primaryDone?: boolean;
  /** Überschreibt die Info-Zeile (Icon/Wert/Label) der Standard-Varianten. */
  info?: { icon: IconName; value: string; label: string }[];
  /** Nur bei variant="recent": gesteuertes Suchfeld. */
  search?: string;
  onSearchChange?: (value: string) => void;
};

/** Nächste Absichern-Severity (für „Nächstes Pattern" / „Überspringen"). */
const NEXT_SEVERITY_ROUTE: Record<Severity, string> = {
  kritisch: "/absichern/hoch",
  hoch: "/absichern/mittel",
  mittel: "/absichern/niedrig",
  niedrig: "/optimieren",
};

/** Recent-Filter-Tabs. */
const RECENT_FILTERS = ["Zuletzt angesehen", "Freigegebene Dateien", "Geteilte Projekte"];

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
  primaryLabel,
  primaryDisabled,
  primaryDone,
  info,
  search,
  onSearchChange,
}: TopbarProps) => {
  const navigate = useNavigate();
  const [recentFilter, setRecentFilter] = useState(RECENT_FILTERS[0]);

  const wrapper =
    "w-full border-b border-border-1 bg-bg-2/70 [--surface:var(--bg-2)] backdrop-blur-xl backdrop-saturate-150 h-48 z-200 py-6 ";

  // Standard-Aktion je Seite — durch onPrimaryAction/onSkip überschreibbar.
  const defaultPrimary: () => void =
    variant === "recent"
      ? () => navigate("/home")
      : variant === "bereinigen"
        ? () => navigate("/absichern/kritisch")
        : variant === "absichern"
          ? () => navigate(NEXT_SEVERITY_ROUTE[severity])
          : variant === "optimieren"
            ? () => navigate("/übersicht")
            : () => {};

  const defaultSkip: () => void =
    variant === "bereinigen"
      ? () => navigate("/absichern/kritisch")
      : variant === "absichern"
        ? () => navigate(NEXT_SEVERITY_ROUTE[severity])
        : variant === "optimieren"
          ? () => navigate("/übersicht")
          : () => {};

  const handlePrimary = onPrimaryAction ?? defaultPrimary;
  const handleSkip = onSkip ?? defaultSkip;

  // --- recent: Sonderlayout ---
  if (variant === "recent") {
    return (
      <header data-layer="Topbar" className={wrapper}>
        <div className="mx-auto flex max-w-300 px-8  flex-col gap-4">
          {/* Reserviert die Höhe der fehlenden obersten Reihe (Back-Link/Projekt),
              damit die recent-Topbar genauso hoch ist wie die anderen Varianten. */}
          <div aria-hidden className="h-10" />

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-4">
              <Headline variant="recent" />
              <div className="flex items-center gap-2">
                {RECENT_FILTERS.map((f) => {
                  const isActive = recentFilter === f;
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setRecentFilter(f)}
                      className={`rounded-sm px-2 py-1 text-sm cursor-pointer ${
                        isActive
                          ? "border border-border-1 bg-grouped-1 text-text-1"
                          : "text-text-2 hover:text-text-2-hover"
                      }`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-[280px] items-center gap-1 rounded-sm bg-bg-3 pl-3 pr-6">
                <Icon name="Search" size={18} strokeWidth={2} className="text-text-3" />
                <input
                  className="w-full bg-transparent text-base text-text-1 outline-none placeholder:text-text-3"
                  placeholder="Suche"
                  value={search ?? ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                />
              </div>
              <Button
                color="primary"
                variant="filled"
                label="Neues Projekt erstellen"
                rightIcon="Plus"
                onClick={handlePrimary}
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
        <Button color={primaryDone ? "success" : "primary"} variant="filled" label={primaryLabel ?? "15 Sicher bereinigen"} leftIcon="CheckSquare" onClick={handlePrimary} disabled={primaryDisabled} className="min-w-fit" />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={handleSkip} />
      </>
    );
  } else if (variant === "absichern") {
    actions = (
      <>
        <Button color={SEVERITY_COLOR[severity]} variant="filled" label="Nächstes Pattern" leftIcon="ArrowRight" onClick={handlePrimary} />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={handleSkip} />
      </>
    );
  } else if (variant === "optimieren") {
    actions = (
      <>
        <Button color={primaryDone ? "success" : "primary"} variant="filled" label={primaryLabel ?? "Sicher optimieren"} leftIcon="CheckSquare" onClick={handlePrimary} disabled={primaryDisabled} className="min-w-fit" />
        <Button color="secondary" variant="outlined" label="Überspringen" onClick={handleSkip} />
      </>
    );
  }

  const infoItems = info ?? INFO[variant];
  const bottom =
    variant === "absichern" ? (
      <PatternRow patterns={SEVERITY_PATTERNS[severity]} />
    ) : infoItems ? (
      <InfoRow items={infoItems} />
    ) : null;

  return (
    <header data-layer="Topbar" className={wrapper}>
      <div className="mx-auto flex max-w-300  px-8 flex-col gap-4">
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
