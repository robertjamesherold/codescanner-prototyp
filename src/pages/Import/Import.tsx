import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/layout";
import components from "@/components";
import Icon from "@/assets/icons";
import { analyzeProject } from "@/api/analyze";
import { peekPendingImport, clearPendingImport } from "@/store/pendingImport";
import { useProjects, createProjectFromAnalysis, addAnalysisToProject } from "@/store/appState";

type Mode = "new" | "existing";

const inputClass =
  "h-10 w-full rounded-md border border-border-1 bg-bg-1 px-3 text-base text-text-1 outline-none placeholder:text-text-3 focus:border-primary";

/**
 * Import-Zwischenseite (/import).
 * Nach der Dateiauswahl: neues Projekt anlegen ODER die Dateien einem
 * bestehenden Projekt hinzufügen — danach wird analysiert und in die Übersicht geleitet.
 */
const Import = () => {
  const navigate = useNavigate();
  const pending = useMemo(() => peekPendingImport(), []);
  const { projects } = useProjects();

  const [mode, setMode] = useState<Mode>(projects.length > 0 ? "existing" : "new");
  const [name, setName] = useState(pending?.folderName ?? "Neues Projekt");
  const [targetId, setTargetId] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Ohne ausgewählte Dateien gibt es nichts zu importieren → zurück zur Startseite.
  useEffect(() => {
    if (!pending) navigate("/home", { replace: true });
  }, [pending, navigate]);

  if (!pending) return null;

  const fileCount = pending.files.length;

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const findings = await analyzeProject(pending.files);
      if (mode === "existing" && targetId) {
        addAnalysisToProject(targetId, fileCount, findings);
      } else {
        createProjectFromAnalysis(name.trim() || "Neues Projekt", fileCount, findings);
      }
      clearPendingImport();
      navigate("/übersicht");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen.");
      setBusy(false);
    }
  };

  return (
    <Layout.Content>
      <div className="mx-auto w-full max-w-2xl px-8 py-12">
        {/* Kopf */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm">
            <span aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundColor: "var(--primary)" }} />
            <Icon name="FolderOpen" size={26} strokeWidth={2} color="var(--primary)" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-9 font-display text-text-1">Projekt importieren</h1>
            <span className="body text-text-3">
              {fileCount} {fileCount === 1 ? "Datei" : "Dateien"} ausgewählt
              {pending.folderName ? ` aus „${pending.folderName}"` : ""}.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {/* Modus-Auswahl */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`flex-1 rounded-md border px-4 py-3 text-base cursor-pointer transition-colors ${
                mode === "new" ? "border-primary bg-primary/10 text-text-1" : "border-border-1 bg-bg-1 text-text-3 hover:text-text-2"
              }`}
            >
              Neues Projekt
            </button>
            <button
              type="button"
              onClick={() => projects.length > 0 && setMode("existing")}
              disabled={projects.length === 0}
              className={`flex-1 rounded-md border px-4 py-3 text-base transition-colors ${
                mode === "existing"
                  ? "border-primary bg-primary/10 text-text-1 cursor-pointer"
                  : projects.length === 0
                    ? "border-border-1 bg-bg-1 text-text-disabled cursor-default"
                    : "border-border-1 bg-bg-1 text-text-3 hover:text-text-2 cursor-pointer"
              }`}
            >
              Zu Projekt hinzufügen
            </button>
          </div>

          {/* Inhalt je Modus */}
          {mode === "new" ? (
            <div className="flex flex-col gap-5 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md">
              <label className="flex flex-col gap-2">
                <span className="text-base text-text-1">Projektname</span>
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Mein Projekt" />
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md">
              <span className="text-base text-text-1">Zielprojekt wählen</span>
              <div className="flex flex-col gap-2">
                {projects.map((p) => {
                  const active = targetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTargetId(p.id)}
                      className={`flex items-center justify-between rounded-md border px-4 py-3 text-left cursor-pointer transition-colors ${
                        active ? "border-primary bg-primary/10" : "border-border-1 bg-bg-1 hover:bg-bg-2"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon name="Bot" size={20} strokeWidth={2} color="var(--primary)" />
                        <span className="flex flex-col">
                          <span className="text-base text-text-1">{p.name}</span>
                          <span className="text-sm text-text-3">{p.fileCount} Dateien · {p.editedLabel}</span>
                        </span>
                      </span>
                      {active && <Icon name="CheckCircle" size={18} strokeWidth={2} color="var(--primary)" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-error/40 bg-error/5 px-4 py-3">
              <Icon name="AlertTriangle" size={18} strokeWidth={2} color="var(--error)" className="mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-base text-text-1">{error}</span>
                <span className="text-sm text-text-3">
                  Tipp: API-Key unter{" "}
                  <button type="button" onClick={() => navigate("/einstellungen")} className="text-secondary underline cursor-pointer">
                    Einstellungen
                  </button>{" "}
                  hinterlegen.
                </span>
              </div>
            </div>
          )}

          {/* Aktionen */}
          <div className="flex items-center gap-3">
            <components.Button
              color="primary"
              variant="filled"
              leftIcon="Sparkles"
              label={mode === "existing" ? "Analysieren & hinzufügen" : "Analysieren & erstellen"}
              onClick={confirm}
              disabled={busy || (mode === "existing" && !targetId)}
            />
            <components.Button color="secondary" variant="outlined" label="Abbrechen" onClick={() => navigate("/home")} disabled={busy} />
          </div>
        </div>
      </div>

      {/* Lade-Overlay */}
      {busy && (
        <div className="fixed inset-0 z-3000 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-md border border-border-1 bg-bg-1 px-8 py-6 shadow-lg">
            <Icon name="Loader2" size={32} strokeWidth={2} color="var(--primary)" className="animate-spin" />
            <span className="text-base text-text-1">Projekt wird analysiert…</span>
            <span className="text-sm text-text-3">Das kann je nach Größe einen Moment dauern.</span>
          </div>
        </div>
      )}
    </Layout.Content>
  );
};

export default Import;
