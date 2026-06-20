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

/** Höhen der überlagernden Glass-Bars (entsprechen dem bisherigen Grid-Layout). */
const TOPBAR_H = 192;
const BOTTOMBAR_H = 88;

/**
 * Rechter Seitenbereich neben der Sidebar.
 * Der Inhalt scrollt unter den überlagerten Glass-Bars (Topbar/Bottombar) hindurch,
 * damit der Backdrop-Blur den durchscheinenden Inhalt zeigt. Padding hält den
 * Inhalt frei von den Bars.
 */
const Content = ({ topbar, bottombar, children, className }: ContentProps) => {
  return (
    <div data-layer="Content" className="relative h-full min-h-0 w-full overflow-hidden">
      <div
        className={`h-full overflow-auto ${className ?? ""}`}
        style={{
          paddingTop: topbar ? TOPBAR_H : undefined,
          paddingBottom: bottombar ? BOTTOMBAR_H : undefined,
        }}
      >
        {children}
      </div>

      {topbar && <div className="absolute inset-x-0 top-0 z-1000 shadow-lg">{topbar}</div>}
      {bottombar && <div className="absolute inset-x-0 bottom-0 z-1000 shadow-inverted-md">{bottombar}</div>}
    </div>
  );
};

export default Content;
