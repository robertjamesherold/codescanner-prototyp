import { useLayoutEffect, useRef, useState } from "react";
import Layout from "@/layout";
import components from "@/components";
import data from "@/data";
import { CLEANUP_ACCORDIONS, useCleanup, type CleanupCategory } from "@/data/cleanup";

type IconName = Parameters<typeof components.StatCard>[0]["icon"];

/** Stat-Karten je Kategorie (Titel = Tab = Accordion-Kategorie). */
const STAT_META: { icon: IconName; title: CleanupCategory }[] = [
  { icon: "Copy", title: "Redundanz" },
  { icon: "Trash2", title: "Ballast" },
  { icon: "ListTree", title: "Struktur" },
];

/** Seite "Bereinigen" (/bereinigen) — Tabs + Stat-Karten + Accordions (gemäß Figma). */
const Bereinigen = () => {
  const [active, setActive] = useState("Alle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Persistenter Interaktions-Zustand + abgeleitete Kennzahlen (gemeinsame Quelle).
  const {
    applied,
    add: markApplied,
    remove: unmarkApplied,
    addMany,
    statsFor,
    accordionDone,
    totals,
    safeCount,
    totalLow,
    safeIds,
  } = useCleanup();

  // "Sicher bereinigen": alle niedrig eingestuften Befunde anwenden.
  const cleanAllSafe = () => addMany(safeIds);

  const visibleStats = STAT_META.filter((s) => active === "Alle" || s.title === active);
  const visibleAccordions = CLEANUP_ACCORDIONS.filter((a) => active === "Alle" || a.category === active);

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
            { icon: "AlertTriangle", value: String(totals.open), label: "Befunde" },
            { icon: "Code", value: String(totals.loc), label: "LOC" },
            { icon: "Clock", value: `~${totals.minutes}`, label: "Min" },
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
