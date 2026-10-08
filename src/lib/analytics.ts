import type { AnalyticsConsent, AnalyticsEventName, AnalyticsEventParameters } from "@/types/analytics";

export const ANALYTICS_CONSENT_STORAGE_KEY = "oliveira_analytics_consent";
export const ANALYTICS_CONSENT_CHANGED_EVENT = "oliveira:analytics-consent-changed";
export const ANALYTICS_PRIVACY_OPEN_EVENT = "oliveira:analytics-privacy-open";

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
export const ANALYTICS_IS_CONFIGURED = Boolean(GA_MEASUREMENT_ID || CLARITY_PROJECT_ID);
export const ANALYTICS_IS_PRODUCTION = process.env.NODE_ENV === "production";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

export function getAnalyticsConsent(storage: Pick<Storage, "getItem"> | null = browserStorage()): AnalyticsConsent | null {
  const value = storage?.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function isPublicAnalyticsPath(pathname: string): boolean {
  return pathname === "/" || (!pathname.startsWith("/dev") && !pathname.startsWith("/api"));
}

export function isAnalyticsAllowed(
  storage: Pick<Storage, "getItem"> | null = browserStorage(),
  production = ANALYTICS_IS_PRODUCTION,
): boolean {
  return canSendAnalytics({ production, configured: ANALYTICS_IS_CONFIGURED, consent: getAnalyticsConsent(storage) });
}

export function canSendAnalytics(options: { production: boolean; configured: boolean; consent: AnalyticsConsent | null }): boolean {
  return options.production && options.configured && options.consent === "granted";
}

export function shouldShowInitialAnalyticsConsent(consent: AnalyticsConsent | null | undefined, dismissedThisSession: boolean): boolean {
  return consent === null && !dismissedThisSession;
}

function notifyConsentChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ANALYTICS_CONSENT_CHANGED_EVENT));
}

export function grantAnalyticsConsent(storage: Pick<Storage, "setItem"> | null = browserStorage()): void {
  storage?.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "granted");
  if (typeof window === "undefined") return;
  if (GA_MEASUREMENT_ID) (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  window.gtag?.("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
  notifyConsentChanged();
}

export function denyAnalyticsConsent(storage: Pick<Storage, "setItem"> | null = browserStorage()): void {
  storage?.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  if (GA_MEASUREMENT_ID && typeof window !== "undefined") {
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  }
  window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
  window.clarity?.("consent", false);
  notifyConsentChanged();
}

export function openAnalyticsPrivacySettings(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ANALYTICS_PRIVACY_OPEN_EVENT));
}

export function trackEvent(name: AnalyticsEventName, parameters: AnalyticsEventParameters = {}): void {
  if (typeof window === "undefined" || !isAnalyticsAllowed() || !isPublicAnalyticsPath(window.location.pathname)) return;
  window.gtag?.("event", name, parameters);
  window.clarity?.("event", name);
}
