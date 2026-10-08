interface MapLayersControlProps {
  open: boolean;
  onToggle: () => void;
  drainageEnabled: boolean;
  onDrainageChange: (enabled: boolean) => void;
  sanitationEnabled: boolean;
  waterEnabled: boolean;
  sewerEnabled: boolean;
  onSanitationChange: (enabled: boolean) => void;
  onWaterChange: (enabled: boolean) => void;
  onSewerChange: (enabled: boolean) => void;
}

export function MapLayersControl({ open, onToggle, drainageEnabled, onDrainageChange, sanitationEnabled, waterEnabled, sewerEnabled, onSanitationChange, onWaterChange, onSewerChange }: MapLayersControlProps) {
  return (
    <div className="pointer-events-auto relative">
      {open && (
        <><button type="button" aria-label="Fechar painel de camadas" onClick={onToggle} className="fixed inset-0 z-30 cursor-default bg-slate-950/20 md:hidden" />
        <section id="layers-panel" aria-label="Camadas do mapa" className="map-sheet fixed inset-x-0 bottom-0 z-40 max-h-[82dvh] overflow-y-auto rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:absolute md:inset-x-auto md:bottom-[4.25rem] md:right-0 md:w-80 md:rounded-2xl md:p-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3"><h2 className="text-lg font-extrabold text-slate-950">O que aparece no mapa</h2><button type="button" onClick={onToggle} aria-label="Fechar camadas" className="map-icon-button">×</button></div>
          <div className="mt-3 flex min-h-14 items-center gap-3 rounded-xl bg-blue-50 px-4 text-base font-bold text-blue-950">
            <span className="grid size-6 place-items-center rounded-md bg-blue-700 text-sm text-white" aria-hidden="true">✓</span>
            Obra do asfalto
          </div>
          <label className="mt-1 flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-4 text-base font-semibold text-slate-800 hover:bg-cyan-50 focus-within:outline-2 focus-within:outline-cyan-700">
            <input type="checkbox" checked={drainageEnabled} onChange={(event) => onDrainageChange(event.target.checked)} className="size-6 accent-cyan-700" />
            Drenagem da chuva
          </label>
          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl px-4 text-base font-semibold text-slate-800 hover:bg-blue-50 focus-within:outline-2 focus-within:outline-blue-700"><input type="checkbox" checked={sanitationEnabled} onChange={(event) => onSanitationChange(event.target.checked)} className="size-6 accent-blue-700" />Água e esgoto</label>
          {sanitationEnabled && <div className="ml-5 border-l-2 border-slate-200 pl-3"><label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg px-2 text-base font-semibold text-slate-700 focus-within:outline-2 focus-within:outline-blue-700"><input type="checkbox" checked={waterEnabled} onChange={(event) => onWaterChange(event.target.checked)} className="size-6 accent-blue-700" />Rede de água</label><label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-lg px-2 text-base font-semibold text-slate-700 focus-within:outline-2 focus-within:outline-[#6d3f55]"><input type="checkbox" checked={sewerEnabled} onChange={(event) => onSewerChange(event.target.checked)} className="size-6 accent-[#6d3f55]" />Rede de esgoto</label></div>}
        </section></>
      )}
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls="layers-panel" className={`map-control-button min-h-[52px] gap-2 px-4 ${open ? "border-blue-600 bg-blue-50 text-blue-950" : ""}`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2"><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 12 8 4 8-4M4 17l8 4 8-4" /></svg><span>Camadas</span>
      </button>
    </div>
  );
}
