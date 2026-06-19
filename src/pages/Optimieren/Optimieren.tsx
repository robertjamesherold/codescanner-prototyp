import { useState } from "react";
import Layout from "@/layout";
import components from "@/components";
import data from "@/data";


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
        {/* data.tabs is a keyed object; use the first entry to match Tabbar's expected shape */}
        <components.Tabbar active={active} setActive={setActive} tabs={Object.values(data.tabs)[5]} />

        {/* Grid: links Stat-Karten, rechts Code-Karte */}
        <div className="grid grid-cols-6 gap-5">
          <div className="col-span-2 flex flex-col gap-4">
            <components.StatCard icon="Package" color="performance" title="Bundle" primaryValue="5"
              metrics={[{ icon: "Code", value: "98", label: "LOC" }, { icon: "Clock", value: "~10", label: "Min" }]} high={1} medium={3} low={1} highlighted />
            <components.StatCard icon="Zap" color="performance" title="Performance" primaryValue="7"
              metrics={[{ icon: "Code", value: "328", label: "LOC" }, { icon: "Clock", value: "~8", label: "Min" }]} high={1} medium={3} low={3} />
            <components.StatCard icon="Layers" color="performance" title="Architektur" primaryValue="5"
              metrics={[{ icon: "Code", value: "189", label: "LOC" }, { icon: "Clock", value: "~15", label: "Min" }]} high={1} medium={3} low={1} />
            <components.StatCard icon="Send" color="performance" title="API-Effizienz" primaryValue="8"
              metrics={[{ icon: "Code", value: "156", label: "LOC" }, { icon: "Clock", value: "~11", label: "Min" }]} high={3} medium={3} low={2} />
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
