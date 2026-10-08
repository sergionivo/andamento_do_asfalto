"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsConsent as ConsentValue } from "@/types/analytics";

interface AnalyticsConsentProps {
  consent: ConsentValue | null | undefined;
  onAccept: () => void;
  onDeny: () => void;
  onDismiss: () => void;
  onLearnMore: () => void;
}

export function AnalyticsConsent({ consent, onAccept, onDeny, onDismiss, onLearnMore }: AnalyticsConsentProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (consent !== null) return;
    primaryButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [consent, onDismiss]);

  if (consent !== null) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-[2px]">
      <section role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[620px] overflow-y-auto rounded-3xl border border-white/70 bg-white p-6 shadow-2xl min-[390px]:p-7 md:p-10">
        <button type="button" onClick={onDismiss} aria-label="Fechar sem escolher" className="map-icon-button absolute right-3 top-3 md:right-5 md:top-5">×</button>
        <span aria-hidden="true" className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-800 md:size-14"><svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /><path d="m4 7 5-4 6 6 5-4" /></svg></span>
        <h2 id="analytics-consent-title" className="mt-5 pr-10 text-[1.5rem] font-extrabold leading-tight tracking-[-0.02em] text-slate-950 md:text-[1.625rem]">Ajude a melhorar o mapa</h2>
        <div id="analytics-consent-description" className="mt-4 space-y-3 text-[1.0625rem] leading-relaxed text-slate-700 md:text-lg"><p>Podemos usar informações anônimas sobre como o Oliveira com Asfalto é usado?</p><p>Isso ajuda a entender o que funciona melhor e o que ainda podemos melhorar.</p></div>
        <p className="mt-5 rounded-2xl bg-blue-50 p-4 text-base font-semibold leading-relaxed text-blue-950">Não usamos sua localização, fotos, relatos, telefone ou e-mail para essas métricas.</p>
        <button type="button" onClick={onLearnMore} className="mt-3 min-h-11 text-base font-bold text-blue-800 underline underline-offset-2">Como usamos essas informações?</button>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button ref={primaryButtonRef} type="button" onClick={onAccept} className="min-h-14 rounded-xl bg-blue-700 px-5 text-[1.0625rem] font-extrabold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Permitir métricas</button>
          <button type="button" onClick={onDeny} className="min-h-14 rounded-xl border border-slate-400 bg-white px-5 text-[1.0625rem] font-extrabold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-700">Continuar sem métricas</button>
        </div>
      </section>
    </div>
  );
}
