import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import Icon from "@/assets/icons";

type IconName = Parameters<typeof Icon>[0]["name"];

type LinkProps = {
  children?: ReactNode;
  label?: string;
  /** Ziel-Route → rendert einen react-router Link. Ohne `to` ein <button>. */
  to?: string;
  onClick?: () => void;
  /** Linkes Icon (Default Pfeil-links); `null` blendet es aus. */
  leftIcon?: IconName | null;
  /** Rechtes Icon (Default Check-Circle); `null` blendet es aus. */
  rightIcon?: IconName | null;
  disabled?: boolean;
};

/**
 * Text-Link (z.B. "Zurück zur Projektauswahl") in der secondary-Farbfamilie.
 * Unterstreichung auf hover/pressed, Disabled-Zustand. Optionale Icons links/rechts.
 */
const Link = ({
  children,
  label = "Zurück zur Projektauswahl",
  to,
  onClick,
  leftIcon = "ArrowLeft",
  rightIcon = "CheckCircle",
  disabled,
}: LinkProps) => {
  const className =
    "group inline-flex h-10 items-center gap-2 rounded-full py-3 text-base leading-6 whitespace-nowrap transition-colors " +
    (disabled
      ? "text-secondary-disabled cursor-default no-underline pointer-events-none"
      : "text-secondary cursor-pointer hover:text-secondary-hover hover:underline active:text-secondary-pressed active:underline active:font-medium underline-offset-2");

  const content = (
    <>
      {leftIcon && <Icon name={leftIcon} size={16} strokeWidth={2} className="shrink-0 no-underline" />}
      <span>{label ?? children}</span>
      {rightIcon && <Icon name={rightIcon} size={16} strokeWidth={2} className="shrink-0 no-underline" />}
    </>
  );

  if (to && !disabled) {
    return (
      <RouterLink to={to} onClick={onClick} data-layer="Link" className={className}>
        {content}
      </RouterLink>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} data-layer="Link" className={className}>
      {content}
    </button>
  );
};

export default Link;
