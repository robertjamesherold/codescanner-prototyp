/* Einstellungen (Nutzerdaten + Anbieter + API-Keys). Keys werden beim Laden nie
   zurückgegeben — nur `hasAnthropicKey`/`hasOpenaiKey` zeigen, ob einer existiert. */
import { authHeaders } from './auth'

export type Provider = "anthropic" | "openai";

export type Settings = {
  name: string;
  email: string;
  provider: Provider;
  anthropicModel: string;
  openaiModel: string;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
};

export type SettingsInput = {
  name: string;
  email: string;
  provider: Provider;
  anthropicModel: string;
  openaiModel: string;
  /** Nur senden, wenn geändert — leer lässt den gespeicherten Key unverändert. */
  anthropicApiKey?: string;
  openaiApiKey?: string;
};

const DEFAULT: Settings = {
  name: "",
  email: "",
  provider: "anthropic",
  anthropicModel: "claude-opus-4-8",
  openaiModel: "gpt-4o",
  hasAnthropicKey: false,
  hasOpenaiKey: false,
};

export const loadSettings = async (): Promise<Settings> => {
  try {
    const res = await fetch("/api/settings", { headers: authHeaders() });
    if (res.ok) return { ...DEFAULT, ...((await res.json()) as Partial<Settings>) };
  } catch {
    /* Backend nicht erreichbar */
  }
  return DEFAULT;
};

export const saveSettings = async (
  input: SettingsInput,
): Promise<{ ok: boolean; hasAnthropicKey: boolean; hasOpenaiKey: boolean }> => {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Speichern fehlgeschlagen.");
  return (await res.json()) as { ok: boolean; hasAnthropicKey: boolean; hasOpenaiKey: boolean };
};
