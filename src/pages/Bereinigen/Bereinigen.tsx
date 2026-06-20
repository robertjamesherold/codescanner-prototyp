import { useLayoutEffect, useRef, useState } from "react";
import Layout from "@/layout";
import components from "@/components";
import data from "@/data";

type IconName = Parameters<typeof components.StatCard>[0]["icon"];
type Severity = "hoch" | "mittel" | "niedrig";
type Category = "Redundanz" | "Ballast" | "Struktur";

type CleanupRow = {
  id: string;
  label: string;
  severity: Severity;
  path: string;
  loc: number;
  /** Geschätzter Aufwand in Minuten (fließt in die Karten-Metrik). */
  minutes: number;
  detail: string;
  applyable: boolean;
};

type CleanupAccordion = { title: string; category: Category; rows: CleanupRow[] };

/**
 * Bereinigungs-Befunde je Accordion. Jede Zeile hat eine eindeutige ID,
 * damit ihr Abschluss-Zustand auf Seitenebene verfolgt und in die Stat-Karten
 * eingerechnet werden kann.
 */
const ACCORDIONS: CleanupAccordion[] = [
  {
    title: "Doppelte Dateien",
    category: "Redundanz",
    rows: [
      { id: "dup-1", label: "utils-copy.ts ist identisch mit utils.ts", severity: "niedrig", path: "src/lib/utils-copy.ts", loc: 87, minutes: 2, detail: "100% identischer Inhalt. Die Kopie wird nirgends importiert und kann gefahrlos gelöscht werden.", applyable: true },
      { id: "dup-2", label: "config.backup.ts dupliziert config.ts", severity: "niedrig", path: "src/config/config.backup.ts", loc: 124, minutes: 2, detail: "Veraltete Sicherungskopie der Konfiguration. Im Projekt wurden keine Referenzen gefunden.", applyable: true },
      { id: "dup-3", label: "types-v2.d.ts überlappt mit types.d.ts", severity: "mittel", path: "src/types/types-v2.d.ts", loc: 45, minutes: 5, detail: "87% überschneidende Typdefinitionen. Beide Dateien zusammenführen und Importe anpassen.", applyable: true },
    ],
  },
  {
    title: "Doppelter Code",
    category: "Redundanz",
    rows: [
      { id: "code-1", label: "fetchWithRetry() in api/ und services/ kopiert", severity: "hoch", path: "src/services/http.ts", loc: 58, minutes: 8, detail: "Nahezu identische Retry-Logik an zwei Stellen. In einen gemeinsamen HTTP-Client auslagern.", applyable: true },
      { id: "code-2", label: "formatDate() dreifach dupliziert", severity: "mittel", path: "src/utils/date.ts", loc: 36, minutes: 4, detail: "Gleiche Datumsformatierung in date.ts, table.tsx und export.ts. In eine Hilfsfunktion zentralisieren.", applyable: true },
      { id: "code-3", label: "E-Mail-Validierung mehrfach implementiert", severity: "niedrig", path: "src/forms/validate.ts", loc: 22, minutes: 3, detail: "Identische Regex in vier Formularen. In eine wiederverwendbare Validierung überführen.", applyable: true },
    ],
  },
  {
    title: "Toter Code",
    category: "Ballast",
    rows: [
      { id: "dead-1", label: "parseLegacyFormat() wird nie aufgerufen", severity: "mittel", path: "src/import/legacy.ts", loc: 41, minutes: 4, detail: "Funktion ohne Aufrufer seit der API-Umstellung. Kann ersatzlos entfernt werden.", applyable: true },
      { id: "dead-2", label: "Auskommentierter Login-Flow in auth.service.ts", severity: "niedrig", path: "src/auth/auth.service.ts", loc: 18, minutes: 1, detail: "Veralteter, auskommentierter Codeblock. Der Versionsverlauf macht ihn überflüssig.", applyable: true },
    ],
  },
  {
    title: "Ungenutzte Exports",
    category: "Ballast",
    rows: [
      { id: "exp-1", label: "5 ungenutzte Abhängigkeiten in package.json", severity: "hoch", path: "package.json", loc: 12, minutes: 6, detail: "moment, left-pad u. a. werden nicht mehr verwendet. Deinstallieren reduziert die Bundle-Größe.", applyable: true },
      { id: "exp-2", label: "<LegacyButton/> wird nicht referenziert", severity: "mittel", path: "src/components/LegacyButton.tsx", loc: 64, minutes: 3, detail: "Komponente ohne Import. Wurde durch <Button/> ersetzt und kann gelöscht werden.", applyable: true },
      { id: "exp-3", label: "export OLD_API_URL nirgends importiert", severity: "niedrig", path: "src/config/endpoints.ts", loc: 1, minutes: 1, detail: "Konstante ohne Verwendung. Kann sicher entfernt werden.", applyable: true },
    ],
  },
  {
    title: "Namen-Inkonsistenzen",
    category: "Struktur",
    rows: [
      { id: "name-1", label: "Gemischte Schreibweise: userId vs. user_id", severity: "mittel", path: "src/models/", loc: 14, minutes: 4, detail: "camelCase und snake_case in sechs Modulen vermischt. Auf eine einheitliche Konvention bringen.", applyable: true },
      { id: "name-2", label: "Dateinamen teils PascalCase, teils kebab-case", severity: "niedrig", path: "src/components/", loc: 8, minutes: 2, detail: "Uneinheitliche Benennung erschwert die Navigation. Auf PascalCase vereinheitlichen.", applyable: true },
    ],
  },
  {
    title: "Ordnerstruktur",
    category: "Struktur",
    rows: [
      { id: "folder-1", label: "Komponenten über 3 Ordner verstreut", severity: "mittel", path: "src/", loc: 6, minutes: 5, detail: "Gleichartige Komponenten liegen in components/, ui/ und shared/. In einen Ordner zusammenführen.", applyable: true },
      { id: "folder-2", label: "Tests neben Quellcode statt in __tests__", severity: "niedrig", path: "src/", loc: 5, minutes: 2, detail: "Testdateien liegen verteilt neben den Modulen. In dedizierte Testordner verschieben.", applyable: true },
    ],
  },
];

/** Stat-Karten je Kategorie (Titel = Tab = Accordion-Kategorie). */
const STAT_META: { icon: IconName; title: Category }[] = [
  { icon: "Copy", title: "Redundanz" },
  { icon: "Trash2", title: "Ballast" },
  { icon: "ListTree", title: "Struktur" },
];

/** Seite "Bereinigen" (/bereinigen) — Tabs + Stat-Karten + Accordions (gemäß Figma). */
const Bereinigen = () => {
  const [active, setActive] = useState("Alle");
  const [applied, setApplied] = useState<Set<string>>(() => new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const markApplied = (id: string) =>
    setApplied((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const unmarkApplied = (id: string) =>
    setApplied((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  /** Offene (noch nicht abgeschlossene) Befunde einer Kategorie auswerten. */
  const statsFor = (category: Category) => {
    const open = ACCORDIONS.filter((a) => a.category === category)
      .flatMap((a) => a.rows)
      .filter((r) => !applied.has(r.id));
    const count = (sev: Severity) => open.filter((r) => r.severity === sev).length;
    return {
      open: open.length,
      high: count("hoch"),
      medium: count("mittel"),
      low: count("niedrig"),
      loc: open.reduce((sum, r) => sum + r.loc, 0),
      minutes: open.reduce((sum, r) => sum + r.minutes, 0),
    };
  };

  const accordionDone = (a: CleanupAccordion) => a.rows.length > 0 && a.rows.every((r) => applied.has(r.id));

  // Aggregierte Topbar-Werte über alle noch offenen Befunde.
  const openRows = ACCORDIONS.flatMap((a) => a.rows).filter((r) => !applied.has(r.id));
  const totalOpen = openRows.length;
  const totalLoc = openRows.reduce((sum, r) => sum + r.loc, 0);
  const totalMin = openRows.reduce((sum, r) => sum + r.minutes, 0);
  const safeCount = openRows.filter((r) => r.severity === "niedrig").length;
  const totalLow = ACCORDIONS.flatMap((a) => a.rows).filter((r) => r.severity === "niedrig").length;

  // "Sicher bereinigen": alle niedrig eingestuften Befunde anwenden.
  const cleanAllSafe = () =>
    setApplied((prev) => {
      const next = new Set(prev);
      ACCORDIONS.flatMap((a) => a.rows)
        .filter((r) => r.severity === "niedrig")
        .forEach((r) => next.add(r.id));
      return next;
    });

  const visibleStats = STAT_META.filter((s) => active === "Alle" || s.title === active);
  const visibleAccordions = ACCORDIONS.filter((a) => active === "Alle" || a.category === active);

  // Fertige Einträge ans Ende sortieren (stabil: gleiche Reihenfolge innerhalb der Gruppen).
  const orderedStats = [...visibleStats].sort(
    (a, b) => Number(statsFor(a.title).open === 0) - Number(statsFor(b.title).open === 0)
  );
  const orderedAccordions = [...visibleAccordions].sort(
    (a, b) => Number(accordionDone(a)) - Number(accordionDone(b))
  );

  // FLIP-Animation: Elemente gleiten an ihre neue Position, wenn sich die Reihenfolge ändert.
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const accordionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevCardTops = useRef<Map<string, number>>(new Map());
  const prevAccordionTops = useRef<Map<string, number>>(new Map());

  const runFlip = (refs: Map<string, HTMLDivElement>, prev: Map<string, number>) => {
    const newTops = new Map<string, number>();
    refs.forEach((el, key) => newTops.set(key, el.getBoundingClientRect().top));

    newTops.forEach((newTop, key) => {
      const oldTop = prev.get(key);
      const el = refs.get(key);
      if (oldTop === undefined || !el || oldTop === newTop) return;
      // Invert: sofort an die alte Stelle versetzen, dann animiert auf 0 fahren.
      el.style.transition = "none";
      el.style.transform = `translateY(${oldTop - newTop}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
      });
    });

    prev.clear();
    newTops.forEach((v, k) => prev.set(k, v));
  };

  useLayoutEffect(() => {
    runFlip(cardRefs.current, prevCardTops.current);
    runFlip(accordionRefs.current, prevAccordionTops.current);
  });

  return (
    <>
    <Layout.Content
      topbar={
        <Layout.Topbar
          variant="bereinigen"
          info={[
            { icon: "AlertTriangle", value: String(totalOpen), label: "Befunde" },
            { icon: "Code", value: String(totalLoc), label: "LOC" },
            { icon: "Clock", value: `~${totalMin}`, label: "Min" },
          ]}
          primaryLabel={safeCount === 0 ? `${totalLow} Sicher bereinigt` : `${safeCount} Sicher bereinigen`}
          primaryDisabled={safeCount === 0}
          primaryDone={safeCount === 0}
          onPrimaryAction={() => setConfirmOpen(true)}
        />
      }
      bottombar={<Layout.Bottombar variant="bereinigen" />}
    >
      <div className="mx-auto max-w-300 px-8  space-y-5  py-6">

        <components.Tabbar active={active} setActive={setActive} tabs={Object.values(data.tabs)[0]} />


        {/* Grid: links Stat-Karten, rechts Accordions */}
        <div className="grid grid-cols-6 gap-5">
          <div className="col-span-2 flex flex-col gap-4">
            {orderedStats.map((s) => {
              const st = statsFor(s.title);
              return (
                <div
                  key={s.title}
                  ref={(el) => {
                    if (el) cardRefs.current.set(s.title, el);
                    else cardRefs.current.delete(s.title);
                  }}
                >
                  <components.StatCard
                    icon={s.icon}
                    color="quality"
                    title={s.title}
                    primaryValue={String(st.open)}
                    metrics={[
                      { icon: "Code", value: String(st.loc), label: "LOC" },
                      { icon: "Clock", value: `~${st.minutes}`, label: "Min" },
                    ]}
                    high={st.high}
                    medium={st.medium}
                    low={st.low}
                    highlighted={active !== "Alle"}
                    onClick={() => setActive(s.title)}
                  />
                </div>
              );
            })}
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            {orderedAccordions.map((a) => (
              <div
                key={a.title}
                ref={(el) => {
                  if (el) accordionRefs.current.set(a.title, el);
                  else accordionRefs.current.delete(a.title);
                }}
              >
                <components.Accordion
                  title={a.title}
                  defaultOpen={false}
                  rows={a.rows}
                  appliedIds={applied}
                  onApply={markApplied}
                  onUnapply={unmarkApplied}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout.Content>

    {/* Bestätigungs-Alert — verdunkelter, leicht verschwommener Overlay-Hintergrund */}
    {confirmOpen && (
      <div
        className="fixed inset-0 z-3000 flex items-center justify-center bg-black/30 backdrop-blur-sm p-8"
        onClick={() => setConfirmOpen(false)}
        role="presentation"
      >
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <components.Alert
            title={`${safeCount} Befunde sicher bereinigen?`}
            description="Alle niedrig eingestuften Befunde werden automatisch angewendet. Einzelne Schritte kannst du danach rückgängig machen."
            confirmColor="quality"
            confirmLabel="Sicher bereinigen"
            cancelLabel="Abbrechen"
            onConfirm={() => {
              cleanAllSafe();
              setConfirmOpen(false);
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        </div>
      </div>
    )}
    </>
  );
};

export default Bereinigen;
