import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import hooks from "@/hooks";

type NavLinkProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  chevron?: boolean;
  chevronDirection?: "down" | "up";
  isDisabled?: boolean;
  isSideBarOpen?: boolean;
  /** Exakte Routenübereinstimmung erzwingen (statt Prefix-Match). */
  exact?: boolean;
};

/**
 * Animiertes Label: bleibt gemountet und blendet über opacity + max-width
 * weich ein/aus. Beim Aufklappen leichtes Delay → gestaffeltes Gefühl.
 */
const Label = ({ label, isSideBarOpen }: { label: string; isSideBarOpen?: boolean }) => (
  <span
    data-layer="Label"
    className={`body whitespace-nowrap transition-all duration-300 ${
      isSideBarOpen
        ? "max-w-40 opacity-100 delay-100"
        : "max-w-0 -translate-x-1 opacity-0 overflow-hidden"
    }`}
  >
    {label}
  </span>
);

const NavLink = ({
  to,
  icon,
  label,
  chevron,
  chevronDirection,
  isDisabled,
  isSideBarOpen,
  exact,
}: NavLinkProps) => {
  const isActive = hooks.useActiveRoute(to, exact);

  const rowBase = `group h-12 w-full select-none rounded-md inline-flex items-center justify-start p-3 transition-all duration-300 ${
    isSideBarOpen ? "gap-4" : "gap-0"
  }`;

  if (isDisabled) {
    return (
      <div className={`${rowBase} text-text-disabled bg-transparent cursor-default`}>
        <span className="flex shrink-0 items-center justify-center">{icon}</span>
        <Label label={label} isSideBarOpen={isSideBarOpen} />
      </div>
    );
  }

  return (
    <Link
      to={to}
      data-layer="Link"
      data-active={isActive}
      className={`${rowBase} ${
        isActive
          ? "text-text-1 bg-secondary-active/20"
          : "text-text-2 bg-transparency hover:bg-secondary-hover/10 hover:text-text-2-hover active:text-text-1 active:bg-secondary-pressed/20"
      }`}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <Label label={label} isSideBarOpen={isSideBarOpen} />
      {chevron &&
        isSideBarOpen &&
        (chevronDirection === "down" ? (
          <ChevronDown size={16} className="ml-auto" />
        ) : chevronDirection === "up" ? (
          <ChevronUp size={16} className="ml-auto" />
        ) : null)}
    </Link>
  );
};

export default NavLink;
