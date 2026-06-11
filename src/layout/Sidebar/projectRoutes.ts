/**
 * "Im Projekt"-Routen. Befindet man sich auf einer davon, wird die
 * zweite Sidebar-Version (SidebarProjekt) angezeigt, sonst die Standard-Sidebar.
 */
export const PROJECT_ROUTE_PREFIXES = [
  "/übersicht",
  "/bereinigen",
  "/absichern",
  "/optimieren",
] as const;

export const isProjectRoute = (pathname: string): boolean => {
  const decoded = decodeURIComponent(pathname);
  return PROJECT_ROUTE_PREFIXES.some(
    (prefix) => decoded === prefix || decoded.startsWith(`${prefix}/`),
  );
};
