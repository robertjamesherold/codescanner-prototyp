type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";
type BadgeVariant = "filled" | "transparent";

type SeverityBadgeProps = {
  severity: Severity;
  variant?: BadgeVariant;
};

/** Label + Farb-Token (Priority-Skala) je Schweregrad. */
const SEVERITY: Record<Severity, { label: string; colorVar: string }> = {
  kritisch: { label: "Kritisch", colorVar: "var(--critical)" },
  hoch: { label: "Hoch", colorVar: "var(--high)" },
  mittel: { label: "Mittel", colorVar: "var(--medium)" },
  niedrig: { label: "Niedrig", colorVar: "var(--low)" },
};

/**
 * Schweregrad-Badge (Kritisch/Hoch/Mittel/Niedrig) in zwei Stilen:
 * - filled:      gefüllt mit Severity-Farbe, weißer Text
 * - transparent: Outline + farbiger Text (Default)
 * Farbe kommt als CSS-Var per style, damit Tailwind keine dynamischen Klassen purgen muss.
 */
const SeverityBadge = ({ severity, variant = "transparent" }: SeverityBadgeProps) => {
  const { label, colorVar } = SEVERITY[severity];
  const filled = variant === "filled";
  // "kritisch" (critical) bekommt im gefüllten Stil dunklen Text statt invertiertem.
  const filledText = severity === "kritisch" ? "text-white" : "text-text-inverted";

  return (
    <span
      data-layer="SeverityBadge"
      className={`chips inline-flex h-7 items-center justify-center rounded-md px-4 whitespace-nowrap ${
        filled ? filledText : "border"
      }`}
      style={filled ? { backgroundColor: colorVar } : { borderColor: colorVar, color: colorVar }}
    >
      {label}
    </span>
  );
};

export default SeverityBadge;
