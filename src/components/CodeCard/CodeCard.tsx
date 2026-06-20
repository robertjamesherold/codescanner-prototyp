import { useState, type ReactNode } from "react";
import Icon from "@/assets/icons";
import Button from "@/components/Button";
import Link from "@/components/Link";
import type { SecurityFinding } from "@/api/security";

type IconName = Parameters<typeof Icon>[0]["name"];

type CodeCardProps = {
  accent?: string;
  icon?: IconName;
  findings: SecurityFinding[];
  fixedIds?: Set<string>;
  onMarkFixed?: (id: string) => void;
  afterLabel?: string;
  actionLabel?: string;
  actionDoneLabel?: string;
};

/* ---------------------------------------------------------------------------
   JS/TS-Syntax-Highlighting (regex-basiert, ohne externe Dependency).
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
    if (ws !== undefined) { out.push(full); continue; }
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
    else out.push(full);
  }
  return out;
};

const CodeBlock = ({ label, tone, code, copyable }: { label: string; tone: "error" | "success"; code: string; copyable?: boolean }) => {
  const lines = code.replace(/\n$/, "").split("\n");
  const toneColor = tone === "error" ? "var(--error)" : "var(--success)";
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-lg" style={{ color: toneColor }}>{label}</span>
        {copyable && (
          <button type="button" onClick={() => navigator.clipboard?.writeText(code)}
            className="flex items-center gap-1 text-base text-text-3 cursor-pointer hover:text-text-2">
            <Icon name="Copy" size={16} strokeWidth={2} />
            Kopieren
          </button>
        )}
      </div>
      <div className="flex w-full overflow-hidden rounded-md bg-bg-1">
        <div className="flex shrink-0 flex-col items-end border-r border-border-1 py-5 pl-5 pr-3">
          {lines.map((_, i) => (
            <span key={i} className="mono text-base leading-6 text-text-3">{String(i + 1).padStart(2, "0")}</span>
          ))}
        </div>
        <pre className="mono flex-1 overflow-x-auto py-5 pl-3 text-base leading-6 text-code-white">{highlight(lines.join("\n"))}</pre>
      </div>
    </div>
  );
};

/**
 * Code-Karte: navigiert durch alle Findings eines CWE, zeigt Vorher/Nachher-Code
 * und ermöglicht das Markieren einzelner Dateien als gefixt.
 */
const CodeCard = ({
  accent = "var(--critical)",
  icon = "ShieldAlert",
  findings,
  fixedIds,
  onMarkFixed,
  afterLabel = "Nachher:",
  actionLabel = "Als gefixt markieren",
  actionDoneLabel = "Gefixt",
}: CodeCardProps) => {
  const [index, setIndex] = useState(0);

  const total = findings.length;
  const current = findings[Math.min(index, total - 1)];
  const fixedCount = findings.filter((f) => fixedIds?.has(f.id)).length;
  const isFixed = current ? (fixedIds?.has(current.id) ?? false) : false;

  if (!current) return null;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(total - 1, i + 1));

  return (
    <div data-layer="CodeCard" className="flex w-full flex-col gap-6 rounded-md border border-border-2 bg-grouped-1 p-5 shadow-md">
      {/* Fortschritt */}
      <div className="flex items-center gap-2">
        <span className="text-base text-text-disabled whitespace-nowrap">Fortschritt:</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-grouped-2">
          <span
            className="block h-full rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (fixedCount / total) * 100 : 0}%`, backgroundColor: accent }}
          />
        </div>
        <span className="text-base text-text-disabled whitespace-nowrap">
          {fixedCount} / {total} gefixt
        </span>
      </div>

      {/* Headline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={24} strokeWidth={2} color={accent} />
          <h3 className="text-xl font-bold leading-6 text-text-1">{current.fileTitle}</h3>
        </div>
        <span className="text-base text-text-2">{current.lineRange}</span>
      </div>

      {/* Beschreibung */}
      {current.description && <p className="text-base leading-6 text-text-1">{current.description}</p>}

      {/* Code-Blöcke */}
      <div className="flex flex-col gap-4">
        {current.before && <CodeBlock label="Vorher:" tone="error" code={current.before} />}
        <CodeBlock label={afterLabel} tone="success" code={current.after} copyable />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Link label="Vorherige Datei" rightIcon={null} onClick={goPrev} disabled={index <= 0} />
        <div className="flex items-center gap-3">
          <Button
            color="success"
            variant="filled"
            leftIcon="Check"
            label={isFixed ? actionDoneLabel : actionLabel}
            disabled={isFixed}
            onClick={() => onMarkFixed?.(current.id)}
          />
          <Button color="primary" variant="filled" label="Nächste Datei" onClick={goNext} disabled={index >= total - 1} />
        </div>
      </div>
    </div>
  );
};

export default CodeCard;
