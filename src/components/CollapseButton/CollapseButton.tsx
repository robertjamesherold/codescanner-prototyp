import Icon from "@/assets/icons";

type CollapseButtonProps = {
  isSideBarOpen: boolean;
  onToggle: () => void;
};

/**
 * Runder Button am rechten Sidebar-Rand zum Ein-/Ausklappen.
 * Farben gemäß Figma: bg-grouped/tertiary (→ grouped-3) mit hover/pressed States.
 * Chevron zeigt nach links (offen → einklappen) bzw. rechts (zu → aufklappen).
 */
const CollapseButton = ({ isSideBarOpen, onToggle }: CollapseButtonProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isSideBarOpen ? "Sidebar einklappen" : "Sidebar aufklappen"}
      aria-expanded={isSideBarOpen}
      data-layer="Collapse-Button"
      className="absolute -right-3.5 top-16 z-20 flex size-7 items-center justify-center rounded-full border border-border-1 bg-grouped-3 text-icon-1 cursor-pointer transition-colors hover:border-grouped-3-hover hover:bg-grouped-3-hover active:border-grouped-3-pressed active:bg-grouped-3-pressed shadow-md"
    >
      <Icon
        name={isSideBarOpen ? "ChevronLeft" : "ChevronRight"}
        size={16}
        strokeWidth={2}
      />
    </button>
  );
};

export default CollapseButton;
