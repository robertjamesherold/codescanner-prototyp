import { useEffect, useState, useSyncExternalStore } from "react";
import Layout from "@/layout";
import components from "@/components";
import Icon from "@/assets/icons";
import { loadSettings, saveSettings, type Provider } from "@/api/settings";
import { getToken, setToken } from "@/api/auth";
import { themeStore, type ThemePreference } from "@/theme/theme";

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: "light", label: "Hell" },
  { id: "dark", label: "Dunkel" },
  { id: "system", label: "System" },
];

const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (genau)" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (ausgewogen)" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (schnell)" },
];
const OPENAI_MODELS = [
  { id: "gpt-4o", label: "GPT-4o (genau)" },
  { id: "gpt-4.1", label: "GPT-4.1" },
  { id: "gpt-4o-mini", label: "GPT-4o mini (schnell)" },
];

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI (GPT)" },
];

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <label className="flex flex-col gap-2">
    <span className="text-base text-text-1">{label}</span>
    {children}
    {hint && <span className="text-sm text-text-3">{hint}</span>}
  </label>
);

const inputClass =
  "h-10 w-full rounded-md border border-border-1 bg-bg-1 px-3 text-base text-text-1 outline-none placeholder:text-text-3 focus:border-primary";

/** Passwort-Eingabefeld für einen API-Key mit Status-Icon. */
const KeyField = ({
  label,
  has,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  has: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <Field
    label={label}
    hint={has ? "Ein Key ist gespeichert. Leer lassen, um ihn beizubehalten." : "Noch kein Key gespeichert. Wird sicher nur lokal abgelegt."}
  >
    <div className="flex items-center gap-2">
      <Icon name={has ? "ShieldCheck" : "Lock"} size={18} strokeWidth={2} color={has ? "var(--success)" : "var(--text-3)"} />
      <input
        className={inputClass}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={has ? "•••••••••• (gespeichert)" : placeholder}
        autoComplete="off"
      />
    </div>
  </Field>
);

/** Seite "Einstellungen" (/einstellungen) — Nutzerdaten + Anbieter + API-Keys. */
const Settings = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [anthropicModel, setAnthropicModel] = useState(ANTHROPIC_MODELS[0].id);
  const [openaiModel, setOpenaiModel] = useState(OPENAI_MODELS[0].id);
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const themePref = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getPreference,
    themeStore.getPreference,
  );

  useEffect(() => {
    const token = getToken();
    setHasToken(Boolean(token));
    void loadSettings().then((s) => {
      setName(s.name);
      setEmail(s.email);
      setProvider(s.provider);
      setAnthropicModel(s.anthropicModel || ANTHROPIC_MODELS[0].id);
      setOpenaiModel(s.openaiModel || OPENAI_MODELS[0].id);
      setHasAnthropicKey(s.hasAnthropicKey);
      setHasOpenaiKey(s.hasOpenaiKey);
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    // Zugangscode wird nur lokal gespeichert — nie ans Backend geschickt.
    if (accessToken) {
      setToken(accessToken);
      setHasToken(true);
      setAccessToken("");
    }
    try {
      const res = await saveSettings({
        name,
        email,
        provider,
        anthropicModel,
        openaiModel,
        anthropicApiKey: anthropicApiKey || undefined,
        openaiApiKey: openaiApiKey || undefined,
      });
      setHasAnthropicKey(res.hasAnthropicKey);
      setHasOpenaiKey(res.hasOpenaiKey);
      setAnthropicApiKey("");
      setOpenaiApiKey("");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Layout.Content>
      <div className="mx-auto w-full max-w-3xl px-8 py-12">
        {/* Kopf */}
        <div className="mb-8 flex items-center gap-4">
          <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-sm">
            <span aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundColor: "var(--primary)" }} />
            <Icon name="User" size={26} strokeWidth={2} color="var(--primary)" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold leading-9 font-display text-text-1">Einstellungen</h1>
            <span className="body text-text-3">Deine Daten und der API-Key für die interaktive Analyse.</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          {/* Profil */}
          <section className="flex flex-col gap-5 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md [--surface:var(--grouped-1)]">
            <h2 className="text-xl font-bold leading-6 font-display text-text-1">Profil</h2>
            <Field label="Name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Dein Name" />
            </Field>
            <Field label="E-Mail">
              <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="du@beispiel.de" />
            </Field>
          </section>

          {/* Darstellung */}
          <section className="flex flex-col gap-5 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md [--surface:var(--grouped-1)]">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold leading-6 font-display text-text-1">Darstellung</h2>
              <span className="body text-text-3">Hell, dunkel oder dem System folgen.</span>
            </div>
            <Field label="Modus" hint="„System“ folgt der Einstellung deines Geräts.">
              <div className="flex gap-2">
                {THEME_OPTIONS.map((t) => {
                  const active = themePref === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => themeStore.setPreference(t.id)}
                      className={`flex-1 rounded-md border px-4 py-2 text-base cursor-pointer transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-text-1"
                          : "border-border-1 bg-bg-1 text-text-3 hover:text-text-2"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </section>

          {/* Zugangscode */}
          <section className="flex flex-col gap-5 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md [--surface:var(--grouped-1)]">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold leading-6 font-display text-text-1">Zugangscode</h2>
              <span className="body text-text-3">Schützt das Backend vor fremden Zugriffen. Muss mit dem <code className="rounded bg-bg-2 px-1 py-0.5 text-sm">API_SECRET</code> in den Netlify-Umgebungsvariablen übereinstimmen.</span>
            </div>
            <KeyField
              label="Zugangscode"
              has={hasToken}
              value={accessToken}
              onChange={setAccessToken}
              placeholder="Dein geheimes Passwort"
            />
          </section>

          {/* KI-Zugang */}
          <section className="flex flex-col gap-5 rounded-md border border-border-2 bg-grouped-1 p-6 shadow-md [--surface:var(--grouped-1)]">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold leading-6 font-display text-text-1">KI-Zugang</h2>
              <span className="body text-text-3">Wähle den Anbieter und hinterlege den passenden API-Key.</span>
            </div>

            {/* Anbieter-Auswahl */}
            <Field label="Anbieter">
              <div className="flex gap-2">
                {PROVIDERS.map((p) => {
                  const active = provider === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`flex-1 rounded-md border px-4 py-2 text-base cursor-pointer transition-colors ${
                        active
                          ? "border-primary bg-primary/10 text-text-1"
                          : "border-border-1 bg-bg-1 text-text-3 hover:text-text-2"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Modell (je Anbieter) */}
            <Field label="Modell">
              {provider === "anthropic" ? (
                <select className={inputClass} value={anthropicModel} onChange={(e) => setAnthropicModel(e.target.value)}>
                  {ANTHROPIC_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <select className={inputClass} value={openaiModel} onChange={(e) => setOpenaiModel(e.target.value)}>
                  {OPENAI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <KeyField
              label="Anthropic API-Key"
              has={hasAnthropicKey}
              value={anthropicApiKey}
              onChange={setAnthropicApiKey}
              placeholder="sk-ant-..."
            />
            <KeyField
              label="OpenAI API-Key"
              has={hasOpenaiKey}
              value={openaiApiKey}
              onChange={setOpenaiApiKey}
              placeholder="sk-..."
            />
          </section>

          {/* Aktionen */}
          <div className="flex items-center gap-4">
            <components.Button
              type="submit"
              color="primary"
              variant="filled"
              label={status === "saving" ? "Speichern…" : "Speichern"}
              leftIcon="Check"
              disabled={status === "saving"}
            />
            {status === "saved" && <span className="text-base text-success">Gespeichert.</span>}
            {status === "error" && <span className="text-base text-error">Speichern fehlgeschlagen.</span>}
          </div>
        </form>
      </div>
    </Layout.Content>
  );
};

export default Settings;
