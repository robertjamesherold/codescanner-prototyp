import { useState, useRef, useLayoutEffect } from "react";
import Layout from "@/layout";
import components from "@/components";
import Icon from "@/assets/icons";
import { useSecurity, type Severity } from "@/data/security";

const SEVERITY_COLOR: Record<Severity, "critical" | "high" | "medium" | "low"> = {
  kritisch: "critical",
  hoch: "high",
  mittel: "medium",
  niedrig: "low",
};

const SEVERITY_ICON: Record<Severity, Parameters<typeof components.CodeCard>[0]["icon"]> = {
  kritisch: "ShieldX",
  hoch: "ShieldMinus",
  mittel: "ShieldAlert",
  niedrig: "Shield",
};

/** Seite "Absichern" (/absichern/:severity) — Tabs + CWE-Karten + Code-Karte. */
const Absichern = ({ severity }: { severity: Severity }) => {
  const { security, ready, securityFixed, markFixed } = useSecurity();
  const [active, setActive] = useState("Alle");

  const accent = `var(--${SEVERITY_COLOR[severity]})`;
  const data = security[severity];
  const fixedIds = new Set(securityFixed);

  // Nur Karten mit tatsächlichen Befunden anzeigen.
  const foundCards = data.cards.filter((c) => c.findings.length > 0);
  const tabs = ["Alle", ...foundCards.map((c) => c.id)];
  const effectiveActive = tabs.includes(active) ? active : "Alle";
  const visibleCards = foundCards.filter((c) => effectiveActive === "Alle" || c.id === effectiveActive);

  // Aktive CWE für die CodeCard: bei Tab-Wahl diese, sonst die highlighted/erste.
  const activeCwe =
    effectiveActive !== "Alle"
      ? foundCards.find((c) => c.id === effectiveActive)
      : (foundCards.find((c) => c.highlighted) ?? foundCards[0]);

  // Erledigte Karten ans Ende sortieren.
  const isDone = (c: (typeof foundCards)[0]) => {
    const total = c.findings.length;
    const done = c.findings.filter((f) => fixedIds.has(f.id)).length;
    return total > 0 && done >= total;
  };
  const orderedCards = [...visibleCards].sort((a, b) => Number(isDone(a)) - Number(isDone(b)));

  // FLIP-Animation: Karten gleiten beim Umsortieren an ihre neue Position.
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

  return (
    <Layout.Content
      topbar={<Layout.Topbar variant="absichern" severity={severity} />}
      bottombar={<Layout.Bottombar variant={severity} />}
    >
      {!ready ? (
        <div className="flex items-center justify-center" style={{ height: "60vh" }}>
          <div className="relative flex size-14 items-center justify-center">
            <svg
              className="absolute inset-0 animate-spin"
              style={{ animationDuration: "1.8s", animationTimingFunction: "linear" }}
              viewBox="0 0 56 56"
              fill="none"
            >
              <circle cx="28" cy="28" r="23" stroke="var(--border-2)" strokeWidth="1.5" />
              <circle cx="28" cy="28" r="23" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="36 108" />
            </svg>
            <Icon name="Timer" size={20} strokeWidth={1.5} color={accent} style={{ opacity: 0.7 }} />
          </div>
        </div>
      ) : foundCards.length === 0 ? (
        <div className="mx-auto max-w-300 px-8 py-6">
          <div className="flex flex-col items-center gap-2 rounded-md border border-border-2 bg-grouped-1 px-8 py-16 text-center shadow-md">
            <span className="cardtitle text-text-1">Keine Befunde</span>
            <span className="body text-text-3">In dieser Schwere wurde nichts gefunden.</span>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-300 px-8 space-y-5 py-6">
          {/* Tab-Leiste */}
          <div className="flex gap-3 border-b border-border-1">
            {tabs.map((t) => {
              const isActive = effectiveActive === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActive(t)}
                  className="px-4 py-3 text-xl leading-6 cursor-pointer"
                  style={isActive ? { color: accent, borderBottom: `1px solid ${accent}` } : { color: "var(--text-3)" }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Grid: links CWE-Karten, rechts Code-Karte */}
          <div className="grid grid-cols-6 gap-5">
            <div className="col-span-2 flex flex-col gap-4">
              {orderedCards.map((c) => {
                const total = c.findings.length;
                const done = c.findings.filter((f) => fixedIds.has(f.id)).length;
                const open = total - done;
                return (
                  <div
                    key={c.id}
                    ref={(el) => { if (el) cardRefs.current.set(c.id, el); else cardRefs.current.delete(c.id); }}
                  >
                    <components.CweCard
                      severity={severity}
                      id={c.id}
                      description={c.description}
                      time={c.time}
                      open={open}
                      done={done}
                      total={total}
                      highlighted={effectiveActive !== "Alle" && effectiveActive === c.id}
                      onAction={() => setActive(c.id)}
                    />
                  </div>
                );
              })}
            </div>

            {activeCwe && (
              <div className="col-span-4">
                <components.CodeCard
                  key={activeCwe.id}
                  accent={accent}
                  icon={SEVERITY_ICON[severity]}
                  findings={activeCwe.findings}
                  fixedIds={fixedIds}
                  onMarkFixed={markFixed}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout.Content>
  );
};

export default Absichern;
