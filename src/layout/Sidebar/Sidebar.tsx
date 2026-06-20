import { Link } from "react-router-dom";
import components from "@/components";
import Icon from "@/assets/icons";
import hooks from "@/hooks";

const Sidebar = () => {
  const { isOpen: isSideBarOpen, toggleSidebar, ...rest } = hooks.useSideBarOpen();

  return (
    <aside
      data-layer="Sidebar"
    className={`relative h-screen z-2000 flex flex-col bg-bg-2 border-r border-border-1 transition-all duration-300 ${
        isSideBarOpen ? "w-80" : "w-20"
      }`}
      {...rest}
    >
      {/* Logo */}
      <div className={`flex h-20 items-center transition-all duration-300 ${isSideBarOpen ? "px-8" : "px-4 justify-center"}`}>
        <Link to="/home" aria-label="Zur Startseite" className="cursor-pointer">
          <components.Logo showWordmark={isSideBarOpen} />
        </Link>
      </div>

      {/* Body: Nav oben, Upgrade unten */}
      <div className={`flex flex-1 flex-col transition-all duration-300 items-start justify-between min-h-0 py-8 ${isSideBarOpen ? "px-8" : "px-4"}`}>
        <nav className="flex transition-all duration-300 flex-col w-full gap-4">
          <components.NavLink to="/home" icon={<Icon name="TV" strokeWidth={1.25} />} label="Start" isSideBarOpen={isSideBarOpen} />
          <components.NavLink to="/recent" icon={<Icon name="File" strokeWidth={1.25} />} label="Zuletzt verwendet" isSideBarOpen={isSideBarOpen} />
          <components.NavLink to="/" icon={<Icon name="Clock" strokeWidth={1.25} />} label="Aktuelles" isDisabled={true} isSideBarOpen={isSideBarOpen} />
          <components.NavLink to="/community" icon={<Icon name="Users" strokeWidth={1.25} />} label="Community" isDisabled={true} isSideBarOpen={isSideBarOpen} />
        </nav>

  

        <footer className="flex w-full flex-col items-center gap-4">
          <components.NavLink
            to="/einstellungen"
            icon={<Icon name="Wrench" strokeWidth={1.25} />}
            label="Einstellungen"
            isSideBarOpen={isSideBarOpen}
          />
          <components.UpgradeBlock collapsed={!isSideBarOpen} />
        </footer>
      </div>


      {/* Collapse-Button am rechten Rand */}
      <components.CollapseButton isSideBarOpen={isSideBarOpen} onToggle={toggleSidebar} />
    </aside>
  );
};

export default Sidebar;
