"use client";

import { useEffect } from "react";

interface MainMenuProps {
  open: boolean;
  onClose: () => void;
  onAbout: () => void;
}

const comingSoonItems = ["História da pavimentação", "Como usamos os dados", "Sugestões e correções", "Novidades"];

export function MainMenu({ open, onClose, onAbout }: MainMenuProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 md:bg-transparent" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <nav aria-label="Menu principal" className="map-sheet absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:inset-auto md:bottom-20 md:right-6 md:w-80 md:rounded-2xl md:p-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <h2 className="text-lg font-extrabold text-slate-950">Mais</h2>
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="map-icon-button">×</button>
        </div>
        <div className="mt-2 grid">
          <button type="button" onClick={onAbout} className="menu-row text-left font-bold text-slate-900"><span>Sobre o projeto</span><span aria-hidden="true" className="text-xl text-slate-500">›</span></button>
          {comingSoonItems.slice(0, 3).map((item) => <div key={item} className="menu-row"><span>{item}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Em breve</span></div>)}
          <a href="https://www.instagram.com/oliveiracomasfalto/" target="_blank" rel="noreferrer" className="menu-row font-bold text-pink-800"><span>Acompanhe no Instagram</span><span aria-hidden="true" className="text-xl text-pink-700">›</span></a>
          <div className="menu-row"><span>Novidades</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">Em breve</span></div>
        </div>
      </nav>
    </div>
  );
}
