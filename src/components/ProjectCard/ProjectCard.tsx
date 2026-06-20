import Icon from "@/assets/icons";
import { Link } from "react-router-dom";

type ProjectCardProps = {
  title?: string;
  /** Untertitel, z.B. "Bearbeitet vor 1 Stunde". */
  editedLabel?: string;
  files?: string | number;
  /** Vergangene Arbeitszeit, z.B. "5h". */
  elapsedTime?: string;
  /** Erwartete Arbeitszeit, z.B. "21h". */
  expectedTime?: string;
};

/** Eine Statistik-Zeile im Fortschritt-Bereich. */
const StatRow = ({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  iconColor: string;
  label: string;
  value: string | number;
}) => (
  <div className="flex w-full items-center justify-between pt-3">
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Icon name={icon} size={16} strokeWidth={2} color={iconColor} />
      <span className="chips text-text-1">{label}</span>
    </div>
    <span className="chips whitespace-nowrap text-text-1">{value}</span>
  </div>
);

/**
 * Projektkarte — Fortschritts-Übersicht (Dateien, Arbeitszeiten) + Projekt-Footer
 * mit Bot-Icon, Titel und Bearbeitungsstand. Gemäß Figma (Default/Hover/Pressed).
 */
const ProjectCard = ({
  title = "Webanwendung",
  editedLabel = "Bearbeitet vor 1 Stunde",
  files = "8",
  elapsedTime = "5h",
  expectedTime = "21h",
}: ProjectCardProps) => {
  return (
    <Link
      type="button"
        to="/übersicht" // TODO: Link zum Projekt-Dashboard
      data-layer="ProjectCard"
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-md bg-grouped-1 text-left shadow-md transition-colors hover:bg-grouped-1-hover active:bg-grouped-1-pressed border border-border-2 group-hover:border-border-2-hover group-active:border-border-2-pressed"
    >
      {/* Fortschritt */}
      <div className="flex w-full flex-col p-5 transition-colors  ">
        <div className="flex w-full items-center border-b border-border-2 pb-3 transition-colors">
          <span className="flex-1 text-base font-bold leading-6 text-text-1">Fortschritt</span>
        </div>

        <StatRow icon="File" iconColor="var(--code-blue)" label="Dateien" value={files} />
        <StatRow icon="Clock" iconColor="var(--code-green)" label="Vergangene Arbeitszeit" value={elapsedTime} />
        <StatRow icon="Timer" iconColor="var(--code-red)" label="Erwartete Arbeitszeit" value={expectedTime} />
      </div>

      {/* Projekt-Footer */}
      <div className="flex w-full items-center gap-4  bg-grouped-2 p-5 transition-colors group-hover:bg-grouped-3-hover group-active:bg-grouped-3-pressed shadow-inverted-sm">
        <div
          className="flex shrink-0 items-center rounded-md p-2 transition-colors bg-[color:var(--bg-default)] group-hover:bg-[color:var(--bg-hover)] group-active:bg-[color:var(--bg-pressed)]"
          style={{
            // default, hover and active background mixes using primary variants
            // color-mix produces an actual color; Tailwind picks it up via the CSS vars
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ['--bg-default']: 'color-mix(in srgb, var(--primary) 10%, transparent)',
            ['--bg-hover']: 'color-mix(in srgb, var(--primary-hover) 20%, transparent)',
            ['--bg-pressed']: 'color-mix(in srgb, var(--primary-pressed) 10%, transparent)',
            // icon foreground variants (use stronger mixes)
            ['--fg-default']: 'color-mix(in srgb, var(--primary) 100%, transparent)',
            ['--fg-hover']: 'color-mix(in srgb, var(--primary-hover) 100%, transparent)',
            ['--fg-pressed']: 'color-mix(in srgb, var(--primary-pressed) 100%, transparent)'
          }}
        >
          <Icon name="Bot" size={28} strokeWidth={2} color="var(--fg-default)" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xl font-bold leading-6 font-display text-text-1">{title}</span>
          <span className="chips text-text-1">{editedLabel}</span>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
