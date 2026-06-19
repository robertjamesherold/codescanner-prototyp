import { useState, type ReactNode } from "react";
import Icon from "@/assets/icons";
import Button from "@/components/Button";
import Link from "@/components/Link";

type IconName = Parameters<typeof Icon>[0]["name"];
type Tone = "error" | "success" | "info";

type CodeBlock = {
  label: string;
  tone?: Tone;
  code: string;
  startLine?: number;
  copyable?: boolean;
};

type CodeCardProps = {
  /** Akzent-Farbtoken (Fortschrittsbalken + Headline-Icon). */
  accent?: string;
  icon?: IconName;
  fileTitle?: string;
  lineRange?: string;
  description?: string;
  before?: CodeBlock;
  after: CodeBlock;
  fileIndex?: number;
  fileTotal?: number;
  onPrev?: () => void;
  onMarkFixed?: () => void;
  onNext?: () => void;
};

const TONE_VAR: Record<Tone, string> = {
  error: "var(--error)",
  success: "var(--success)",
  info: "var(--info)",
};

/* ---------------------------------------------------------------------------
   Leichtes JS/TS-Syntax-Highlighting (regex-basiert, ohne externe Dependency).
   Farben kommen aus den --code-*-Tokens (passen sich an Light/Dark an).
--------------------------------------------------------------------------- */
const KEYWORDS = new Set([
  "export", "import", "from", "default", "function", "const", "let", "var", "return", "if", "else",
  "for", "while", "do", "switch", "case", "break", "continue", "throw", "new", "type", "interface",
  "enum", "class", "extends", "implements", "await", "async", "typeof", "instanceof", "in", "of",
  "as", "this", "try", "catch", "finally", "yield", "delete", "any", "void", "null", "undefined",
  "true", "false", "public", "private", "protected", "readonly", "static", "get", "set",
]);
const PRIMITIVE_TYPES = new Set(["boolean", "string", "number", "object", "symbol", "bigint", "unknown", "never"]);

const CODE_COLOR = {
  keyword: "var(--code-blue)",
  string: "var(--code-red)",
  number: "var(--code-green)",
  func: "var(--code-yellow)",
  type: "var(--code-turkish)",
  ident: "var(--code-cyan)",
  comment: "var(--text-3)",
};

const TOKENIZER = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)|(\s+)|[^\s]/g;

const highlight = (code: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  let key = 0;
  TOKENIZER.lastIndex = 0;
  while ((m = TOKENIZER.exec(code)) !== null) {
    const [full, comment, str, num, ident, ws] = m;
    if (ws !== undefined) {
      out.push(full);
      continue;
    }
    let color: string | undefined;
    if (comment !== undefined) color = CODE_COLOR.comment;
    else if (str !== undefined) color = CODE_COLOR.string;
    else if (num !== undefined) color = CODE_COLOR.number;
    else if (ident !== undefined) {
      if (KEYWORDS.has(ident)) color = CODE_COLOR.keyword;
      else if (PRIMITIVE_TYPES.has(ident) || /^[A-Z]/.test(ident)) color = CODE_COLOR.type;
      else color = /^\s*\(/.test(code.slice(m.index + ident.length)) ? CODE_COLOR.func : CODE_COLOR.ident;
    }
    if (color) out.push(<span key={key++} style={{ color }}>{full}</span>);
    else out.push(full); // Interpunktion → erbt code-white
  }
  return out;
};

/** Code-Block mit Zeilennummern (Code als Monospace, ohne Token-Highlighting). */
const Block = ({ block }: { block: CodeBlock }) => {
  const lines = block.code.replace(/\n$/, "").split("\n");
  const start = block.startLine ?? 1;
  const copy = () => navigator.clipboard?.writeText(block.code);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-lg" style={{ color: TONE_VAR[block.tone ?? "success"] }}>
          {block.label}
        </span>
        {block.copyable && (
          <button type="button" onClick={copy} className="flex items-center gap-1 text-base text-text-3 cursor-pointer hover:text-text-2">
            <Icon name="Copy" size={16} strokeWidth={2} />
            Kopieren
          </button>
        )}
      </div>
      <div className="flex w-full overflow-hidden rounded-md bg-bg-1">
        <div className="flex shrink-0 flex-col items-end border-r border-border-1 py-5 pl-5 pr-3">
          {lines.map((_, i) => (
            <span key={i} className="mono text-base leading-6 text-text-3">
              {String(start + i).padStart(2, "0")}
            </span>
          ))}
        </div>
        <pre className="mono flex-1 overflow-x-auto py-5 pl-3 text-base leading-6 text-code-white">{highlight(lines.join("\n"))}</pre>
      </div>
    </div>
  );
};

/**
 * Code-Karte: Fortschritt + Datei-Headline + Beschreibung,
 * Vorher-/Nachher-Code-Block(s) und Footer-Navigation.
 */
const CodeCard = ({
  accent = "var(--critical)",
  icon = "ShieldAlert",
  fileTitle = "Datei 1: utils.js",
  lineRange = "Zeile 12-28",
  description = "",
  before,
  after,
  fileIndex = 1,
  fileTotal = 4,
  onPrev,
  onMarkFixed,
  onNext,
}: CodeCardProps) => {
  const [fixed, setFixed] = useState(false);
  const [index, setIndex] = useState(fileIndex);

  const goPrev = () => {
    if (index <= 1) return;
    setIndex((i) => i - 1);
    setFixed(false);
    onPrev?.();
  };

  const goNext = () => {
    if (index >= fileTotal) return;
    setIndex((i) => i + 1);
    setFixed(false);
    onNext?.();
  };

  return (
    <div data-layer="CodeCard" className="flex w-full flex-col gap-6 rounded-md border border-border-2 bg-grouped-1 p-5">
      {/* Fortschritt */}
      <div className="flex items-center gap-2">
        <span className="text-base text-text-disabled whitespace-nowrap">Fortschritt:</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-grouped-2">
          <span className="block h-full rounded-full transition-all duration-300" style={{ width: `${(index / fileTotal) * 100}%`, backgroundColor: accent }} />
        </div>
        <span className="text-base text-text-disabled whitespace-nowrap">
          Datei {index} / {fileTotal}
        </span>
      </div>

      {/* Headline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={24} strokeWidth={2} color={accent} />
          <h3 className="text-xl font-bold leading-6 text-text-1">{fileTitle}</h3>
        </div>
        <span className="text-base text-text-2">{lineRange}</span>
      </div>

      {/* Beschreibung */}
      {description && <p className="text-base leading-6 text-text-1">{description}</p>}

      {/* Code-Blöcke */}
      <div className="flex flex-col gap-4">
        {before && <Block block={before} />}
        <Block block={{ copyable: true, ...after }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Link label="Vorherige Datei" rightIcon={null} onClick={goPrev} disabled={index <= 1} />
        <div className="flex items-center gap-3">
          <Button
            color="success"
            variant="filled"
            leftIcon="Check"
            label={fixed ? "Als gefixt markiert" : "Als gefixt markieren"}
            disabled={fixed}
            onClick={() => {
              setFixed(true);
              onMarkFixed?.();
            }}
          />
          <Button color="primary" variant="filled" label="Nächste Datei" onClick={goNext} disabled={index >= fileTotal} />
        </div>
      </div>
    </div>
  );
};

export default CodeCard;
