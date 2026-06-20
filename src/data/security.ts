import { useEffect, useState } from "react";
import {
  EMPTY_SECURITY,
  loadSecurity,
  type CweCardData,
  type Security,
  type SecurityFinding,
  type Severity,
  type SeverityData,
} from "@/api/security";
import { useSecurityFixed } from "@/store/appState";

export type { CweCardData, Security, SecurityFinding, Severity, SeverityData };

export const useSecurity = () => {
  const [security, setSecurity] = useState<Security>(EMPTY_SECURITY);
  const [ready, setReady] = useState(false);
  const { securityFixed, mark: markFixed, unmark: unmarkFixed } = useSecurityFixed();

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

  return { security, ready, securityFixed, markFixed, unmarkFixed };
};
