import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import hooks from "@/hooks";

export type NavSubItem = { to: string; label: string };

type NavGroupProps = {
  icon: React.ReactNode;
  label: string;
  children: NavSubItem[];
  isSideBarOpen?: boolean;
};

/**
 * Aufklappbarer Nav-Eintrag (z.B. "Absichern") mit Subitems.
 * - Subitems: 40px hoch, ohne Icon, unter dem Parent-Label eingerückt.
 * - Höhen-Animation über den grid-rows 0fr→1fr Trick (sauber animierbar).
 * - Öffnet automatisch, wenn ein Subitem die aktive Route ist.
 * - Im eingeklappten Sidebar-Zustand: nur Icon, Subitems ausgeblendet.
 */
const NavGroup = ({ icon, label, children, isSideBarOpen }: NavGroupProps) => {
  const { pathname } = useLocation();
  const isChildActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  const anyChildActive = children.some((c) => isChildActive(c.to));

  const { toggleSidebar } = hooks.useSideBarOpen();

  const [manualOpen, setManualOpen] = React.useState(anyChildActive);
  const open = anyChildActive || manualOpen;

  const isExpanded = Boolean(isSideBarOpen) && open;

  const rowBase = `group h-12 w-full select-none rounded-md inline-flex items-center justify-start p-3 transition-all duration-300 ${
    isSideBarOpen ? "gap-4" : "gap-0"
  }`;

  return (
    <div className={`flex flex-col transition-all duration-300 ${isExpanded ? "gap-4" : "gap-0"}`}>
      <button
        type="button"
        onClick={() => {
          // Eingeklappt: erst die Sidebar öffnen und die Gruppe direkt aufklappen.
          if (!isSideBarOpen) {
            toggleSidebar();
            setManualOpen(true);
            return;
          }
          if (!anyChildActive) setManualOpen((v) => !v);
        }}
        aria-expanded={isExpanded}
        data-layer="NavGroup"
        className={`${rowBase} cursor-pointer ${
          anyChildActive
            ? "text-text-1 bg-secondary-active/20"
            : "text-text-2 bg-transparency hover:bg-secondary-hover/10 hover:text-text-2-hover"
        }`}
      >
        <span className="flex shrink-0 items-center justify-center">{icon}</span>
        <span
          className={`body whitespace-nowrap transition-all duration-300 ${
            isSideBarOpen
              ? "max-w-40 opacity-100 delay-100"
              : "max-w-0 -translate-x-1 opacity-0 overflow-hidden"
          }`}
        >
          {label}
        </span>
        {isSideBarOpen && (
          <ChevronDown
            size={16}
            className={`ml-auto transition-transform duration-300 ${open ? "rotate-0" : "-rotate-90"}`}
          />
        )}
      </button>

      {/* Subitems — animierte Höhe via grid-rows */}
      <div
        className={`grid transition-all duration-300 ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 pt-1">
            {children.map((item) => {
              const active = isChildActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-layer="NavSubLink"
                  data-active={active}
                  className={`body h-10 w-full select-none rounded-md inline-flex items-center pl-13 pr-3 whitespace-nowrap transition-colors ${
                    active
                      ? "text-text-1 bg-secondary-active/20"
                      : "text-text-2 bg-transparency hover:bg-secondary-hover/10 hover:text-text-2-hover"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavGroup;
