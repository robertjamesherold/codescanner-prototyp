import type { ReactNode } from "react";
import Icon from "@/assets/icons";
import Button from "@/components/Button";

type IconName = Parameters<typeof Icon>[0]["name"];
type Stat = { icon: IconName; label: string };

type RecommendedStepCardProps = {
  /** Badge-Text im getönten Header. */
  badge?: string;
  /** Akzent-Farbtoken (Header-Tönung + Text/Icon), z.B. "quality". */
  color?: string;
  /** Header-Icon. */
  headerIcon?: IconName;
  title?: string;
  description?: ReactNode;
  stats?: Stat[];
  primaryLabel?: string;
  primaryIcon?: IconName;
  skipLabel?: string;
  onPrimary?: () => void;
  onSkip?: () => void;
};

/**
 * "Empfohlener nächster Schritt"-Karte (z.B. "Bereinigung starten").
 * Getönter Header + Titel/Beschreibung + Stat-Zeile + Primär-/Sekundär-Aktion.
 */
const RecommendedStepCard = ({
  badge = "Empfohlener nächster Schritt",
  color = "quality",
  headerIcon = "Sparkles",
  title = "Bereinigung starten",
  description = (
    <>
      Reduziert Projektkomplexität und verbessert die Qualität
      <br />
      nachfolgender Sicherheits- und Performance-Analysen.
    </>
  ),
  stats = [
    { icon: "Copy", label: "12 Doppelte Dateien" },
    { icon: "Package", label: "4 ungenutzte Pakete" },
    { icon: "Clock", label: "~8 Min" },
  ],
  primaryLabel = "Bereinigung starten",
  primaryIcon = "ArrowRight",
  skipLabel = "Überspringen",
  onPrimary,
  onSkip,
}: RecommendedStepCardProps) => {
  const accent = `var(--${color})`;

  return (
    <div data-layer="RecommendedStepCard" className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border-2 bg-grouped-1">
      {/* Header (getönt) */}
      <div className="relative flex items-center gap-2 py-3 pl-4 pr-3">
        <span aria-hidden className="absolute inset-0 opacity-10" style={{ backgroundColor: accent }} />
        <Icon name={headerIcon} size={18} strokeWidth={2} color={accent} className="relative shrink-0" />
        <span className="relative text-base leading-6" style={{ color: accent }}>
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 px-5 pb-5 pt-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-xl font-bold leading-6 font-display text-text-1">{title}</h3>
          <p className="body text-text-3">{description}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 px-2">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="h-6 w-px bg-border-2" />}
              <div className="flex items-center gap-2">
                <Icon name={s.icon} size={14} strokeWidth={2} className="text-text-2" />
                <span className="body whitespace-nowrap text-text-2">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-5 pb-5">
        <Button color="primary" variant="filled" label={primaryLabel} rightIcon={primaryIcon} onClick={onPrimary} />
        <Button color="secondary" variant="outlined" label={skipLabel} onClick={onSkip} />
      </div>
    </div>
  );
};

export default RecommendedStepCard;
