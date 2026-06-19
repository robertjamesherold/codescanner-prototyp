import { useState } from "react";
import Layout from "@/layout";
import components from "@/components";
import data from "@/data";


/** Doppelte-Dateien-Beispielzeilen (gemäß Figma). */
const DOPPELTE_DATEIEN = [
  { label: "utils-copy.ts ist identisch mit utils.ts", severity: "niedrig" as const, path: "src/lib/utils-copy.ts", loc: 87, detail: "98.7% Übereinstimmung. Abweichung: 2 Kommentarzeilen.", applyable: true },
  { label: "config.backup.ts dupliziert config.ts", severity: "niedrig" as const, path: "src/utils/helper-old.js", loc: 124, detail: "98.7% Übereinstimmung. Abweichung: 2 Kommentarzeilen.", applyable: true },
  { label: "types-v2.d.ts überlappt mit types.d.ts", severity: "mittel" as const, path: "src/types/types-v2.d.ts", loc: 45, detail: "98.7% Übereinstimmung. Abweichung: 2 Kommentarzeilen.", applyable: true },
];

/** Seite "Bereinigen" (/bereinigen) — Tabs + Stat-Karten + Accordions (gemäß Figma). */
const Bereinigen = () => {
  const [active, setActive] = useState("Alle");

  return (
    <Layout.Content
      topbar={<Layout.Topbar variant="bereinigen" />}
      bottombar={<Layout.Bottombar variant="bereinigen" />}
    >
      <div className="mx-auto max-w-300 px-8  space-y-5  py-6">

        <components.Tabbar active={active} setActive={setActive} tabs={Object.values(data.tabs)[0]} />


        {/* Grid: links Stat-Karten, rechts Accordions */}
        <div className="grid grid-cols-6 gap-5">
          <div className="col-span-2 flex flex-col gap-4">
            <components.StatCard icon="Copy" color="quality" title="Redundanz" primaryValue="9"
              metrics={[{ icon: "Code", value: "683", label: "LOC" }, { icon: "Clock", value: "~10", label: "Min" }]} high={1} medium={3} low={5} />
            <components.StatCard icon="Trash2" color="quality" title="Ballast" primaryValue="10"
              metrics={[{ icon: "Code", value: "245", label: "LOC" }, { icon: "Clock", value: "~6", label: "Min" }]} high={1} medium={3} low={6} />
            <components.StatCard icon="ListTree" color="quality" title="Struktur" primaryValue="5"
              metrics={[{ icon: "Code", value: "3", label: "LOC" }, { icon: "Clock", value: "~2", label: "Min" }]} high={1} medium={3} low={1} />
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <components.Accordion title="Doppelte Dateien" defaultOpen={false} rows={DOPPELTE_DATEIEN} />
            <components.Accordion title="Doppelter Code" defaultOpen={false} rows={[]} />
            <components.Accordion title="Toter Code" defaultOpen={false} rows={[]} />
            <components.Accordion title="Ungenutzte Exports" defaultOpen={false} rows={[]} />
            <components.Accordion title="Namen-Inkonsistenzen" defaultOpen={false} rows={[]} />
            <components.Accordion title="Ordnerstruktur" defaultOpen={false} rows={[]} />
          </div>
        </div>
      </div>
    </Layout.Content>
  );
};

export default Bereinigen;
