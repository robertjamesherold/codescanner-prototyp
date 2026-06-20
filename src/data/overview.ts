import { useEffect, useState } from "react";
import { DEFAULT_OVERVIEW, loadOverview, type Overview, type RiskSeries, type RiskSeriesKey } from "@/api/overview";

export type { Overview, RiskSeries, RiskSeriesKey };

/* ============================================================================
   Übersichts-Hook: lädt die Übersichts-Kennzahlen einmalig vom Backend und
   liefert bis dahin die Defaults (kein leeres Flackern). Wird von der
   Übersichtsseite genutzt (Risiko-, Optimierungs- und Verlaufs-Karte).
   ========================================================================== */
export const useOverview = (): { overview: Overview; ready: boolean } => {
  const [overview, setOverview] = useState<Overview>(DEFAULT_OVERVIEW);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadOverview().then((o) => {
      if (!alive) return;
      setOverview(o);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { overview, ready };
};
