import { SANITATION_STYLE } from "@/config/sanitation";
import { PUBLIC_MAP_STYLE } from "@/config/public-map-style";

interface MapLegendProps {
  drainageVisible: boolean;
  waterVisible: boolean;
  sewerVisible: boolean;
}

export function MapLegend({ drainageVisible, waterVisible, sewerVisible }: MapLegendProps) {
  return (
    <aside aria-label="Legenda do mapa" className="map-legend">
      <p className="font-extrabold text-slate-950">Legenda</p>
      <div className="mt-1.5 grid gap-1.5">
        <div className="flex items-center gap-2"><span className="h-1.5 w-7 rounded-full bg-slate-500" aria-hidden="true" /><span>Obra do asfalto</span></div>
        {drainageVisible && <div className="flex items-center gap-2"><span className="relative h-3 w-7" aria-hidden="true"><span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full" style={{ backgroundColor: PUBLIC_MAP_STYLE.drainage.color }} /><span className="absolute left-2 top-1/2 size-2.5 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ backgroundColor: PUBLIC_MAP_STYLE.drainage.color }} /></span><span>Drenagem da chuva</span></div>}
        {waterVisible && <div className="flex items-center gap-2"><span className="h-1 w-7 rounded-full" style={{ backgroundColor: SANITATION_STYLE.publicWater }} aria-hidden="true" /><span>Rede de água</span></div>}
        {sewerVisible && <div className="flex items-center gap-2"><span className="w-7 border-t-[3px] border-dashed" style={{ borderColor: SANITATION_STYLE.publicSewer }} aria-hidden="true" /><span>Rede de esgoto</span></div>}
      </div>
    </aside>
  );
}
