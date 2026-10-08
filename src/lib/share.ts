import { SITE_NAME, SITE_URL } from "@/config/site";

export const SITE_SHARE_TEXT = "Quanto falta para o asfalto chegar na sua rua? Veja o mapa do Residencial Oliveira.";

export type ShareAnalyticsEvent = "share_clicked" | "share_native_opened" | "share_link_copied";
export type ShareOutcome = "shared" | "copied" | "cancelled" | "unavailable";

interface ShareDependencies {
  url?: string;
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
  legacyCopy?: (text: string) => boolean;
  onEvent?: (event: ShareAnalyticsEvent) => void;
}

function browserLegacyCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function") return false;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  Object.assign(field.style, { position: "fixed", opacity: "0", pointerEvents: "none" });
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

export async function shareSite(dependencies: ShareDependencies = {}): Promise<ShareOutcome> {
  const url = dependencies.url ?? SITE_URL;
  const nativeShare = dependencies.share ?? (typeof navigator !== "undefined" ? navigator.share?.bind(navigator) : undefined);
  const writeText = dependencies.writeText ?? (typeof navigator !== "undefined" ? navigator.clipboard?.writeText?.bind(navigator.clipboard) : undefined);
  const legacyCopy = dependencies.legacyCopy ?? browserLegacyCopy;
  dependencies.onEvent?.("share_clicked");

  if (nativeShare) {
    try {
      dependencies.onEvent?.("share_native_opened");
      await nativeShare({ title: SITE_NAME, text: SITE_SHARE_TEXT, url });
      return "shared";
    } catch (error) {
      if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") return "cancelled";
    }
  }

  try {
    if (writeText) await writeText(url);
    else if (!legacyCopy(url)) return "unavailable";
    dependencies.onEvent?.("share_link_copied");
    return "copied";
  } catch {
    return legacyCopy(url) ? "copied" : "unavailable";
  }
}

// O helper recebe uma URL explicitamente, permitindo reutilização futura quando
// existir um deep link confiável por trecho. Hoje a interface usa somente SITE_URL.
