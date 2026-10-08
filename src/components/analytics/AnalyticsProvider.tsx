"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  ANALYTICS_CONSENT_CHANGED_EVENT,
  ANALYTICS_IS_CONFIGURED,
  ANALYTICS_IS_PRODUCTION,
  ANALYTICS_PRIVACY_OPEN_EVENT,
  CLARITY_PROJECT_ID,
  GA_MEASUREMENT_ID,
  denyAnalyticsConsent,
  getAnalyticsConsent,
  grantAnalyticsConsent,
  isPublicAnalyticsPath,
  shouldShowInitialAnalyticsConsent,
} from "@/lib/analytics";
import { AnalyticsConsent } from "./AnalyticsConsent";
import { AnalyticsPrivacyPanel } from "./AnalyticsPrivacyPanel";

function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(ANALYTICS_CONSENT_CHANGED_EVENT, callback); window.removeEventListener("storage", callback); };
}

// Evita exibir o aviso no HTML inicial até que a preferência local possa ser lida.
const getServerConsent = () => undefined;

export function AnalyticsProvider() {
  const pathname = usePathname();
  const consent = useSyncExternalStore(subscribeConsent, () => getAnalyticsConsent(), getServerConsent);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [consentDismissed, setConsentDismissed] = useState(false);
  const publicRoute = isPublicAnalyticsPath(pathname);
  const active = ANALYTICS_IS_PRODUCTION && ANALYTICS_IS_CONFIGURED && publicRoute && consent === "granted";

  useEffect(() => {
    const openPrivacy = () => setPrivacyOpen(true);
    window.addEventListener(ANALYTICS_PRIVACY_OPEN_EVENT, openPrivacy);
    return () => window.removeEventListener(ANALYTICS_PRIVACY_OPEN_EVENT, openPrivacy);
  }, []);

  useEffect(() => {
    if (!active || !GA_MEASUREMENT_ID) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag(...args) { window.dataLayer?.push(args); };
    if (!window.__oliveiraGaInitialized) {
      window.gtag("js", new Date());
      window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
      window.gtag("config", GA_MEASUREMENT_ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
      window.__oliveiraGaInitialized = true;
    }
    window.gtag("event", "page_view", { page_path: pathname, page_location: `${window.location.origin}${pathname}` });
  }, [active, pathname]);

  const accept = useCallback(() => { grantAnalyticsConsent(); setPrivacyOpen(false); }, []);
  const deny = useCallback(() => { denyAnalyticsConsent(); setPrivacyOpen(false); }, []);
  const dismissConsent = useCallback(() => setConsentDismissed(true), []);
  const showPrivacyFromConsent = useCallback(() => { setConsentDismissed(true); setPrivacyOpen(true); }, []);

  if (!publicRoute) return null;

  return (
    <>
      {active && GA_MEASUREMENT_ID && <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`} strategy="afterInteractive" />}
      {active && CLARITY_PROJECT_ID && <Script id="microsoft-clarity" strategy="afterInteractive">{`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script",${JSON.stringify(CLARITY_PROJECT_ID)});window.clarity("consentv2",{ad_Storage:"denied",analytics_Storage:"granted"});`}</Script>}
      {ANALYTICS_IS_PRODUCTION && ANALYTICS_IS_CONFIGURED && shouldShowInitialAnalyticsConsent(consent, consentDismissed) && <AnalyticsConsent consent={consent} onAccept={accept} onDeny={deny} onDismiss={dismissConsent} onLearnMore={showPrivacyFromConsent} />}
      <AnalyticsPrivacyPanel open={privacyOpen} consent={consent} onClose={() => setPrivacyOpen(false)} onGrant={accept} onDeny={deny} />
    </>
  );
}
