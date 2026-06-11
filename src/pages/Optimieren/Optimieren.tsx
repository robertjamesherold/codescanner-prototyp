import { useState } from "react";
import Layout from "@/layout";
import components from "@/components";

const TABS = ["Alle", "Bundle", "Performance", "Architektur", "API-Effizienz"];

const OPTIMIERUNG_CODE = `type SettingsPayload = {
  language: 'de' | 'en';
  theme: 'light' | 'dark';
  notifications: boolean;
};`;

/** Seite "Optimieren" (/optimieren) — Tabs + Stat-Karten + Code-Karte (gemäß Figma). */
const Optimieren = () => {
  const [active, setActive] = useState("Alle");

  return (
    <Layout.Content
      topbar={<Layout.Topbar variant="optimieren" />}
      bottombar={<Layout.Bottombar variant="optimieren" />}
    >
      <div className="mx-auto max-w-300 px-8  space-y-5 py-6">
        {/* Tab-Leiste (performance-farbig) */}
        <div className="flex gap-3 border-b border-border-1">
          {TABS.map((t) => {
            const isActive = active === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActive(t)}
                className="px-4 py-3 text-xl leading-6 cursor-pointer"
                style={isActive ? { color: "var(--performance)", borderBottom: "1px solid var(--performance)" } : { color: "var(--text-3)" }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Grid: links Stat-Karten, rechts Code-Karte */}
        <div className="grid grid-cols-6 gap-5">
          <div className="col-span-2 flex flex-col gap-4">
            <components.StatCard icon="Package" color="performance" title="Bundle" primaryValue="5"
              metrics={[{ value: "98", label: "LOC" }, { value: "~10", label: "Min" }]} high={1} medium={3} low={1} highlighted />
            <components.StatCard icon="Zap" color="performance" title="Performance" primaryValue="7"
              metrics={[{ value: "328", label: "LOC" }, { value: "~8", label: "Min" }]} high={1} medium={3} low={3} />
            <components.StatCard icon="Layers" color="performance" title="Architektur" primaryValue="5"
              metrics={[{ value: "189", label: "LOC" }, { value: "~15", label: "Min" }]} high={1} medium={3} low={1} />
            <components.StatCard icon="Send" color="performance" title="API-Effizienz" primaryValue="8"
              metrics={[{ value: "156", label: "LOC" }, { value: "~11", label: "Min" }]} high={3} medium={3} low={2} />
          </div>

          <div className="col-span-4">
            <components.CodeCard
              accent="var(--performance)"
              icon="TrendingUp"
              fileTitle="Datei 1: utils.js"
              lineRange="Zeile 35-50"
              fileIndex={1}
              fileTotal={5}
              description="Die Benutzereingaben werden ohne ausreichende Validierung übernommen. Dadurch können fehlerhafte, unerwartete oder manipulierte Werte in die Anwendung gelangen."
              after={{ label: "Optimierung:", tone: "info", code: OPTIMIERUNG_CODE }}
            />
          </div>
        </div>
      </div>
    </Layout.Content>
  );
};

export default Optimieren;
