import { useEffect, useState } from "react";
import {
  EMPTY_SECURITY,
  loadSecurity,
  type CweCardData,
  type Security,
  type SecurityCode,
  type Severity,
  type SeverityData,
} from "@/api/security";

export type { CweCardData, Security, SecurityCode, Severity, SeverityData };

/* ============================================================================
   Sicherheits-Hook (Absichern): lädt die Befunde einmalig vom Backend.
   `ready` unterscheidet "lädt noch" von "wirklich nichts gefunden", damit die
   Seite nicht kurz fälschlich den Empty-State zeigt.
   ========================================================================== */
export const useSecurity = (): { security: Security; ready: boolean } => {
  const [security, setSecurity] = useState<Security>(EMPTY_SECURITY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadSecurity().then((s) => {
      if (!alive) return;
      setSecurity(s);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { security, ready };
};
