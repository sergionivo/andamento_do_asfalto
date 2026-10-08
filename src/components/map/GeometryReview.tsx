"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { CARTOGRAPHY_SOURCE, OFFICIAL_WORK_SOURCE } from "@/config/provenance";
import { buildAxisReviews, type AxisReview } from "@/lib/cartographic-review";
import {
  buildEditingGeometry,
  editingGeometryIntegrity,
  editingLinesLengthMeters,
  selectedWayLines,
  snapToLines,
  uniqueSelectedWays,
  type Position,
} from "@/lib/geometry-editing";
import type {
  OfficialPavingAxis,
  OsmCandidateCollection,
  ValidatedGeometryCollection,
  ValidatedGeometryFeature,
  ValidationGeometryMode,
} from "@/types/official";

const CENTER: Position = [-54.658, -20.474];
const WORKER_URL = "/maplibre-gl-worker.mjs";
const CANDIDATE_SOURCE = "osm-candidates";
const EDITING_SOURCE = "editing-geometry";
const VALIDATED_SOURCE = "validated-geometries";

interface Draft {
  wayIds: string[];
  start: Position | null;
  end: Position | null;
  startReference: string;
  endReference: string;
  geometryMode: ValidationGeometryMode;
}

type Drafts = Record<string, Draft>;
type CropMode = "start" | "end" | null;

const emptyDraft = (): Draft => ({ wayIds: [], start: null, end: null, startReference: "", endReference: "", geometryMode: "full_ways" });
const formatMeters = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
const signed = (value: number, suffix = "") => `${value > 0 ? "+" : ""}${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;

function editingFeature(lines: Position[][]) {
  if (lines.length === 1) {
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: lines[0] },
    };
  }
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "MultiLineString" as const, coordinates: lines },
  };
}

function markerElement(label: "A" | "B", color: string) {
  const element = document.createElement("div");
  element.textContent = label;
  element.setAttribute("aria-label", label === "A" ? "Início do recorte" : "Fim do recorte");
  Object.assign(element.style, {
    width: "32px",
    height: "32px",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    color: "white",
    background: color,
    border: "3px solid white",
    boxShadow: "0 2px 10px rgba(15,23,42,.35)",
    fontWeight: "800",
    cursor: "grab",
  });
  return element;
}

interface GeometryReviewProps {
  axes: OfficialPavingAxis[];
  candidates: OsmCandidateCollection;
  initialValidated: ValidatedGeometryCollection;
}

export function GeometryReview({ axes, candidates, initialValidated }: GeometryReviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const endMarkerRef = useRef<Marker | null>(null);
  const selectedIdRef = useRef(axes[0]?.id ?? "");
  const cropModeRef = useRef<CropMode>(null);
  const sourceLinesRef = useRef<Position[][]>([]);

  const reviews = useMemo(() => buildAxisReviews(axes, candidates.features), [axes, candidates.features]);
  const [selectedId, setSelectedId] = useState(axes[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Drafts>({});
  const [activeWayId, setActiveWayId] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<CropMode>(null);
  const [validated, setValidated] = useState(initialValidated);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const selectedReview = reviews.find((review) => review.axis.id === selectedId) ?? reviews[0];
  const draft = drafts[selectedId] ?? emptyDraft();
  const selectedFeatures = uniqueSelectedWays(
    selectedReview.candidates.filter((feature) => draft.wayIds.includes(feature.properties.osmId)),
  );
  const sourceLines = useMemo(() => selectedWayLines(selectedFeatures), [selectedFeatures]);
  const editingResult = useMemo(
    () => buildEditingGeometry(selectedFeatures, draft.start, draft.end, draft.geometryMode),
    [selectedFeatures, draft.start, draft.end, draft.geometryMode],
  );
  const editingLines = editingResult.lines;
  const integrity = useMemo(() => editingGeometryIntegrity(editingLines, sourceLines), [editingLines, sourceLines]);
  const geometryError = editingResult.error ?? integrity.error;
  const editingLength = editingLinesLengthMeters(editingLines);
  const differenceMeters = editingLength - selectedReview.axis.officialLengthMeters;
  const differencePercent = selectedReview.axis.officialLengthMeters
    ? (differenceMeters / selectedReview.axis.officialLengthMeters) * 100
    : 0;
  const validatedIds = useMemo(() => new Set(validated.features.map((feature) => feature.properties.axisId)), [validated]);
  const activeWay = selectedReview.candidates.find((feature) => feature.properties.osmId === activeWayId) ?? null;

  const updateDraft = (axisId: string, update: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [axisId]: { ...(current[axisId] ?? emptyDraft()), ...update } }));
  };

  useEffect(() => {
    selectedIdRef.current = selectedId;
    cropModeRef.current = cropMode;
    sourceLinesRef.current = sourceLines;
  }, [cropMode, selectedId, sourceLines]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    maplibregl.setWorkerUrl(WORKER_URL);
    const map = new maplibregl.Map({
      container: containerRef.current,
      center: CENTER,
      zoom: 14.3,
      minZoom: 12,
      maxZoom: 19,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm", paint: { "raster-opacity": 0.78 } }],
      },
    });

    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      map.addSource(CANDIDATE_SOURCE, { type: "geojson", data: candidates });
      map.addSource(EDITING_SOURCE, { type: "geojson", data: editingFeature([]) });
      map.addSource(VALIDATED_SOURCE, { type: "geojson", data: initialValidated });
      const axisFilter: maplibregl.FilterSpecification = ["in", selectedIdRef.current, ["get", "axisIds"]];

      map.addLayer({ id: "validated-lines", type: "line", source: VALIDATED_SOURCE, paint: { "line-color": "#15803d", "line-width": 7, "line-opacity": 0.95 } });
      map.addLayer({ id: "candidate-lines", type: "line", source: CANDIDATE_SOURCE, filter: axisFilter, paint: { "line-color": "#7c3aed", "line-width": 5, "line-opacity": 0.58, "line-dasharray": [2, 1.5] } });
      map.addLayer({ id: "active-way", type: "line", source: CANDIDATE_SOURCE, filter: ["==", ["get", "osmId"], ""], paint: { "line-color": "#f59e0b", "line-width": 9, "line-opacity": 0.95 } });
      map.addLayer({ id: "candidate-hit", type: "line", source: CANDIDATE_SOURCE, filter: axisFilter, paint: { "line-color": "#000", "line-width": 24, "line-opacity": 0 } });
      map.addLayer({ id: "editing-line", type: "line", source: EDITING_SOURCE, paint: { "line-color": "#0b67e3", "line-width": 8, "line-opacity": 1 } });
      map.addLayer({ id: "editing-hit", type: "line", source: EDITING_SOURCE, paint: { "line-color": "#000", "line-width": 26, "line-opacity": 0 } });

      map.on("click", "candidate-hit", (event) => {
        if (cropModeRef.current) return;
        const feature = event.features?.[0];
        const osmId = feature?.properties?.osmId as string | undefined;
        if (osmId) setActiveWayId(osmId);
      });
      map.on("click", "editing-hit", (event) => {
        const mode = cropModeRef.current;
        if (!mode) return;
        const snapped = snapToLines([event.lngLat.lng, event.lngLat.lat], sourceLinesRef.current);
        if (!snapped) return;
        updateDraft(selectedIdRef.current, mode === "start" ? { start: snapped.point } : { end: snapped.point });
        setCropMode(null);
      });
      map.on("mouseenter", "candidate-hit", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "candidate-hit", () => { map.getCanvas().style.cursor = ""; });
      setMapReady(true);
    });

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [candidates, initialValidated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const axisFilter: maplibregl.FilterSpecification = ["in", selectedId, ["get", "axisIds"]];
    map.setFilter("candidate-lines", axisFilter);
    map.setFilter("candidate-hit", axisFilter);
    map.setFilter("active-way", ["==", ["get", "osmId"], activeWayId ?? ""]);
    (map.getSource(EDITING_SOURCE) as GeoJSONSource).setData(editingFeature(editingLines));
    (map.getSource(VALIDATED_SOURCE) as GeoJSONSource).setData(validated);
  }, [activeWayId, editingLines, mapReady, selectedId, validated]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    const syncMarker = (
      point: Position | null,
      label: "A" | "B",
      color: string,
      markerRef: React.MutableRefObject<Marker | null>,
      field: "start" | "end",
    ) => {
      if (!point) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }
      if (!markerRef.current) {
        const marker = new maplibregl.Marker({ element: markerElement(label, color), draggable: true })
          .setLngLat(point)
          .addTo(map);
        marker.on("dragend", () => {
          const position = marker.getLngLat();
          const snapped = snapToLines([position.lng, position.lat], sourceLinesRef.current);
          if (snapped) updateDraft(selectedIdRef.current, { [field]: snapped.point });
        });
        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat(point);
      }
    };

    syncMarker(draft.start, "A", "#0b67e3", startMarkerRef, "start");
    syncMarker(draft.end, "B", "#dc2626", endMarkerRef, "end");
  }, [draft.end, draft.start, mapReady]);

  const selectAxis = (review: AxisReview) => {
    setSelectedId(review.axis.id);
    setActiveWayId(null);
    setCropMode(null);
    setMessage(null);
    const coordinates = review.candidates.flatMap((feature) => feature.geometry.coordinates);
    const map = mapRef.current;
    if (!map || !coordinates.length) return;
    const bounds = coordinates.reduce((current, coordinate) => current.extend(coordinate), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    map.fitBounds(bounds, { padding: 70, maxZoom: 17, duration: 600 });
  };

  const toggleWay = (osmId: string) => {
    const exists = draft.wayIds.includes(osmId);
    updateDraft(selectedId, {
      wayIds: exists ? draft.wayIds.filter((id) => id !== osmId) : [...draft.wayIds, osmId],
      start: null,
      end: null,
    });
  };

  const saveValidation = async () => {
    if (!editingLines.some((line) => line.length > 1) || !draft.wayIds.length || geometryError) return;
    setSaving(true);
    setMessage(null);
    const feature: ValidatedGeometryFeature = {
      type: "Feature",
      properties: {
        axisId: selectedId,
        geometrySource: "OpenStreetMap",
        geometryStatus: "validated",
        validationMethod: "manual",
        validationGeometryMode: draft.geometryMode,
        officialLengthMeters: selectedReview.axis.officialLengthMeters,
        geometryLengthMeters: Number(editingLength.toFixed(2)),
        startReference: draft.startReference.trim(),
        endReference: draft.endReference.trim(),
        validatedAt: new Date().toISOString(),
        osmWayIds: [...new Set(draft.wayIds)],
      },
      geometry: editingLines.length === 1
        ? { type: "LineString", coordinates: editingLines[0] }
        : { type: "MultiLineString", coordinates: editingLines },
    };

    try {
      const response = await fetch("/api/dev/geometry-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feature),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Falha ao salvar.");
      const updated = await response.json() as ValidatedGeometryCollection;
      setValidated(updated);
      setConfirming(false);
      setMessage(`${selectedId} validado e salvo localmente.`);
      const next = reviews.find((review) => !updated.features.some((item) => item.properties.axisId === review.axis.id));
      if (next) selectAxis(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a validação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-slate-100 text-slate-950 lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[minmax(0,68fr)_minmax(360px,32fr)] lg:overflow-hidden">
      <section
        className="relative isolate h-[48dvh] min-h-[340px] w-full shrink-0 overflow-hidden lg:h-dvh lg:min-h-0"
        aria-label="Mapa de validação manual"
      >
        <div
          ref={containerRef}
          className="absolute inset-0 block h-full min-h-[340px] w-full lg:min-h-0"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-blue-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Ferramenta local de desenvolvimento</p>
            <h1 className="mt-1 text-lg font-extrabold">Validação manual assistida</h1>
            <p className="mt-1 text-xs text-slate-600">Selecione, recorte e confirme visualmente</p>
          </div>
          <div className="rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow">Não publicado</div>
        </div>

        {activeWay && (
          <div className="absolute bottom-28 left-4 z-20 max-w-xs rounded-2xl border border-amber-200 bg-white p-4 shadow-xl">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Via OSM</p>
            <p className="mt-1 font-bold">{activeWay.properties.osmName}</p>
            <p className="mt-1 text-xs text-slate-500">{activeWay.properties.osmId} · {formatMeters(activeWay.properties.candidateLengthMeters)}</p>
            <button type="button" onClick={() => toggleWay(activeWay.properties.osmId)} className="mt-3 min-h-11 w-full rounded-xl bg-blue-600 px-4 text-sm font-bold text-white">
              {draft.wayIds.includes(activeWay.properties.osmId) ? "Remover do trecho" : "Adicionar ao trecho"}
            </button>
          </div>
        )}

        {cropMode && <div className="absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-full bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-xl">Clique na linha azul para definir {cropMode === "start" ? "o início A" : "o fim B"}</div>}

        <div className="absolute bottom-6 right-4 z-10 grid gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 text-xs font-semibold shadow-lg">
          <span><i className="mr-2 inline-block w-7 border-t-4 border-dashed border-violet-600 align-middle" />Via OSM candidata</span>
          <span><i className="mr-2 inline-block w-7 border-t-4 border-blue-600 align-middle" />Geometria em edição</span>
          <span><i className="mr-2 inline-block w-7 border-t-4 border-green-700 align-middle" />Geometria validada</span>
        </div>
      </section>

      <aside className="relative min-w-0 w-full overflow-visible border-l border-slate-200 bg-white lg:h-dvh lg:overflow-x-hidden lg:overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Progresso</p><h2 className="text-xl font-extrabold">Geometrias validadas: {validatedIds.size} / {axes.length}</h2></div>
            <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-bold text-green-800">{Math.round((validatedIds.size / axes.length) * 100)}%</div>
          </div>
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Eixos da obra">
            {reviews.map((review) => {
              const isValidated = validatedIds.has(review.axis.id);
              const isEditing = (drafts[review.axis.id]?.wayIds.length ?? 0) > 0;
              const symbol = isValidated ? "✓" : isEditing ? "●" : review.status === "ambiguous" ? "?" : "○";
              return <button key={review.axis.id} type="button" onClick={() => selectAxis(review)} title={`${review.axis.id}: ${isValidated ? "validated" : isEditing ? "editing" : review.status}`} className={`min-h-10 shrink-0 rounded-lg border px-2 text-xs font-bold ${selectedId === review.axis.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}>{symbol} {review.axis.id}</button>;
            })}
          </div>
        </div>

        <div className="space-y-5 p-5">
          {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</p>}
          <section>
            <div className="flex items-start gap-3"><span className="rounded-lg bg-slate-950 px-2 py-1 text-sm font-black text-white">{selectedReview.axis.id}</span><div><h3 className="font-extrabold">{selectedReview.axis.technicalName}</h3><p className="mt-1 text-xs text-slate-500">{selectedReview.axis.area}</p></div></div>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-950"><strong>Orientação de revisão:</strong> {selectedReview.axis.reviewGuidance}</div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-extrabold">Ways candidatos</h3><span className="text-xs text-slate-500">{selectedReview.candidates.length} encontrados</span></div>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {selectedReview.candidates.map((feature) => {
                const selected = draft.wayIds.includes(feature.properties.osmId);
                return <button key={feature.properties.osmId} type="button" onClick={() => { setActiveWayId(feature.properties.osmId); toggleWay(feature.properties.osmId); }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border p-3 text-left ${selected ? "border-blue-500 bg-blue-50" : "border-violet-200 bg-violet-50/50"}`}><span className={`grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold ${selected ? "bg-blue-600 text-white" : "border border-violet-400 text-violet-700"}`}>{selected ? "✓" : "+"}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{feature.properties.osmName}</strong><small className="text-slate-500">{feature.properties.osmId} · {formatMeters(feature.properties.candidateLengthMeters)}</small></span></button>;
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
            <h3 className="text-sm font-extrabold text-blue-950">Geometrias selecionadas</h3>
            {selectedFeatures.length ? <ul className="mt-2 space-y-2">{selectedFeatures.map((feature) => <li key={feature.properties.osmId} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs"><span><strong>{feature.properties.osmId}</strong><br />{feature.properties.osmName}</span><button type="button" onClick={() => toggleWay(feature.properties.osmId)} className="min-h-9 rounded-lg px-2 font-bold text-rose-700">Remover</button></li>)}</ul> : <p className="mt-2 text-sm text-slate-600">Clique em um way roxo no mapa ou na lista para adicionar.</p>}
          </section>

          <section>
            <h3 className="text-sm font-extrabold">Modo da geometria</h3>
            <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Modo da geometria de validação">
              <button type="button" aria-pressed={draft.geometryMode === "full_ways"} onClick={() => { updateDraft(selectedId, { geometryMode: "full_ways", start: null, end: null }); setCropMode(null); }} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${draft.geometryMode === "full_ways" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Usar ways completos</button>
              <button type="button" aria-pressed={draft.geometryMode === "trimmed"} onClick={() => { updateDraft(selectedId, { geometryMode: "trimmed", start: null, end: null }); setCropMode(null); }} className={`min-h-11 rounded-xl border px-3 text-sm font-bold ${draft.geometryMode === "trimmed" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700"}`}>Recortar trecho</button>
            </div>
            {draft.geometryMode === "full_ways" ? (
              <p className="mt-2 rounded-xl bg-green-50 p-3 text-xs leading-relaxed text-green-900">Os ways selecionados serão usados integralmente, sem conectores nem recorte geométrico.</p>
            ) : (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">Os cliques e marcadores são ajustados para o ponto mais próximo da linha azul. Arraste A ou B para refinar.</p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" disabled={!selectedFeatures.length || draft.geometryMode !== "trimmed" || selectedFeatures.length > 1} onClick={() => setCropMode("start")} className="min-h-11 rounded-xl bg-blue-600 px-3 text-sm font-bold text-white disabled:opacity-40">Definir início A</button>
              <button type="button" disabled={!selectedFeatures.length || draft.geometryMode !== "trimmed" || selectedFeatures.length > 1} onClick={() => setCropMode("end")} className="min-h-11 rounded-xl bg-rose-600 px-3 text-sm font-bold text-white disabled:opacity-40">Definir fim B</button>
            </div>
            <button type="button" disabled={!draft.start && !draft.end} onClick={() => updateDraft(selectedId, { start: null, end: null })} className="mt-2 min-h-10 w-full rounded-xl border border-slate-300 text-sm font-bold text-slate-700 disabled:opacity-40">Limpar recorte</button>
            {geometryError && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-900">{geometryError}</p>}
          </section>

          <section className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-4 text-white">
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Extensão oficial</span>{formatMeters(selectedReview.axis.officialLengthMeters)}</div>
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Em edição</span>{formatMeters(editingLength)}</div>
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Diferença</span>{signed(differenceMeters, " m")}</div>
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Diferença percentual</span>{signed(differencePercent, "%")}</div>
            <p className="col-span-2 mt-1 text-[11px] text-slate-400">Indicador de revisão, não critério automático de aceite.</p>
          </section>

          <section className="space-y-3">
            <label className="block text-sm font-bold">Início confirmado por<input value={draft.startReference} onChange={(event) => updateDraft(selectedId, { startReference: event.target.value })} placeholder="Ex.: Rua Dr. Germano Barros de Souza" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-600" /></label>
            <label className="block text-sm font-bold">Fim confirmado por<input value={draft.endReference} onChange={(event) => updateDraft(selectedId, { endReference: event.target.value })} placeholder="Ex.: Rua Leonel Velasco" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-blue-600" /></label>
          </section>

          <section className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><strong className="block text-slate-900">Proveniência</strong><span>Dados: {OFFICIAL_WORK_SOURCE.title}</span><br /><span>Geometria: {CARTOGRAPHY_SOURCE.title} — candidata durante a edição</span><br /><span>Revisão: manual</span></section>

          <button type="button" disabled={!editingLines.some((line) => line.length > 1) || Boolean(geometryError)} onClick={() => setConfirming(true)} className="min-h-12 w-full rounded-xl bg-green-700 px-4 font-extrabold text-white disabled:bg-slate-300">{validatedIds.has(selectedId) ? "Revalidar geometria" : "Validar geometria"}</button>
        </div>
      </aside>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="validation-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">Confirmação manual</p>
            <h2 id="validation-title" className="mt-1 text-xl font-extrabold">Validar {selectedReview.axis.id}</h2>
            <dl className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm"><div><dt className="font-bold text-slate-500">Eixo</dt><dd>{selectedReview.axis.technicalName}</dd></div><div><dt className="font-bold text-slate-500">Modo</dt><dd>{draft.geometryMode === "full_ways" ? "Ways completos" : "Trecho recortado"}</dd></div><div><dt className="font-bold text-slate-500">Extensão oficial</dt><dd>{formatMeters(selectedReview.axis.officialLengthMeters)}</dd></div><div><dt className="font-bold text-slate-500">Extensão selecionada</dt><dd>{formatMeters(editingLength)}</dd></div><div><dt className="font-bold text-slate-500">Origem geométrica</dt><dd>OpenStreetMap</dd></div><div><dt className="font-bold text-slate-500">Revisão</dt><dd>Manual</dd></div></dl>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">Esta confirmação grava o trecho no arquivo local de geometrias validadas. A home não será alterada.</p>
            <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={() => setConfirming(false)} className="min-h-12 rounded-xl border border-slate-300 font-bold">Cancelar</button><button type="button" disabled={saving} onClick={saveValidation} className="min-h-12 rounded-xl bg-green-700 font-bold text-white disabled:opacity-50">{saving ? "Salvando…" : "Confirmar validação"}</button></div>
          </div>
        </div>
      )}
    </main>
  );
}
