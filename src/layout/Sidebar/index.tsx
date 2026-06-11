import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import SidebarProjekt from "./SidebarProjekt";
import { isProjectRoute } from "./projectRoutes";

/**
 * Wählt die Sidebar-Version anhand der aktuellen Route:
 * - Projekt-Routen (/übersicht, /bereinigen, /absichern/*, /optimieren) → SidebarProjekt (v2)
 * - alle anderen (Standard-Routen) → Sidebar (v1)
 */
const SidebarSwitch = () => {
  const { pathname } = useLocation();
  return isProjectRoute(pathname) ? <SidebarProjekt /> : <Sidebar />;
};

export default SidebarSwitch;
