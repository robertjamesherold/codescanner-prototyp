import { useState, useRef, useLayoutEffect } from "react";
import Layout from "@/layout";
import components from "@/components";
import { useOptimize, type OptimizeCategory } from "@/data/optimize";
import type { SecurityFinding } from "@/api/security";

const CATEGORY_ICONS: Record<string, Parameters<typeof components.StatCard>[0]["icon"]> = {
  bundle: "Package",
  performance: "Zap",
  architektur: "Layers",
  api: "Send",
};

/** Seite "Optimieren" (/optimieren) — Tabs + Stat-Karten + Code-Karte. */
const Optimieren = () => {
  const [active, setActive] = useState("Alle");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    categories,
    applied,
    mark,
    markMany,
    totals,
    statsFor,
    categoryDone,
    safeIds,
    safeCount,
    totalLow,
  } = useOptimize();

  // Nur Kategorien mit noch vorhandenen Findings zeigen.
  const foundCategories = categories.filter((c) => c.findings.length > 0);
  const categoriesWithOpen = new Set(
    foundCategories.filter((c) => !categoryDone(c)).map((c) => c.id)
  );

  const tabList = ["Alle", ...foundCategories.map((c) => c.title)];
  const effectiveActive = tabList.includes(active) ? active : "Alle";

  const visibleCategories = foundCategories.filter(
    (c) => effectiveActive === "Alle" || c.title === effectiveActive
  );

  // Aktive Kategorie für die CodeCard.
  const activeCategory =
    effectiveActive !== "Alle"
      ? foundCategories.find((c) => c.title === effectiveActive)
      : (foundCategories.find((c) => categoriesWithOpen.has(c.id)) ?? foundCategories[0]);

  // Erledigte Kategorien ans Ende sortieren.
  const orderedCategories = [...visibleCategories].sort(
    (a, b) => Number(categoryDone(a)) - Number(categoryDone(b))
  );

  // FLIP-Animation
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const newTops = new Map<string, number>();
    cardRefs.current.forEach((el, key) => newTops.set(key, el.getBoundingClientRect().top));
    newTops.forEach((newTop, key) => {
      const oldTop = prevTops.current.get(key);
      const el = cardRefs.current.get(key);
      if (oldTop === undefined || !el || oldTop === newTop) return;
      el.style.transition = "none";
      el.style.transform = `translateY(${oldTop - newTop}px)`;
      requestAnimationFrame(() => {
        el.style.transition = "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
      });
    });
    prevTops.current.clear();
    newTops.forEach((v, k) => prevTops.current.set(k, v));
  });

  // Findings der aktiven Kategorie als SecurityFinding-Shape für CodeCard.
  const codeFindings: SecurityFinding[] = (activeCategory?.findings ?? []).map((f) => ({
    id: f.id,
    fileTitle: f.fileTitle,
    lineRange: f.lineRange,
    description: f.description,
    before: f.before,
    after: f.after,
  }));

  return (
    <>
      <Layout.Content
        topbar={
          <Layout.Topbar
            variant="optimieren"
            info={[
              { icon: "Sparkles", value: String(totals.open), label: "Optimierungen" },
              { icon: "Code", value: String(totals.loc), label: "LOC" },
              { icon: "Clock", value: `~${totals.minutes}`, label: "Min" },
            ]}
            primaryLabel={safeCount === 0 ? `${totalLow} Sicher optimiert` : `${safeCount} Sicher optimieren`}
            primaryDisabled={safeCount === 0}
            primaryDone={safeCount === 0}
            onPrimaryAction={() => setConfirmOpen(true)}
          />
        }
        bottombar={<Layout.Bottombar variant="optimieren" />}
      >
        <div className="mx-auto max-w-300 px-8 space-y-5 py-6">
          <components.Tabbar
            active={effectiveActive}
            setActive={setActive}
            tabs={{ Name: "Optimieren", Tabs: tabList }}
          />

          {foundCategories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-md border border-border-2 bg-grouped-1 px-8 py-16 text-center shadow-md">
              <span className="cardtitle text-text-1">Keine Optimierungen</span>
              <span className="body text-text-3">Für dieses Projekt wurden keine Optimierungen gefunden.</span>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-5">
              {/* Stat-Karten */}
              <div className="col-span-2 flex flex-col gap-4">
                {orderedCategories.map((c) => {
                  const st = statsFor(c.id);
                  return (
                    <div
                      key={c.id}
                      ref={(el) => { if (el) cardRefs.current.set(c.id, el); else cardRefs.current.delete(c.id); }}
                    >
                      <components.StatCard
                        icon={CATEGORY_ICONS[c.id] ?? "Sparkles"}
                        color="performance"
                        title={c.title}
                        primaryValue={String(st.open)}
                        metrics={[
                          { icon: "Code", value: String(st.loc), label: "LOC" },
                          { icon: "Clock", value: `~${st.minutes}`, label: "Min" },
                        ]}
                        high={st.high}
                        medium={st.medium}
                        low={st.low}
                        highlighted={effectiveActive !== "Alle" && effectiveActive === c.title}
                        onClick={() => setActive(c.title)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Code-Karte */}
              {activeCategory && codeFindings.length > 0 && (
                <div className="col-span-4">
                  <components.CodeCard
                    key={activeCategory.id}
                    accent="var(--performance)"
                    icon="TrendingUp"
                    findings={codeFindings}
                    fixedIds={applied}
                    onMarkFixed={mark}
                    afterLabel="Optimiert:"
                    actionLabel="Als optimiert markieren"
                    actionDoneLabel="Optimiert ✓"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Layout.Content>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-3000 flex items-center justify-center bg-black/30 backdrop-blur-sm p-8"
          onClick={() => setConfirmOpen(false)}
          role="presentation"
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <components.Alert
              title={`${safeCount} Optimierungen sicher anwenden?`}
              description="Alle niedrig eingestuften Optimierungen werden automatisch angewendet. Einzelne Schritte kannst du danach rückgängig machen."
              confirmColor="quality"
              confirmLabel="Sicher optimieren"
              cancelLabel="Abbrechen"
              onConfirm={() => { markMany(safeIds); setConfirmOpen(false); }}
              onCancel={() => setConfirmOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Optimieren;
