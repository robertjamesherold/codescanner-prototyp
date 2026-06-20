import { useState } from "react";
import Layout from "@/layout";
import components from "@/components";
import { useSecurity, type Severity } from "@/data/security";

/** Severity → Farbtoken (Tabs, Akzente). */
const SEVERITY_COLOR: Record<Severity, "critical" | "high" | "medium" | "low"> = {
  kritisch: "critical",
  hoch: "high",
  mittel: "medium",
  niedrig: "low",
};

/** Seite "Absichern" (/absichern/:severity) — Tabs + CWE-Karten + Code-Karte.
    Daten kommen live vom Backend (/api/security). Karten/Tabs ohne Befunde
    (total === 0) werden ausgeblendet; ist gar nichts da → Empty-State. */
const Absichern = ({ severity }: { severity: Severity }) => {
  const { security, ready } = useSecurity();
  const [active, setActive] = useState("Alle");

  const accent = `var(--${SEVERITY_COLOR[severity]})`;
  const data = security[severity];

  // Nur Karten mit tatsächlichen Befunden; Tabs daraus ableiten (+ "Alle").
  const foundCards = data.cards.filter((c) => c.total > 0);
  const tabs = ["Alle", ...foundCards.map((c) => c.id)];
  const effectiveActive = tabs.includes(active) ? active : "Alle";
  const visibleCards = foundCards.filter((c) => effectiveActive === "Alle" || c.id === effectiveActive);
  const code = data.code;

  return (
    <Layout.Content
      topbar={<Layout.Topbar variant="absichern" severity={severity} />}
      bottombar={<Layout.Bottombar variant={severity} />}
    >
      {!ready ? (
        <div className="p-8 text-text-3">Lädt …</div>
      ) : foundCards.length === 0 ? (
        <div className="mx-auto max-w-300 px-8 py-6">
          <div className="flex flex-col items-center gap-2 rounded-md border border-border-2 bg-grouped-1 px-8 py-16 text-center shadow-md">
            <span className="cardtitle text-text-1">Keine Befunde</span>
            <span className="body text-text-3">In dieser Schwere wurde nichts gefunden.</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-300 px-8 space-y-5 py-6">
          {/* Tab-Leiste (Severity-farbig) */}
          <div className="flex gap-3 border-b border-border-1">
            {tabs.map((t) => {
              const isActive = effectiveActive === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActive(t)}
                  className="px-4 py-3 text-xl leading-6 cursor-pointer"
                  style={isActive ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "var(--text-3)" }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Grid: links CWE-Karten, rechts Code-Karte */}
          <div className="grid grid-cols-6 gap-5">
            <div className="col-span-2 flex flex-col gap-4">
              {visibleCards.map((c) => (
                <components.CweCard key={c.id} severity={severity} {...c} onAction={() => setActive(c.id)} />
              ))}
            </div>
            {code && (
              <div className="col-span-4">
                <components.CodeCard
                  accent={accent}
                  icon="ShieldAlert"
                  fileTitle={code.fileTitle}
                  lineRange={code.lineRange}
                  fileIndex={code.fileIndex}
                  fileTotal={code.fileTotal}
                  description={code.description}
                  before={{ label: "Vorher:", tone: "error", code: code.before }}
                  after={{ label: "Nachher:", tone: "success", code: code.after }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout.Content>
  );
};

export default Absichern;
