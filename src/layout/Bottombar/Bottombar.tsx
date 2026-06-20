import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";

type BottombarVariant = "uebersicht" | "bereinigen" | "kritisch" | "hoch" | "mittel" | "niedrig" | "optimieren";

type Step = { label: string; to: string };

/** Navigationsfluss je Seite: Zurück-/Weiter-Ziel + Beschriftung (gemäß Figma). */
const FLOW: Record<BottombarVariant, { back?: Step; next: Step }> = {
  uebersicht: { next: { label: "Bereinigung starten", to: "/bereinigen" } },
  bereinigen: {
    back: { label: "Zurück zur Übersicht", to: "/übersicht" },
    next: { label: "Weiter zur Absichern (Kritisch)", to: "/absichern/kritisch" },
  },
  kritisch: {
    back: { label: "Zurück zu Bereinigen", to: "/bereinigen" },
    next: { label: "Weiter zur Absichern (Hoch)", to: "/absichern/hoch" },
  },
  hoch: {
    back: { label: "Zurück zu Absichern (Kritisch)", to: "/absichern/kritisch" },
    next: { label: "Weiter zur Absichern (Mittel)", to: "/absichern/mittel" },
  },
  mittel: {
    back: { label: "Zurück zu Absichern (Hoch)", to: "/absichern/hoch" },
    next: { label: "Weiter zur Absichern (Niedrig)", to: "/absichern/niedrig" },
  },
  niedrig: {
    back: { label: "Zurück zu Absichern (Mittel)", to: "/absichern/mittel" },
    next: { label: "Weiter zu Optimieren", to: "/optimieren" },
  },
  optimieren: {
    back: { label: "Zurück zu Absichern (Niedrig)", to: "/absichern/niedrig" },
    next: { label: "Weiter zur Übersicht", to: "/übersicht" },
  },
};

/**
 * Seitenfuß mit Schritt-Navigation (Zurück secondary-outlined / Weiter primary-outlined).
 * Bei "uebersicht" nur der Weiter-Button (rechtsbündig).
 */
const Bottombar = ({ variant }: { variant: BottombarVariant }) => {
  const navigate = useNavigate();
  const { back, next } = FLOW[variant];

  return (
    <footer
      data-layer="Bottombar"
      className="w-full h-22 border-t border-border-1 bg-bg-2/70 [--surface:var(--bg-2)] backdrop-blur-xl backdrop-saturate-150 px-7 py-6 shadow-inverted-md"
    >
      <div className="mx-auto flex max-w-300 px-8 items-center justify-between gap-4">
        {back ? (
          <Button color="secondary" variant="outlined" leftIcon="ArrowLeft" label={back.label} onClick={() => navigate(back.to)} />
        ) : (
          <span />
        )}
        <Button color="primary" variant="outlined" rightIcon="ArrowRight" label={next.label} onClick={() => navigate(next.to)} />
      </div>
    </footer>
  );
};

export default Bottombar;
