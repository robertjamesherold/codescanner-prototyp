import { useNavigate } from "react-router-dom";
import Layout from "@/layout";
import components from "@/components";
import { useCleanup } from "@/data/cleanup";
import { useOverview } from "@/data/overview";

/** Seite "Übersicht" (/übersicht) — Topbar + Karten-Grid (gemäß Figma). */
const Uebersicht = () => {
  const navigate = useNavigate();
  // Live-Kennzahlen der Bereinigung (persistierter Zustand, geteilt mit der Bereinigen-Seite).
  const { totals } = useCleanup();
  // Übersichts-Kennzahlen vom Backend (Sicherheit, Optimierung, Risikoverlauf).
  const { overview } = useOverview();

  return (
  <Layout.Content
    topbar={<Layout.Topbar variant="uebersicht" />}
    bottombar={<Layout.Bottombar variant="uebersicht" />}
  >
    <div className="mx-auto grid max-w-300 px-8  grid-cols-6 gap-5 py-12">
      {/* Reihe 1 */}
      <div className="col-span-4">
        <components.RecommendedStepCard
          stats={[
            { icon: "AlertTriangle", label: `${totals.open} Befunde` },
            { icon: "Code", label: `${totals.loc} LOC` },
            { icon: "Clock", label: `~${totals.minutes} Min` },
          ]}
          onPrimary={() => navigate("/bereinigen")}
          onSkip={() => navigate("/absichern/kritisch")}
        />
      </div>
      <div className="col-span-2">
        <components.RiskCard
          count={overview.security.critical}
          onAction={() => navigate("/absichern/kritisch")}
        />
      </div>

      {/* Reihe 2 */}
      <div className="col-span-3">
        <components.StatCard
          icon="Eraser"
          color="quality"
          title="Bereinigung"
          primaryValue={String(totals.open)}
          metrics={[
            { icon: "Code", value: String(totals.loc), label: "LOC" },
            { icon: "Clock", value: `~${totals.minutes}`, label: "Min" },
          ]}
          high={totals.high}
          medium={totals.medium}
          low={totals.low}
          onClick={() => navigate("/bereinigen")}
        />
      </div>
      <div className="col-span-3">
        <components.StatCard
          icon="TrendingUp"
          color="performance"
          title="Optimierungen"
          primaryValue={String(overview.optimization.open)}
          metrics={[
            { icon: "Code", value: String(overview.optimization.loc), label: "LOC" },
            { icon: "Clock", value: `~${overview.optimization.minutes}`, label: "Min" },
          ]}
          high={overview.optimization.high}
          medium={overview.optimization.medium}
          low={overview.optimization.low}
          onClick={() => navigate("/optimieren")}
        />
      </div>

      {/* Reihe 3 */}
      <div className="col-span-6">
        <components.DiagramCard
          series={overview.history.series}
          dates={overview.history.dates}
          totalDelta={overview.history.totalDelta}
        />
      </div>
    </div>
  </Layout.Content>
  );
};

export default Uebersicht;
