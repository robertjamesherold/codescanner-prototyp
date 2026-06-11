import Icon from "@/assets/icons";

type StartButtonVariant = "folder" | "files" | "github" | "cloud";

type StartButtonProps = {
  variant: StartButtonVariant;
  title: string;
  description: string;
  /** Optionales Badge neben dem Titel, z.B. "Pro". */
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
};

/** Icon + Gradient je Variante (gemäß Figma). */
const VARIANTS: Record<StartButtonVariant, { icon: Parameters<typeof Icon>[0]["name"]; gradient: string }> = {
  folder: { icon: "FolderOpen", gradient: "linear-gradient(135deg, hsl(244,80%,64%), hsl(262,70%,52%))" },
  files: { icon: "Upload", gradient: "linear-gradient(135deg, hsl(142,65%,48%), hsl(160,68%,38%))" },
  github: { icon: "GitFork", gradient: "linear-gradient(135deg, hsl(32,95%,55%), hsl(18,85%,50%))" },
  cloud: { icon: "Cloud", gradient: "linear-gradient(135deg, hsl(198,90%,56%), hsl(220,82%,54%))" },
};

const DISABLED_GRADIENT = "linear-gradient(135deg, hsl(215,20%,82%), hsl(215,18%,70%))";

/**
 * Auswahl-Karte auf der Home-Seite (Ordner öffnen, Dateien hochladen, …).
 * IconBox mit Farbgradient + weißem Icon, Titel (font-display) und Beschreibung.
 */
const StartButton = ({ variant, title, description, badge, disabled, onClick }: StartButtonProps) => {
  const { icon, gradient } = VARIANTS[variant];

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-layer="StartButton"
      className={`group flex h-22 w-full items-center justify-start gap-6 rounded-md p-5 text-left shadow-[0px_1px_2px_rgba(0,0,0,0.3),0px_2px_6px_2px_rgba(0,0,0,0.15)] transition-colors ${
        disabled
          ? "bg-grouped-1-disabled cursor-default"
          : "bg-grouped-1 cursor-pointer hover:bg-grouped-1-hover active:bg-grouped-1-pressed"
      }`}
    >
      {/* IconBox */}
      <div
        className="flex size-13 shrink-0 items-center justify-center rounded-md shadow-[0px_1px_2px_rgba(0,0,0,0.25)]"
        style={{ backgroundImage: disabled ? DISABLED_GRADIENT : gradient }}
      >
        <Icon name={icon} size={32} strokeWidth={2} color="white" />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-y-1 h-12 justify-center">
        <div className="flex items-center gap-2 h-4.5">
          <span
            className={`cardtitle whitespace-nowrap ${
              disabled ? "text-text-disabled" : "text-text-1"
            }`}
          >
            {title}
          </span>
          {badge && (
            <span className="rounded-full bg-bg-3 px-2 py-0.5 chips text-text-3">
              {badge}
            </span>
          )}
        </div>
        <span className={`body h-3 ${disabled ? "text-text-disabled" : "text-text-2"}`}>{description}</span>
      </div>
    </button>
  );
};

export default StartButton;
