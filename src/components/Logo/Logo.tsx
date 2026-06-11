import logoLight from "@/assets/images/LogoIcon_Light.png";
import logoDark from "@/assets/images/LogoIcon_Dark.png";

type LogoProps = {
  /** Wortmarke "CodeScanner" einblenden (animiert mit dem Sidebar-Zustand). */
  showWordmark?: boolean;
  /** Kantenlänge des Icons in px. */
  size?: number;
  className?: string;
};

/**
 * CodeScanner-Logo-Icon — echtes Asset, unterschiedliches Bild je Theme.
 * Beide Bilder werden gerendert; .logo-light/.logo-dark blenden per CSS
 * (siehe components.css) das passende für Light/Dark Mode ein.
 */
export const LogoIcon = ({ size = 48 }: { size?: number }) => (
  <span
    className="relative inline-block shrink-0"
    style={{ width: size, height: size }}
    role="img"
    aria-label="CodeScanner"
  >
    <img src={logoLight} alt="" className="logo-light absolute inset-0 size-full object-contain" />
    <img src={logoDark} alt="" className="logo-dark absolute inset-0 size-full object-contain" />
  </span>
);

const Logo = ({ showWordmark = true, size = 48, className }: LogoProps) => {
  return (
    <div
      className={`flex items-center transition-all duration-300 ${showWordmark ? "gap-2" : "gap-0"} ${className ?? ""}`}
      data-layer="Logo"
    >
      <LogoIcon size={size} />
      <span
        className={`font-display text-2xl font-bold leading-8 text-text-1 whitespace-nowrap transition-all duration-300 ${
          showWordmark
            ? "max-w-48 opacity-100 delay-100"
            : "max-w-0 -translate-x-2 opacity-0 overflow-hidden"
        }`}
      >
        CodeScanner
      </span>
    </div>
  );
};

export default Logo;
