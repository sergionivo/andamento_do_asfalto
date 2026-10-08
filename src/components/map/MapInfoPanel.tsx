"use client";

import { useEffect, useRef, type RefObject } from "react";

interface MapInfoPanelProps { open: boolean; onClose: () => void; returnFocusRef?: RefObject<HTMLElement | null> }

export function MapInfoPanel({ open, onClose, returnFocusRef }: MapInfoPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open, returnFocusRef]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 md:items-center md:justify-center md:p-5" role="dialog" aria-modal="true" aria-labelledby="map-info-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-h-[82dvh] md:max-w-lg md:rounded-3xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:px-7">
          <div><p className="text-[0.9375rem] font-bold text-blue-700">Transparência pública</p><h2 id="map-info-title" className="mt-1 text-[1.375rem] font-extrabold leading-tight text-slate-950">Sobre o projeto</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Fechar informações do mapa" className="map-icon-button">×</button>
        </header>
        <div className="min-h-0 overflow-y-auto px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5 text-base leading-[1.55] text-slate-700 md:px-7">
          <div className="space-y-4">
            <p>Os trechos exibidos foram identificados a partir do Projeto Executivo do Lote 22 da Concorrência Eletrônica 006/2026.</p>
            <p>A geometria cartográfica utiliza dados do OpenStreetMap, revisados manualmente contra as plantas oficiais.</p>
            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4"><p><strong>Obra do asfalto:</strong> Projeto Executivo — Lote 22. Geometria do OpenStreetMap validada manualmente contra as plantas do projeto.</p><p><strong>Drenagem da chuva:</strong> Projeto Executivo — Lote 22. Geometria gerada a partir das coordenadas técnicas e validada contra as pranchas oficiais.</p><p><strong>Água e esgoto:</strong> cadastro de 2025 — Águas Guariroba S.A., incorporado ao Projeto Executivo — Prancha 02. Água e esgoto são representados por corredores de referência. O deslocamento visual das linhas serve apenas para facilitar a leitura e não indica a posição física exata das tubulações.</p></div>
            <p className="rounded-2xl bg-amber-50 p-4 font-medium text-amber-950">A presença de um trecho no mapa indica que ele está previsto no projeto. Não significa que a pavimentação já foi executada.</p>
          </div>
          <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-5">
            <div><dt className="font-bold text-slate-950">Última atualização dos dados de projeto</dt><dd className="mt-0.5 text-slate-700">06/10/2026</dd></div>
            <div><dt className="font-bold text-slate-950">Situação da execução</dt><dd className="mt-0.5 text-slate-700">Ainda em levantamento</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
