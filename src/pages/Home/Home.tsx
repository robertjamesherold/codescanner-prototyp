import { useNavigate } from "react-router-dom";
import components from "@/components";
import { LogoIcon } from "@/components/Logo";

/**
 * Home-Seite ("Willkommen zum KI-CodeScanner") — 1:1 nach Figma.
 * Großes Logo, Heading + Untertitel und 4 StartButtons (zwei davon "Pro"/disabled).
 */
const Home = () => {
  const navigate = useNavigate();

  // Ein Import startet die Analyse → direkt in die Projekt-Übersicht.
  const startImport = () => navigate("/übersicht");

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-8">
      <div className="flex w-full max-w-[516px] flex-col items-center gap-8 py-8">
        <LogoIcon size={168} />

        {/* Heading */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="pagetitle text-text-1">
            Willkommen zum KI-CodeScanner
          </h1>
          <p className="body text-text-2">
            Analysieren Sie Ihren Code mithilfe von KI auf
            <br />
            Sicherheitslücken, Fehler und Qualitätsprobleme.
          </p>
        </div>

        {/* StartButtons */}
        <div className="flex w-full flex-col gap-5">
          <components.StartButton
            variant="folder"
            title="Lokalen Ordner öffnen"
            description="Importieren Sie einen Ordner von Ihrem Computer."
            onClick={startImport}
          />
          <components.StartButton
            variant="files"
            title="Dateien hochladen"
            description="Wählen Sie einzelne Dateien zur Analyse aus."
            onClick={startImport}
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
      </div>
    </div>
  );
};

export default Home;
