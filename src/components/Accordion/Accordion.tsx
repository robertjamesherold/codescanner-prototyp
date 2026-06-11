import React from "react";
import Icon from "@/assets/icons";
import SeverityBadge from "@/components/SeverityBadge";

type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

export type AccordionRow = {
  label: string;
  severity: Severity;
  path: string;
  loc: number;
  detail: string;
  applyable?: boolean;
};

type AccordionProps = {
  title: string;
  rows: AccordionRow[];
  defaultOpen?: boolean;
};

const SEVERITY_COLOR: Record<Severity, string> = {
  kritisch: "var(--critical)",
  hoch: "var(--high)",
  mittel: "var(--medium)",
  niedrig: "var(--low)",
};

/**
 * Aufklappbarer Abschnitt mit abhakbaren Zeilen (z.B. doppelte Dateien).
 * Pro Zeile: Checkbox, Severity-Label, Pfad/LOC-Info, Badge, Detail + "Anwenden".
 * "Anwenden" markiert die Zeile als erledigt (durchgestrichen).
 */
const Accordion = ({ title, rows, defaultOpen = true }: AccordionProps) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const [checked, setChecked] = React.useState<boolean[]>(() => rows.map(() => false));
  const [applied, setApplied] = React.useState<boolean[]>(() => rows.map(() => false));
  const [expanded, setExpanded] = React.useState<boolean[]>(() => rows.map(() => false));

  const toggleChecked = (i: number) => setChecked((c) => c.map((v, j) => (j === i ? !v : v)));
  const apply = (i: number) => setApplied((a) => a.map((v, j) => (j === i ? true : v)));
  const toggleExpanded = (i: number) => setExpanded((e) => e.map((v, j) => (j === i ? !v : v)));

  return (
    <div data-layer="Accordion" className="w-full overflow-hidden rounded-md border border-border-1 bg-grouped-1">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 cursor-pointer"
      >
        <Icon
          name="ChevronRight"
          size={16}
          strokeWidth={2}
          className={`text-icon-1 transition-transform duration-300 ${open ? "rotate-90" : ""}`}
        />
        <span className="text-base text-text-1">{title}</span>
      </button>

      {/* Rows */}
      {open &&
        rows.map((row, i) => {
          const isApplied = applied[i];
          const accent = SEVERITY_COLOR[row.severity];
          return (
            <div key={row.path} className="flex items-start gap-2 border-t border-border-1 px-3 py-2">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleChecked(i)}
                disabled={isApplied}
                className={`mt-[5px] flex size-[18px] shrink-0 items-center justify-center rounded-sm border ${
                  isApplied
                    ? "border-transparent"
                    : checked[i]
                      ? "border-quality bg-quality"
                      : "border-text-disabled cursor-pointer"
                }`}
              >
                {(checked[i] || isApplied) && <Icon name="Check" size={12} strokeWidth={3} color={isApplied ? "var(--low)" : "white"} />}
              </button>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Zeilenkopf — klickbar: Detail auf-/zuklappen */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(i)}
                  aria-expanded={expanded[i]}
                  disabled={isApplied}
                  className={`flex w-full items-center gap-3 text-left ${isApplied ? "" : "cursor-pointer"}`}
                >
                  <Icon
                    name="ChevronRight"
                    size={16}
                    strokeWidth={2}
                    className={`shrink-0 transition-transform duration-300 ${expanded[i] ? "rotate-90" : ""} ${isApplied ? "text-text-disabled" : "text-icon-1"}`}
                  />
                  <span
                    className={`flex-1 truncate text-base ${isApplied ? "text-text-disabled line-through" : ""}`}
                    style={{ color: isApplied ? undefined : accent }}
                  >
                    {row.label}
                  </span>
                  <span className={`flex items-center gap-1 text-sm ${isApplied ? "text-text-disabled line-through" : "text-text-1"}`}>
                    <Icon name="FileText" size={14} strokeWidth={2} className="text-text-3" />
                    {row.path}
                  </span>
                  <span className={`flex items-center gap-1 text-sm ${isApplied ? "text-text-disabled line-through" : "text-text-3"}`}>
                    <Icon name="Code" size={14} strokeWidth={2} className="text-text-3" />
                    {row.loc} LOC
                  </span>
                  {!isApplied && <SeverityBadge severity={row.severity} variant="filled" />}
                </button>

                {/* Detail — nur sichtbar wenn die Zeile aufgeklappt ist */}
                {expanded[i] && !isApplied && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 flex-1 items-center rounded-md border border-border-1 bg-bg-2 px-3">
                      <span className="text-base text-text-3">{row.detail}</span>
                    </div>
                    {row.applyable && (
                      <button
                        type="button"
                        onClick={() => apply(i)}
                        className={`flex h-10 items-center rounded-md border px-4 text-base transition-colors ${
                          checked[i]
                            ? "border-info text-info cursor-pointer hover:bg-info/10"
                            : "border-info-disabled text-info-disabled opacity-50 cursor-default"
                        }`}
                        disabled={!checked[i]}
                      >
                        Anwenden
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default Accordion;
