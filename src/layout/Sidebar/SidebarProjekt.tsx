import { Link } from "react-router-dom";
import components from "@/components";
import Icon from "@/assets/icons";
import hooks from "@/hooks";

/**
 * Sidebar-Version 2 ("Im Projekt") — gemäß Figma-Frame.
 * Nav: Übersicht, Bereinigen, Absichern (aufklappbar), Optimieren.
 * Wird über den Route-Switch (index.tsx) auf Projekt-Routen angezeigt.
 */
const SidebarProjekt = () => {
  const { isOpen: isSideBarOpen, toggleSidebar } = hooks.useSideBarOpen();

  return (
    <aside
      data-layer="SidebarProjekt"
      className={`relative h-screen flex flex-col bg-bg-2 border-r border-border-1 shadow-[0px_1px_2px_rgba(0,0,0,0.15)] transition-all duration-300 ${
        isSideBarOpen ? "w-80" : "w-20"
      }`}
    >
      {/* Logo */}
      <div className={`flex h-20 transition-all duration-300 items-center ${isSideBarOpen ? "px-8" : "px-4 justify-center"}`}>
        <Link to="/übersicht" aria-label="Zur Übersicht" className="cursor-pointer">
          <components.Logo showWordmark={isSideBarOpen} />
        </Link>
      </div>

      {/* Body: Nav oben, Upgrade unten */}
      <div className={`flex flex-1 flex-col transition-all duration-300 justify-between min-h-0 py-8 ${isSideBarOpen ? "px-8" : "px-4"}`}>
        <nav className="flex flex-col gap-4">
          <components.NavLink
            to="/übersicht"
            icon={<Icon name="LayoutDashboard" strokeWidth={1.25} />}
            label="Übersicht"
            isSideBarOpen={isSideBarOpen}
          />
          <components.NavLink
            to="/bereinigen"
            icon={<Icon name="Eraser" strokeWidth={1.25} />}
            label="Bereinigen"
            isSideBarOpen={isSideBarOpen}
          />
          <components.NavGroup
            icon={<Icon name="ShieldCheck" strokeWidth={1.25} />}
            label="Absichern"
            isSideBarOpen={isSideBarOpen}
            children={[
              { to: "/absichern/kritisch", label: "Kritisch" },
              { to: "/absichern/hoch", label: "Hoch" },
              { to: "/absichern/mittel", label: "Mittel" },
              { to: "/absichern/niedrig", label: "Niedrig" },
            ]}
          />
          <components.NavLink
            to="/optimieren"
            icon={<Icon name="TrendingUp" strokeWidth={1.25} />}
            label="Optimieren"
            isSideBarOpen={isSideBarOpen}
          />
        </nav>

        <footer className="flex flex-col items-center gap-4">
          <components.UpgradeBlock collapsed={!isSideBarOpen} />
        </footer>
      </div>

      {/* Collapse-Button am rechten Rand */}
      <components.CollapseButton isSideBarOpen={isSideBarOpen} onToggle={toggleSidebar} />
    </aside>
  );
};

export default SidebarProjekt;
