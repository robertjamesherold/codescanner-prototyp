import type { CSSProperties, ReactNode } from "react";
import Icon from "@/assets/icons";

type ButtonColor =
  | "primary"
  | "secondary"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "quality"
  | "security"
  | "performance";

type ButtonVariant = "filled" | "outlined" | "ghost";
type IconName = Parameters<typeof Icon>[0]["name"];

type ButtonProps = {
  children?: ReactNode;
  label?: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  leftIcon?: IconName;
  rightIcon?: IconName;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  onClick?: () => void;
};

/** Farben, deren gefüllter Button dunklen Text (text-1) statt invertierten Text bekommt. */
const DARK_TEXT_COLORS = new Set<ButtonColor>([
  "primary",
  "secondary",
  "quality",
  "performance",
  "critical",
  "error",
]);

/** Statische Klassen je Variante — Farbe kommt über die --btn* CSS-Vars (per style gesetzt). */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  filled:
    "border bg-[var(--btn)] border-[var(--btn)] " +
    "hover:bg-[var(--btn-hover)] hover:border-[var(--btn-hover)] " +
    "active:bg-[var(--btn-pressed)] active:border-[var(--btn-pressed)] " +
    "disabled:bg-[var(--btn-disabled)] disabled:border-[var(--btn-disabled)]",
  outlined:
    "border bg-[var(--surface)] text-[var(--btn)] border-[var(--btn)] " +
    "hover:bg-[color-mix(in_srgb,var(--btn)_10%,var(--surface))] hover:text-[var(--btn-hover)] hover:border-[var(--btn-hover)] " +
    "active:bg-[color-mix(in_srgb,var(--btn)_20%,var(--surface))] active:text-[var(--btn-pressed)] active:border-[var(--btn-pressed)] " +
    "disabled:bg-[var(--surface)] disabled:text-[var(--btn-disabled)] disabled:border-[var(--btn-disabled)]",
  ghost:
    "border border-transparent bg-transparent text-[var(--btn)] " +
    "hover:bg-[var(--btn)]/10 hover:text-[var(--btn-hover)] " +
    "active:bg-[var(--btn)]/20 active:text-[var(--btn-pressed)] " +
    "disabled:bg-transparent disabled:text-[var(--btn-disabled)]",
};

/**
 * Button — Filled / Outlined / Ghost in allen Farbfamilien.
 * States (hover/pressed/disabled) über CSS-Pseudoklassen; die Farbe wird als
 * --btn / --btn-hover / --btn-pressed / --btn-disabled aus den Design-Tokens gesetzt.
 */
const Button = ({
  children,
  label,
  variant = "filled",
  color = "primary",
  leftIcon,
  rightIcon,
  disabled,
  type = "button",
  className,
  onClick,
}: ButtonProps) => {
  const colorVars = {
    "--btn": `var(--${color})`,
    "--btn-hover": `var(--${color}-hover)`,
    "--btn-pressed": `var(--${color}-pressed)`,
    "--btn-disabled": `var(--${color}-disabled)`,
  } as CSSProperties;

  // Gefüllter Text: dunkel (text-1) für ausgewählte Farben, sonst invertiert.
  const filledText = variant === "filled" ? (DARK_TEXT_COLORS.has(color) ? "text-white" : "text-text-inverted") : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-layer="Button"
      style={colorVars}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-base leading-6 whitespace-nowrap transition-colors cursor-pointer disabled:cursor-default ${VARIANT_CLASSES[variant]} ${filledText} ${className ?? ""}`}
    >
      {leftIcon && <Icon name={leftIcon} size={16} strokeWidth={2} />}
      {label ?? children}
      {rightIcon && <Icon name={rightIcon} size={16} strokeWidth={2} />}
    </button>
  );
};

export default Button;
