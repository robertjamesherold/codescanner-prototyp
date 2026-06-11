import Layout from "@/layout";
import components from "@/components";

/** Seite "Übersicht" (/übersicht) — Topbar + Karten-Grid (gemäß Figma). */
const Uebersicht = () => (
  <Layout.Content
    topbar={<Layout.Topbar variant="uebersicht" />}
    bottombar={<Layout.Bottombar variant="uebersicht" />}
  >
    <div className="mx-auto grid max-w-300 px-8  grid-cols-6 gap-5 py-12">
      {/* Reihe 1 */}
      <div className="col-span-4">
        <components.RecommendedStepCard />
      </div>
      <div className="col-span-2">
        <components.RiskCard />
      </div>

      {/* Reihe 2 */}
      <div className="col-span-3">
        <components.StatCard
          icon="Eraser"
          color="quality"
          title="Bereinigung"
          primaryValue="28"
          metrics={[
            { value: "120", label: "Dopplungen" },
            { value: "931", label: "LOC" },
            { value: "~8", label: "Min" },
          ]}
          high={5}
          medium={8}
          low={15}
        />
      </div>
      <div className="col-span-3">
        <components.StatCard
          icon="TrendingUp"
          color="performance"
          title="Optimierungen"
          primaryValue="25"
          metrics={[
            { value: "1183", label: "LOC" },
            { value: "~44", label: "Min" },
          ]}
          high={7}
          medium={12}
          low={5}
        />
      </div>

      {/* Reihe 3 */}
      <div className="col-span-6">
        <components.DiagramCard />
      </div>
    </div>
  </Layout.Content>
);

export default Uebersicht;
