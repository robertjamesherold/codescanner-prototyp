import type { ReactNode } from "react";

type ContentProps = {
  /** Optionale Topbar (obere Reihe). */
  topbar?: ReactNode;
  /** Optionale Bottombar (untere Reihe). */
  bottombar?: ReactNode;
  children?: ReactNode;
  /** Klassen für den scrollbaren Inhaltsbereich (mittlere Reihe). */
  className?: string;
};

/**
 * Rechter Seitenbereich neben der Sidebar.
 * Drei Reihen: Topbar (falls vorhanden) · Inhalt · Bottombar (falls vorhanden).
 * Fehlt eine Bar, dehnt sich die mittlere Reihe (flex-1) über die fehlende Reihe aus.
 */
const Content = ({ topbar, bottombar, children, className }: ContentProps) => {
  return (
    <div data-layer="Content" className="flex h-full min-h-0 w-full flex-col">
      {topbar && <div className="shrink-0">{topbar}</div>}
      <div className={`min-h-0 flex-1 overflow-auto ${className ?? ""}`}>{children}</div>
      {bottombar && <div className="shrink-0">{bottombar}</div>}
    </div>
  );
};

export default Content;
