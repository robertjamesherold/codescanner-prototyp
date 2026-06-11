import Logo from "@/components/Logo";

type UpgradeBlockProps = {
  /** Eingeklappte Variante: schmaler Block mit rotiertem "PRO". */
  collapsed?: boolean;
};

/**
 * Upgrade-auf-PRO-Karte für den Sidebar-Footer.
 * Ein einziges Element, das zwischen voller und schmaler Variante morpht:
 * Container animiert Größe/Radius (transition-all), die beiden Inhalte überblenden.
 */
const UpgradeBlock = ({ collapsed = false }: UpgradeBlockProps) => {
  return (
    <button
      type="button"
      data-layer="Upgrade"
      aria-label="Upgrade auf PRO"
      className={`group relative shrink-0 overflow-hidden cursor-pointer transition-all duration-300 ${
        collapsed ? "h-27 w-12 rounded-sm" : "h-[230px] w-full rounded-md"
      }`}
    >
      {/* Hintergrund: Basisfläche + Gradient-Overlay */}
      <span aria-hidden className="absolute inset-0 bg-bg-2" />
      <span
        aria-hidden
        className="absolute inset-0 upgrade-gradient transition-transform duration-300 group-hover:scale-105"
      />

      {/* Volle Variante */}
      <span
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-4 text-center transition-all duration-300 ${
          collapsed ? "pointer-events-none scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <span className="flex flex-col items-center gap-4">
          <Logo showWordmark={false} size={96} />
          <span className="body w-[212px] text-white">
            Upgrade auf <strong className="font-bold">PRO</strong> um alle Funktionen zu nutzen.
          </span>
        </span>
        <span className="font-bold text-base text-white whitespace-nowrap">Jetzt upgraden</span>
      </span>

      {/* Eingeklappte Variante */}
      <span
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 pb-3 transition-all duration-300 ${
          collapsed ? "scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
      >
        <Logo showWordmark={false} size={32} />
        <span className="-rotate-90 font-bold text-white whitespace-nowrap body-bold">PRO</span>
      </span>
    </button>
  );
};

export default UpgradeBlock;
