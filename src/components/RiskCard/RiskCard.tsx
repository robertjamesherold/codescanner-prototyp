import type { ReactNode } from "react";
import Icon from "@/assets/icons";
import Button from "@/components/Button";

type IconName = Parameters<typeof Icon>[0]["name"];

type RiskCardProps = {
  /** Badge-Text im getönten Header. */
  badge?: string;
  /** Akzent-Farbtoken (Header, Zahl, Button), z.B. "critical". */
  color?: "critical" | "high" | "medium" | "low";
  headerIcon?: IconName;
  count?: string | number;
  title?: string;
  description?: ReactNode;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
};

/**
 * Risiko-/Sicherheitswarnungs-Karte.
 * Getönter Header + große Kennzahl + Titel/Beschreibung + vollbreiter Outline-Button.
 */
const RiskCard = ({
  badge = "Sicherheitswarnung",
  color = "critical",
  headerIcon = "ShieldX",
  count = "8",
  title = "Kritische Risiken",
  description = (
    <>
      Sofortige Behebung empfohlen,
      <br />
      unabhängig von der Bereinigung.
    </>
  ),
  actionLabel = "Sofort absichern",
  actionIcon = "ArrowRight",
  onAction,
}: RiskCardProps) => {
  const accent = `var(--${color})`;

  return (
    <div data-layer="RiskCard" className="flex h-full w-full flex-col overflow-hidden rounded-md border border-border-2 bg-grouped-1">
      {/* Header (getönt) */}
      <div className="relative flex items-center gap-2 py-3 pl-4 pr-3">
        <span aria-hidden className="absolute inset-0 opacity-10" style={{ backgroundColor: accent }} />
        <Icon name={headerIcon} size={18} strokeWidth={2} color={accent} className="relative shrink-0" />
        <span className="relative text-base leading-6" style={{ color: accent }}>
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-5 pt-4">
        <div className="flex flex-col gap-4">
          <span className="text-xl font-bold leading-6 font-display" style={{ color: accent }}>
            {count}
          </span>
          <h3 className="text-xl font-bold leading-6 font-display text-text-1">{title}</h3>
          <p className="body text-text-3">{description}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <Button
          color={color}
          variant="outlined"
          label={actionLabel}
          rightIcon={actionIcon}
          onClick={onAction}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default RiskCard;
