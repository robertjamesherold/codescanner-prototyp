import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import components from "@/components";
import { LogoIcon } from "@/components/Logo";
import Icon from "@/assets/icons";
import { type AnalyzeFile } from "@/api/analyze";
import { setPendingImport } from "@/store/pendingImport";
import { setActiveProject } from "@/store/appState";

/** Lesbare Code-/Text-Dateien. */
const TEXT_RE = /\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss|html|md|txt|py|go|rs|java|rb|php|vue|svelte|ya?ml|toml)$/i;
const SKIP_RE = /(^|\/)(node_modules|dist|build|\.git)(\/|$)|\.min\./;

/** Ordnernamen aus der ersten Datei ableiten (webkitRelativePath). */
const deriveFolderName = (list: FileList): string => {
  const first = list[0];
  const rel = first?.webkitRelativePath ?? "";
  return rel.includes("/") ? rel.split("/")[0] : "Neues Projekt";
};

/** Dateiauswahl clientseitig einlesen (gefiltert + begrenzt). */
const readFiles = async (list: FileList): Promise<AnalyzeFile[]> => {
  const picked = Array.from(list)
    .filter((f) => TEXT_RE.test(f.name) && !SKIP_RE.test(f.webkitRelativePath || f.name))
    .slice(0, 40);

  const out: AnalyzeFile[] = [];
  for (const f of picked) {
    if (f.size > 200_000) continue;
    out.push({ path: f.webkitRelativePath || f.name, content: await f.text() });
  }
  return out;
};

/**
 * Home-Seite ("Willkommen zum KI-CodeScanner").
 * Ordner/Dateien werden eingelesen und an die Import-Zwischenseite übergeben,
 * wo Projektname / Zielprojekt gewählt werden, bevor analysiert wird.
 */
const Home = () => {
  const navigate = useNavigate();
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handlePick = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const files = await readFiles(list);
      if (files.length === 0) throw new Error("Keine lesbaren Code-Dateien gefunden.");
      setPendingImport({ files, folderName: deriveFolderName(list) });
      navigate("/import");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dateien konnten nicht gelesen werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-8">
      {/* Versteckte Datei-Inputs */}
      <input
        ref={folderRef}
        type="file"
        multiple
        hidden
        onChange={(e) => handlePick(e.target.files)}
        {...({ webkitdirectory: "" } as Record<string, string>)}
      />
      <input ref={filesRef} type="file" multiple hidden onChange={(e) => handlePick(e.target.files)} />

      <div className="flex w-full max-w-[516px] flex-col items-center gap-8 py-8">
        <LogoIcon size={168} />

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="pagetitle text-text-1">Willkommen zum KI-CodeScanner</h1>
          <p className="body text-text-2">
            Analysieren Sie Ihren Code mithilfe von KI auf
            <br />
            Sicherheitslücken, Fehler und Qualitätsprobleme.
          </p>
        </div>

        {/* StartButtons */}
        <div className="flex w-full flex-col gap-5">
          <components.StartButton
            variant="demo"
            title="Demoprojekt starten"
            description="Beispieldaten ohne API-Key ausprobieren."
            disabled={busy}
            onClick={() => {
              setActiveProject(null);
              navigate("/übersicht");
            }}
          />
          <components.StartButton
            variant="folder"
            title="Lokalen Ordner öffnen"
            description="Importieren Sie einen Ordner von Ihrem Computer."
            disabled={busy}
            onClick={() => folderRef.current?.click()}
          />
          <components.StartButton
            variant="files"
            title="Dateien hochladen"
            description="Wählen Sie einzelne Dateien zur Analyse aus."
            disabled={busy}
            onClick={() => filesRef.current?.click()}
          />
          <components.StartButton
            variant="github"
            title="Aus Github importieren"
            description="Importieren Sie ein Projekt aus Ihrem Repository."
            badge="Pro"
            disabled
          />
          <components.StartButton
            variant="cloud"
            title="Cloud-Speicher"
            description="Importieren aus Dropbox, Google Drive oder OneDrive"
            badge="Pro"
            disabled
          />
        </div>

        {/* Fehlerhinweis */}
        {error && (
          <div className="flex w-full items-start gap-2 rounded-md border border-error/40 bg-error/5 px-4 py-3">
            <Icon name="AlertTriangle" size={18} strokeWidth={2} color="var(--error)" className="mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-base text-text-1">{error}</span>
              <span className="text-sm text-text-3">
                Tipp: Hinterlege deinen API-Key unter{" "}
                <button type="button" onClick={() => navigate("/einstellungen")} className="text-secondary underline cursor-pointer">
                  Einstellungen
                </button>
                .
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lade-Overlay während der Analyse */}
      {busy && (
        <div className="fixed inset-0 z-3000 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-md border border-border-1 bg-bg-1 px-8 py-6 shadow-lg">
            <Icon name="Loader2" size={32} strokeWidth={2} color="var(--primary)" className="animate-spin" />
            <span className="text-base text-text-1">Dateien werden gelesen…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
