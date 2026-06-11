import Layout from "@/layout";
import components from "@/components";

/** Demo-Projekte (gemäß Figma). */
const PROJECTS = [
  { title: "Webanwendung", editedLabel: "Bearbeitet vor 1 Stunde", files: "8", elapsedTime: "5h", expectedTime: "21h" },
  { title: "Cloud Service", editedLabel: "Bearbeitet vor 4 Stunden", files: "80", elapsedTime: "30h", expectedTime: "30h" },
  { title: "Test Framework", editedLabel: "Bearbeitet vor 2 Tagen", files: "72", elapsedTime: "25h", expectedTime: "120h" },
  { title: "Backend Service", editedLabel: "Bearbeitet vor 4 Tagen", files: "90", elapsedTime: "10h", expectedTime: "80h" },
  { title: "Desktop Anwendung", editedLabel: "Bearbeitet vor 2 Monaten", files: "122", elapsedTime: "314h", expectedTime: "3h" },
];

/** Seite "Zuletzt" (/recent) — recent-Topbar + Projekt-Grid. */
const Recent = () => (
  <Layout.Content topbar={<Layout.Topbar variant="recent" />}>
    <div className="mx-auto grid max-w-300 grid-cols-3 gap-5 py-12">
      {PROJECTS.map((p) => (
        <components.ProjectCard key={p.title} {...p} />
      ))}
    </div>
  </Layout.Content>
);

export default Recent;
