import type { ReactNode } from "react";
import Button from "@/components/Button";

/** Farbe des Bestätigen-Buttons — Teilmenge der Button-Farbfamilien. */
type AlertColor =
  | "primary"
  | "critical"
  | "error"
  | "success"
  | "warning"
  | "info"
  | "quality"
  | "security"
  | "performance";

type AlertProps = {
  title?: string;
  description?: ReactNode;
  /** Beschriftung des Bestätigen-Buttons. */
  confirmLabel?: string;
  /** Beschriftung des Abbrechen-Buttons. */
  cancelLabel?: string;
  /** Farbe des Bestätigen-Buttons. */
  confirmColor?: AlertColor;
  /** Bestätigen-Button ausblenden (nur Abbrechen anzeigen). */
  hideConfirm?: boolean;
  /** Abbrechen-Button ausblenden (nur Bestätigen anzeigen). */
  hideCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  className?: string;
};

/**
 * Alert / Bestätigungs-Box (gemäß Figma).
 * Rahmen-Karte mit Titel + Beschreibung und zwei vollbreiten Aktionen
 * (Bestätigen primär gefüllt · Abbrechen secondary gefüllt).
 */
const Alert = ({
  title = "Sind Sie sich sicher?",
  description = "Diese Aktion kann nicht rückgängig gemacht werden.",
  confirmLabel = "Anwenden",
  cancelLabel = "Abbrechen",
  hideConfirm,
  hideCancel,
  onConfirm,
  onCancel,
  className,
}: AlertProps) => {
  return (
    <div
      data-layer="Alert"
      role="alertdialog"
      aria-label={title}
      className={`flex w-full flex-col gap-6 rounded-md border border-border-1 bg-bg-1 px-6 py-5 shadow-lg ${className ?? ""}`}
    >
      {/* Body */}
      <div className="flex w-full flex-col gap-4">
        <h2 className="text-xl font-bold leading-6 font-display text-text-1">{title}</h2>
        <p className="text-base leading-6 tracking-[0.4px] text-text-3">{description}</p>
      </div>

      {/* Actions */}
      {(!hideConfirm || !hideCancel) && (
        <div className="flex w-full items-center gap-2">
          {!hideConfirm && (
            <Button color="success" variant="filled" label={confirmLabel} onClick={onConfirm} className="flex-1" />
          )}
          {!hideCancel && (
            <Button color="error" variant="filled" label={cancelLabel} onClick={onCancel} className="flex-1" />
          )}
        </div>
      )}
    </div>
  );
};

export default Alert;
