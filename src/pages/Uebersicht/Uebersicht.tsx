import { useNavigate } from "react-router-dom";
import Layout from "@/layout";
import components from "@/components";

/** Seite "Übersicht" (/übersicht) — Topbar + Karten-Grid (gemäß Figma). */
const Uebersicht = () => {
  const navigate = useNavigate();

  return (
  <Layout.Content
    topbar={<Layout.Topbar variant="uebersicht" />}
    bottombar={<Layout.Bottombar variant="uebersicht" />}
  >
    <div className="mx-auto grid max-w-300 px-8  grid-cols-6 gap-5 py-12">
      {/* Reihe 1 */}
      <div className="col-span-4">
        <components.RecommendedStepCard
          onPrimary={() => navigate("/bereinigen")}
          onSkip={() => navigate("/absichern/kritisch")}
        />
      </div>
      <div className="col-span-2">
        <components.RiskCard onAction={() => navigate("/absichern/kritisch")} />
      </div>

      {/* Reihe 2 */}
      <div className="col-span-3">
        <components.StatCard
          icon="Eraser"
          color="quality"
          title="Bereinigung"
          primaryValue="28"
          metrics={[
            { icon: "AlertTriangle", value: "120", label: "Dopplungen" },
            { icon: "Code", value: "931", label: "LOC" },
            { icon: "Clock", value: "~8", label: "Min" },
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
            { icon: "Code", value: "1183", label: "LOC" },
            { icon: "Clock", value: "~44", label: "Min" },
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
};

export default Uebersicht;
