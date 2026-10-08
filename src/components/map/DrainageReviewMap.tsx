"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { DRAINAGE_SOURCE_CRS } from "@/config/drainage-crs";
import type { DrainageGeoJsonCollection, DrainageGeoJsonProperties } from "@/types/drainage";
import type { ValidatedGeometryCollection } from "@/types/official";

const WORKER_URL = "/maplibre-gl-worker.mjs";
const formatMeters = (value: number | null | undefined) => value == null ? "Pendente de conferência" : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;

interface Props { drainage: DrainageGeoJsonCollection; paving: ValidatedGeometryCollection }

export function DrainageReviewMap({ drainage, paving }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [selected, setSelected] = useState<DrainageGeoJsonProperties | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    maplibregl.setWorkerUrl(WORKER_URL);
    const map = new maplibregl.Map({
      container: containerRef.current, center: [-54.658, -20.474], zoom: 14.8, minZoom: 12, maxZoom: 20, attributionControl: false,
      style: { version: 8, sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-opacity": 0.62 } }] },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("load", () => {
      map.addSource("paving", { type: "geojson", data: paving });
      map.addSource("drainage", { type: "geojson", data: drainage });
      map.addLayer({ id: "paving", type: "line", source: "paving", paint: { "line-color": "#64748b", "line-width": 5, "line-opacity": 0.55 } });
      map.addLayer({ id: "drainage-basin-02", type: "line", source: "drainage", filter: ["all", ["==", ["get", "featureType"], "segment"], ["==", ["get", "basin"], "Bacia 02"]], paint: { "line-color": "#0284c7", "line-width": 7, "line-opacity": 0.95 } });
      map.addLayer({ id: "drainage-basin-01", type: "line", source: "drainage", filter: ["all", ["==", ["get", "featureType"], "segment"], ["==", ["get", "basin"], "Bacia 01"]], paint: { "line-color": "#06b6d4", "line-width": 7, "line-opacity": 0.95 } });
      map.addLayer({ id: "drainage-hit", type: "line", source: "drainage", filter: ["==", ["get", "featureType"], "segment"], paint: { "line-color": "#000", "line-width": 24, "line-opacity": 0 } });
      map.addLayer({ id: "drainage-nodes", type: "circle", source: "drainage", filter: ["==", ["get", "featureType"], "node"], paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-color": ["match", ["get", "basin"], "Bacia 01", "#06b6d4", "#0284c7"], "circle-stroke-width": 3 } });
      map.addLayer({ id: "drainage-labels", type: "symbol", source: "drainage", filter: ["==", ["get", "featureType"], "segment"], layout: { "symbol-placement": "line-center", "text-field": ["get", "id"], "text-size": 11, "text-allow-overlap": false }, paint: { "text-color": "#0f172a", "text-halo-color": "#fff", "text-halo-width": 2 } });
      map.on("click", "drainage-hit", (event) => { const feature = event.features?.[0]; if (feature?.properties) setSelected(feature.properties as DrainageGeoJsonProperties); });
      map.on("mouseenter", "drainage-hit", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "drainage-hit", () => { map.getCanvas().style.cursor = ""; });
      const points = drainage.features.filter((feature) => feature.geometry.type === "Point").map((feature) => feature.geometry.coordinates as [number, number]);
      if (points.length) map.fitBounds(points.reduce((bounds, point) => bounds.extend(point), new maplibregl.LngLatBounds(points[0], points[0])), { padding: 80, maxZoom: 16 });
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [drainage, paving]);

  return (
    <main className="relative h-dvh min-h-[600px] overflow-hidden bg-slate-100">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label="Mapa de conferência da drenagem pluvial" />
      <header className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3">
        <div className="max-w-xl rounded-2xl border border-cyan-200 bg-white/95 p-4 shadow-lg backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-700">Ferramenta local de desenvolvimento</p><h1 className="mt-1 text-lg font-extrabold">Conferência da drenagem pluvial</h1><p className="mt-1 text-xs text-slate-600">24 poços de visita · 22 trechos · coordenadas do projeto</p></div>
        <span className="rounded-full bg-green-100 px-3 py-2 text-xs font-bold text-green-950 shadow">Camada validada</span>
      </header>
      <section className="absolute bottom-4 left-4 z-10 max-w-md rounded-2xl border border-green-300 bg-green-50/95 p-4 text-xs leading-relaxed text-green-950 shadow-lg"><strong>Projeto Executivo — Lote 22</strong><br />Pranchas 12 e 13 · Validação visual concluída<br /><span className="text-green-800">{DRAINAGE_SOURCE_CRS.name} ({DRAINAGE_SOURCE_CRS.code})</span></section>
      <div className="absolute bottom-4 right-4 top-28 z-10 flex w-[min(380px,calc(100%-2rem))] items-end md:items-start">
        <aside className="max-h-full w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl backdrop-blur">
          {selected ? <><div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase text-cyan-700">{selected.basin}</p><h2 className="text-2xl font-extrabold">{selected.id}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Fechar detalhes" className="size-11 rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button></div><dl className="mt-4 grid gap-3 text-sm"><div><dt className="font-bold text-slate-500">PV inicial</dt><dd>{selected.startNodeDisplay} <span className="text-xs text-slate-400">({selected.startNode})</span></dd></div><div><dt className="font-bold text-slate-500">PV final</dt><dd>{selected.endNodeDisplay} <span className="text-xs text-slate-400">({selected.endNode})</span></dd></div><div><dt className="font-bold text-slate-500">Comprimento oficial</dt><dd>{formatMeters(selected.officialLengthMeters)}</dd></div><div><dt className="font-bold text-slate-500">Comprimento calculado</dt><dd>{formatMeters(selected.calculatedLengthMeters)}</dd></div><div><dt className="font-bold text-slate-500">Diferença</dt><dd>{formatMeters(selected.lengthDifferenceMeters)}</dd></div><div><dt className="font-bold text-slate-500">Diâmetro</dt><dd>{selected.diameterMeters == null ? "Pendente de conferência" : `Ø ${selected.diameterMeters.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} m`}</dd></div><div><dt className="font-bold text-slate-500">Material</dt><dd>{selected.material ?? "Não informado na fonte disponível"}</dd></div><div><dt className="font-bold text-slate-500">Fonte</dt><dd>{selected.source}</dd></div></dl></> : <><h2 className="font-extrabold">Selecione um trecho</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">Clique em uma linha azul ou ciano para comparar os dados oficiais com a geometria calculada.</p><div className="mt-4 space-y-2 text-xs font-semibold"><p><span className="mr-2 inline-block w-6 border-t-4 border-slate-500" />Pavimentação validada</p><p><span className="mr-2 inline-block w-6 border-t-4 border-sky-600" />Bacia 02</p><p><span className="mr-2 inline-block w-6 border-t-4 border-cyan-500" />Bacia 01</p></div></>}
        </aside>
      </div>
    </main>
  );
}
