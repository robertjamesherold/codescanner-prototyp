import Icon from "@/assets/icons";

type StartButtonVariant = "demo" | "folder" | "files" | "github" | "cloud";

type StartButtonProps = {
  variant: StartButtonVariant;
  title: string;
  description: string;
  /** Optionales Badge neben dem Titel, z.B. "Pro". */
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
};

/** Icon + Farbtoken je Variante. */
const VARIANTS: Record<StartButtonVariant, { icon: Parameters<typeof Icon>[0]["name"]; color: string }> = {
  demo: { icon: "Play", color: "performance" },
  folder: { icon: "FolderOpen", color: "primary" },
  files: { icon: "Upload", color: "success" },
  github: { icon: "GitFork", color: "warning" },
  cloud: { icon: "Cloud", color: "info" },
};


/**
 * Auswahl-Karte auf der Home-Seite (Ordner öffnen, Dateien hochladen, …).
 * IconBox mit Farbgradient + weißem Icon, Titel (font-display) und Beschreibung.
 */
const StartButton = ({ variant, title, description, badge, disabled, onClick }: StartButtonProps) => {
  const { icon, color } = VARIANTS[variant];
  const accent = disabled ? "var(--text-disabled)" : `var(--${color})`;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-layer="StartButton"
      className={`group flex h-22 w-full items-center justify-start gap-6 rounded-md p-5 text-left shadow-md transition-colors ${
        disabled
          ? "bg-grouped-1-disabled cursor-default"
          : "bg-grouped-1 cursor-pointer hover:bg-grouped-1-hover active:bg-grouped-1-pressed"
      }`}
    >
      {/* IconBox */}
      <div
        className="flex size-13 shrink-0 items-center justify-center rounded-md"
        style={{ backgroundColor: `color-mix(in srgb, ${accent} 20%, transparent)` }}
      >
        <Icon name={icon} size={32} strokeWidth={2} color={accent} />
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
