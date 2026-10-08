import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYTICS_CONSENT_STORAGE_KEY,
  canSendAnalytics,
  getAnalyticsConsent,
  grantAnalyticsConsent,
  denyAnalyticsConsent,
  isPublicAnalyticsPath,
  trackEvent,
  shouldShowInitialAnalyticsConsent,
} from "../src/lib/analytics";

test("consentimento aceita somente valores conhecidos e usa a chave canônica", () => {
  assert.equal(ANALYTICS_CONSENT_STORAGE_KEY, "oliveira_analytics_consent");
  assert.equal(getAnalyticsConsent({ getItem: () => "granted" }), "granted");
  assert.equal(getAnalyticsConsent({ getItem: () => "denied" }), "denied");
  assert.equal(getAnalyticsConsent({ getItem: () => "outro" }), null);
});

test("grant e deny persistem apenas a preferência", () => {
  const values: string[] = [];
  const storage = { setItem: (key: string, value: string) => values.push(`${key}:${value}`) };
  grantAnalyticsConsent(storage);
  denyAnalyticsConsent(storage);
  assert.deepEqual(values, [
    "oliveira_analytics_consent:granted",
    "oliveira_analytics_consent:denied",
  ]);
});

test("rotas internas nunca são consideradas experiência pública", () => {
  assert.equal(isPublicAnalyticsPath("/"), true);
  assert.equal(isPublicAnalyticsPath("/dev/geometria"), false);
  assert.equal(isPublicAnalyticsPath("/dev/drenagem"), false);
  assert.equal(isPublicAnalyticsPath("/api/contribuicoes"), false);
});

test("envio exige simultaneamente produção, configuração e consentimento", () => {
  assert.equal(canSendAnalytics({ production: true, configured: true, consent: "granted" }), true);
  assert.equal(canSendAnalytics({ production: true, configured: true, consent: null }), false);
  assert.equal(canSendAnalytics({ production: true, configured: true, consent: "denied" }), false);
  assert.equal(canSendAnalytics({ production: false, configured: true, consent: "granted" }), false);
  assert.equal(canSendAnalytics({ production: true, configured: false, consent: "granted" }), false);
});

test("trackEvent é seguro quando executado fora do navegador", () => {
  assert.doesNotThrow(() => trackEvent("map_loaded"));
});

test("primeira visita mostra consentimento uma vez por sessão enquanto a decisão estiver indefinida", () => {
  assert.equal(shouldShowInitialAnalyticsConsent(null, false), true);
  assert.equal(shouldShowInitialAnalyticsConsent("granted", false), false);
  assert.equal(shouldShowInitialAnalyticsConsent("denied", false), false);
  assert.equal(shouldShowInitialAnalyticsConsent(null, true), false);
  assert.equal(canSendAnalytics({ production: true, configured: true, consent: null }), false);
});

test("consentimento inicial e configurações usam contextos e copies distintos", () => {
  const initial = readFileSync("src/components/analytics/AnalyticsConsent.tsx", "utf8");
  const settings = readFileSync("src/components/analytics/AnalyticsPrivacyPanel.tsx", "utf8");
  assert.match(initial, /Ajude a melhorar o mapa/);
  assert.match(initial, /Continuar sem métricas/);
  assert.match(initial, /Como usamos essas informações\?/);
  assert.match(initial, /aria-label="Fechar sem escolher"/);
  assert.doesNotMatch(initial, /Google Analytics|Microsoft Clarity|Desativar métricas/);
  assert.match(settings, /Métricas permitidas/);
  assert.match(settings, /Métricas desativadas/);
  assert.match(settings, /consent === "granted"[\s\S]*Desativar métricas/);
  assert.match(settings, /consent === "denied"[\s\S]*Permitir métricas/);
});

test("provider carrega tags somente sob consentimento e produção", () => {
  const provider = readFileSync("src/components/analytics/AnalyticsProvider.tsx", "utf8");
  const analytics = readFileSync("src/lib/analytics.ts", "utf8");
  assert.match(provider, /consent === "granted"/);
  assert.match(provider, /ANALYTICS_IS_PRODUCTION/);
  assert.match(provider, /strategy="afterInteractive"/);
  assert.match(analytics, /process\.env\.NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(analytics, /process\.env\.NEXT_PUBLIC_CLARITY_PROJECT_ID/);
  assert.match(analytics, /pathname\.startsWith\("\/dev"\)/);
  assert.match(analytics, /pathname\.startsWith\("\/api"\)/);
});

test("formulário sensível recebe máscara explícita do Clarity", () => {
  const form = readFileSync("src/components/map/CommunityContributionForm.tsx", "utf8");
  assert.match(form, /data-clarity-mask="true"[\s\S]*name="photos"/);
  assert.match(form, /data-clarity-mask="true"[\s\S]*name="details"/);
  assert.match(form, /data-clarity-mask="true"[\s\S]*name="contact"/);
});

test("eventos de geolocalização e contribuição usam somente parâmetros mínimos", () => {
  const map = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  const form = readFileSync("src/components/map/CommunityContributionForm.tsx", "utf8");
  assert.match(map, /trackEvent\("geolocation_success"\)/);
  assert.doesNotMatch(map, /trackEvent\("geolocation_(?:requested|success|error)"[^\n]*(?:latitude|longitude|accuracy|coordinate)/);
  assert.match(form, /trackEvent\("community_update_submitted", \{ segment_id: segmentId \}\)/);
  assert.doesNotMatch(form, /trackEvent\("community_update_(?:submitted|error)"[^\n]*(?:contact|details|files|payload)/);
});
