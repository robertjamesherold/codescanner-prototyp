import { useState } from "react";
import Layout from "@/layout";
import components from "@/components";

type Severity = "kritisch" | "hoch" | "mittel" | "niedrig";

type CweData = { id: string; description: string; time: string; open: number; done: number; total: number; highlighted?: boolean };
type CodeData = {
  fileTitle: string;
  lineRange: string;
  fileIndex: number;
  fileTotal: number;
  description: string;
  before: string;
  after: string;
};
type SeverityData = { tabs: string[]; cards: CweData[]; code: CodeData };

const KRITISCH_AFTER = `type SettingsPayload = {
  language: 'de' | 'en';
  theme: 'light' | 'dark';
  notifications: boolean;
};

export function saveSettings(payload: SettingsPayload) {
  if (!['de', 'en'].includes(payload.language)) {
    throw new Error('Ungültige Sprache');
  }

  if (!['light', 'dark'].includes(payload.theme)) {
    throw new Error('Ungültiges Theme');
  }

  if (typeof payload.notifications !== 'boolean') {
    throw new Error('Ungültiger Wert für Benachrichtigungen');
  }

  return db.settings.update(payload);
}`;

const GENERIC_DESC =
  "Die Anwendung verarbeitet Benutzereingaben ohne eine angemessene Validierung. Dies bedeutet, dass fehlerhafte, unerwartete oder sogar manipulierte Werte in die Anwendung gelangen können, was zu potenziellen Sicherheitsrisiken und unerwartetem Verhalten der Anwendung führen kann. Eine ordnungsgemäße Validierung der Eingaben ist daher unerlässlich, um die Integrität und Sicherheit der Anwendung zu gewährleisten.";

const HOCH_BEFORE = `export async function deleteUser(req, res) {
  const userId = req.params.userId;

  await userService.deleteUser(userId);
  res.status(204).send();
}`;

const HOCH_AFTER = `export async function deleteUser(req, res) {
  const userId = req.params.userId;
  const currentUser = req.user;

  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Zugriff verweigert' });
  }

  await userService.deleteUser(userId);
  res.status(204).send();
}`;

/** Daten je Schweregrad (gemäß Figma). */
const DATA: Partial<Record<Severity, SeverityData>> = {
  kritisch: {
    tabs: ["Alle", "CWE-20", "CWE-532", "CWE-284"],
    cards: [
      { id: "CWE-20", description: "Fehlende Eingabevalid.", time: "~32", open: 4, done: 0, total: 4, highlighted: true },
      { id: "CWE-284", description: "Schwache Zugriffskontrolle", time: "~15", open: 1, done: 0, total: 1 },
      { id: "CWE-532", description: "Sensible Daten in Logs", time: "~32", open: 3, done: 0, total: 3 },
    ],
    code: {
      fileTitle: "Datei 1: utils.js",
      lineRange: "Zeile 12-28",
      fileIndex: 1,
      fileTotal: 4,
      description:
        "Die Anwendung verarbeitet Benutzereingaben ohne eine angemessene Validierung. Dies bedeutet, dass fehlerhafte, unerwartete oder sogar manipulierte Werte in die Anwendung gelangen können, was zu potenziellen Sicherheitsrisiken und unerwartetem Verhalten der Anwendung führen kann. Eine ordnungsgemäße Validierung der Eingaben ist daher unerlässlich, um die Integrität und Sicherheit der Anwendung zu gewährleisten.",
      before: "export function saveSettings(payload: any) {\n  return db.settings.update(payload);\n}",
      after: KRITISCH_AFTER,
    },
  },
  hoch: {
    tabs: ["Alle", "CWE-209"],
    cards: [
      { id: "CWE-209", description: "Unsichere Fehlerbehandlung", time: "~18", open: 2, done: 1, total: 2, highlighted: true },
    ],
    code: {
      fileTitle: "Datei 1: utils.js",
      lineRange: "Zeile 12-28",
      fileIndex: 1,
      fileTotal: 2,
      description: GENERIC_DESC,
      before: HOCH_BEFORE,
      after: HOCH_AFTER,
    },
  },
  mittel: {
    tabs: ["Alle", "CWE-798", "CWE-89", "CWE-78"],
    cards: [
      { id: "CWE-798", description: "Fest codierte Secrets", time: "~21", open: 4, done: 2, total: 6, highlighted: true },
      { id: "CWE-89", description: "SQL-Injektion", time: "~12", open: 3, done: 0, total: 3 },
      { id: "CWE-78", description: "Befehlsinjektion", time: "~8", open: 1, done: 0, total: 1 },
    ],
    code: {
      fileTitle: "Datei 3: user.settings.ts",
      lineRange: "Zeile 12-28",
      fileIndex: 3,
      fileTotal: 6,
      description:
        "Die Anwendung ist anfällig für Cross-Site-Scripting (XSS), da die Benutzereingabe im Feld 'Benutzername' nicht ausreichend bereinigt wird.",
      before: "export function saveSettings(payload: any) {\n  return db.settings.update(payload);\n}",
      after: "export function saveSettings(payload: SettingsPayload) {\n  if (!['de', 'en'].includes(payload.language)) {\n    throw new Error('Ungültige Sprache');\n  }\n}",
    },
  },
  niedrig: {
    tabs: ["Alle", "CWE-311", "CWE-918"],
    cards: [
      { id: "CWE-311", description: "Fehlende Verschlüsselung", time: "~0", open: 0, done: 2, total: 2 },
      { id: "CWE-918", description: "Server Side Request Forgery", time: "~15", open: 1, done: 0, total: 1, highlighted: true },
    ],
    code: {
      fileTitle: "Datei 1: auth.controller.ts",
      lineRange: "Zeile 12-28",
      fileIndex: 1,
      fileTotal: 1,
      description:
        "Die Benutzereingaben werden ohne ausreichende Validierung übernommen. Dadurch können fehlerhafte, unerwartete oder manipulierte Werte in die Anwendung gelangen.",
      before: "export function saveSettings(payload: any) {\n  return db.settings.update(payload);\n}",
      after: KRITISCH_AFTER,
    },
  },
};

/** Seite "Absichern" (/absichern/:severity) — Tabs + CWE-Karten + Code-Karte. */
const Absichern = ({ severity }: { severity: Severity }) => {
  const data = DATA[severity];
  const [active, setActive] = useState("Alle");

  return (
    <Layout.Content
      topbar={<Layout.Topbar variant="absichern" severity={severity} />}
      bottombar={<Layout.Bottombar variant={severity} />}
    >
      {data ? (
        <div className="mx-auto max-w-300 space-y-5 py-6">
          {/* Tab-Leiste (Severity-farbig) */}
          <div className="flex gap-3 border-b border-border-1">
            {data.tabs.map((t) => {
              const isActive = active === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActive(t)}
                  className="px-4 py-3 text-xl leading-6 cursor-pointer"
                  style={isActive ? { color: `var(--${severity === "kritisch" ? "critical" : severity === "hoch" ? "high" : severity === "mittel" ? "medium" : "low"})`, borderBottom: `1px solid var(--${severity === "kritisch" ? "critical" : severity === "hoch" ? "high" : severity === "mittel" ? "medium" : "low"})` } : { color: "var(--text-3)" }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* Grid: links CWE-Karten, rechts Code-Karte */}
          <div className="grid grid-cols-6 gap-5">
            <div className="col-span-2 flex flex-col gap-4">
              {data.cards.map((c) => (
                <components.CweCard key={c.id} severity={severity} {...c} />
              ))}
            </div>
            <div className="col-span-4">
              <components.CodeCard
                accent={`var(--${severity === "kritisch" ? "critical" : severity === "hoch" ? "high" : severity === "mittel" ? "medium" : "low"})`}
                icon="ShieldAlert"
                fileTitle={data.code.fileTitle}
                lineRange={data.code.lineRange}
                fileIndex={data.code.fileIndex}
                fileTotal={data.code.fileTotal}
                description={data.code.description}
                before={{ label: "Vorher:", tone: "error", code: data.code.before }}
                after={{ label: "Nachher:", tone: "success", code: data.code.after }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-text-3">Inhalt für „{severity}" folgt.</div>
      )}
    </Layout.Content>
  );
};

export default Absichern;
