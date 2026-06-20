import React from "react";
import Icon from "@/assets/icons";
import SeverityBadge from "@/components/SeverityBadge";

type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

export type AccordionRow = {
  /** Eindeutige ID — nötig, wenn der Abschluss-Zustand kontrolliert wird. */
  id?: string;
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
  /** Kontrolliert: Menge der bereits abgeschlossenen Zeilen-IDs. */
  appliedIds?: Set<string>;
  /** Callback beim Abschließen ("Anwenden") einer Zeile (nur kontrolliert). */
  onApply?: (id: string) => void;
  /** Callback beim Rückgängigmachen einer Zeile (nur kontrolliert). */
  onUnapply?: (id: string) => void;
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
const Accordion = ({ title, rows, defaultOpen = true, appliedIds, onApply, onUnapply }: AccordionProps) => {
  const controlled = appliedIds !== undefined;
  const [open, setOpen] = React.useState(defaultOpen);
  const [checked, setChecked] = React.useState<boolean[]>(() => rows.map(() => false));
  const [appliedLocal, setAppliedLocal] = React.useState<boolean[]>(() => rows.map(() => false));
  const [expanded, setExpanded] = React.useState<boolean[]>(() => rows.map(() => false));

  const rowKey = (i: number) => rows[i].id ?? rows[i].path;
  const isApplied = (i: number) => (controlled ? appliedIds!.has(rowKey(i)) : appliedLocal[i]);

  // Alle Zeilen abgeschlossen → Accordion gilt als erledigt.
  const allApplied = rows.length > 0 && rows.every((_, i) => isApplied(i));

  const toggleChecked = (i: number) => setChecked((c) => c.map((v, j) => (j === i ? !v : v)));
  const apply = (i: number) => {
    if (controlled) onApply?.(rowKey(i));
    else setAppliedLocal((a) => a.map((v, j) => (j === i ? true : v)));
    // War das die letzte offene Zeile? → Accordion automatisch zuklappen.
    if (rows.every((_, j) => j === i || isApplied(j))) setOpen(false);
  };
  const unapply = (i: number) => {
    if (controlled) onUnapply?.(rowKey(i));
    else setAppliedLocal((a) => a.map((v, j) => (j === i ? false : v)));
    // Häkchen zurücksetzen, damit "Anwenden" erst nach erneutem Bestätigen aktiv wird.
    setChecked((c) => c.map((v, j) => (j === i ? false : v)));
  };
  const toggleExpanded = (i: number) => setExpanded((e) => e.map((v, j) => (j === i ? !v : v)));

  return (
    <div data-layer="Accordion" className={`w-full shadow-md overflow-hidden rounded-md border border-border-1 bg-grouped-1 transition-opacity duration-300 ${allApplied ? "opacity-50" : ""}`}>
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
          const rowApplied = isApplied(i);
          const accent = SEVERITY_COLOR[row.severity];
          return (
            <div key={rowKey(i)} className="flex items-start gap-2 border-t border-border-1 px-3 py-2">
              {/* Checkbox (bei abgeschlossener Zeile: Klick macht rückgängig) */}
              <button
                type="button"
                onClick={() => {
                  if (rowApplied) return unapply(i);
                  // Bei zugeklappter Zeile: erster Klick klappt auf (kein Häkchen).
                  if (!expanded[i]) return toggleExpanded(i);
                  toggleChecked(i);
                }}
                title={rowApplied ? "Rückgängig machen" : undefined}
                className={`mt-[5px] flex size-[18px] shrink-0 items-center justify-center rounded-sm border cursor-pointer ${
                  rowApplied
                    ? "border-transparent"
                    : checked[i]
                      ? "border-quality bg-quality"
                      : "border-text-disabled"
                }`}
              >
                {(checked[i] || rowApplied) && <Icon name="Check" size={12} strokeWidth={3} color={rowApplied ? "var(--low)" : "white"} />}
              </button>

              {/* Content */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Zeilenkopf — klickbar: Detail auf-/zuklappen; rechts ggf. "Rückgängig" */}
                <div className="flex w-full items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(i)}
                    aria-expanded={expanded[i]}
                    disabled={rowApplied}
                    className={`flex min-w-0 flex-1 items-center gap-3 text-left ${rowApplied ? "" : "cursor-pointer"}`}
                  >
                    <Icon
                      name="ChevronRight"
                      size={16}
                      strokeWidth={2}
                      className={`shrink-0 transition-transform duration-300 ${expanded[i] ? "rotate-90" : ""} ${rowApplied ? "text-text-disabled" : "text-icon-1"}`}
                    />
                    <span
                      className={`flex-1 truncate text-base ${rowApplied ? "text-text-disabled line-through" : ""}`}
                      style={{ color: rowApplied ? undefined : accent }}
                    >
                      {row.label}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${rowApplied ? "text-text-disabled line-through" : "text-text-1"}`}>
                      <Icon name="FileText" size={14} strokeWidth={2} className="text-text-3" />
                      {row.path}
                    </span>
                    <span className={`flex items-center gap-1 text-sm ${rowApplied ? "text-text-disabled line-through" : "text-text-3"}`}>
                      <Icon name="Code" size={14} strokeWidth={2} className="text-text-3" />
                      {row.loc} LOC
                    </span>
                    {!rowApplied && <SeverityBadge severity={row.severity} variant="filled" />}
                  </button>

                  {rowApplied && (
                    <button
                      type="button"
                      onClick={() => unapply(i)}
                      className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-text-3 cursor-pointer hover:text-text-1"
                    >
                      <Icon name="RotateCw" size={14} strokeWidth={2} />
                      Rückgängig
                    </button>
                  )}
                </div>

                {/* Detail — nur sichtbar wenn die Zeile aufgeklappt ist */}
                {expanded[i] && !rowApplied && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-fit flex-1 items-center rounded-md border border-border-1 bg-bg-2 py-2 px-3">
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
