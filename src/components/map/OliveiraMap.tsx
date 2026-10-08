"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { statusColorExpression } from "@/config/statuses";
import { PUBLIC_MAP_STYLE, hasTechnicalOverlay, pavingVisualStyle } from "@/config/public-map-style";
import { DRAINAGE_PUBLIC_DEFAULT_VISIBLE } from "@/lib/drainage-data";
import { SANITATION_STYLE } from "@/config/sanitation";
import { SANITATION_PUBLIC_DEFAULT_VISIBLE } from "@/lib/sanitation-data";
import { requestUserLocation, type UserCoordinate, type UserLocationStatus } from "@/lib/user-location";
import { shareSite } from "@/lib/share";
import { trackEvent } from "@/lib/analytics";
import { SITE_URL } from "@/config/site";
import { PAVING_SELECTION_DURATION_MS, PAVING_SELECTION_MAX_ZOOM, isEmptyInteractiveMapClick, pavingGeometryBounds, pavingOpacityExpression, pavingSelectionAfterSegmentClick, pavingSelectionFilter, pavingSelectionPadding, shouldClearPavingSelectionOnEscape } from "@/lib/paving-selection";
import { selectDrainage, selectPaving, selectSanitation, type PublicMapSelection } from "@/lib/public-map-selection";
import type { DrainageGeoJsonCollection } from "@/types/drainage";
import type { PublicSegmentCollection } from "@/types/map";
import type { SanitationCollection } from "@/types/sanitation";
import { DrainageDetails } from "./DrainageDetails";
import { MapLayersControl } from "./MapLayersControl";
import { MapLegend } from "./MapLegend";
import { MainMenu } from "./MainMenu";
import { MapHint } from "./MapHint";
import { MapInfoPanel } from "./MapInfoPanel";
import { SegmentDetails } from "./SegmentDetails";
import { SanitationDetails } from "./SanitationDetails";
import { UserLocationControl } from "./UserLocationControl";

const CENTER: [number, number] = [-54.658, -20.474];
const SOURCE_ID = "validated-paving-segments";
const HIT_LAYER_ID = "paving-segments-hit-area";
const LINE_LAYER_ID = "paving-segments-lines";
const SELECTED_LAYER_ID = "paving-segment-selected";
const SELECTED_CORE_LAYER_ID = "paving-segment-selected-core";
const WORKER_URL = "/maplibre-gl-worker.mjs";
const MAP_INITIALIZATION_TIMEOUT_MS = 15_000;
const LOCATION_MESSAGE_TIMEOUT_MS = 6_000;
const SHARE_MESSAGE_TIMEOUT_MS = 5_000;
const DRAINAGE_SOURCE_ID = "validated-project-drainage";
const DRAINAGE_CASING_ID = "project-drainage-casing";
const DRAINAGE_LINE_ID = "project-drainage-lines";
const DRAINAGE_NODE_ID = "project-drainage-nodes";
const DRAINAGE_HIT_ID = "project-drainage-hit-area";
const WATER_SOURCE_ID = "validated-reference-water";
const SEWER_SOURCE_ID = "validated-reference-sewer";
const WATER_LINE_ID = "reference-water-lines";
const SEWER_LINE_ID = "reference-sewer-lines";
const WATER_CASING_ID = "reference-water-casing";
const SEWER_CASING_ID = "reference-sewer-casing";
const WATER_HIT_ID = "reference-water-hit-area";
const SEWER_HIT_ID = "reference-sewer-hit-area";
const WATER_SELECTED_ID = "reference-water-selected";
const SEWER_SELECTED_ID = "reference-sewer-selected";

interface OliveiraMapProps {
  segments: PublicSegmentCollection;
  drainage: DrainageGeoJsonCollection;
  water: SanitationCollection;
  sewer: SanitationCollection;
}

export function OliveiraMap({ segments, drainage, water, sewer }: OliveiraMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const drainageEnabledRef = useRef(DRAINAGE_PUBLIC_DEFAULT_VISIBLE);
  const sanitationEnabledRef = useRef(SANITATION_PUBLIC_DEFAULT_VISIBLE);
  const waterEnabledRef = useRef(true);
  const sewerEnabledRef = useRef(true);
  const selectedSegmentIdRef = useRef<string | null>(null);
  const userLocationRef = useRef<UserCoordinate | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const locationRequestInFlightRef = useRef(false);
  const [selected, setSelected] = useState<PublicMapSelection | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [drainageEnabled, setDrainageEnabled] = useState(DRAINAGE_PUBLIC_DEFAULT_VISIBLE);
  const [sanitationEnabled, setSanitationEnabled] = useState(SANITATION_PUBLIC_DEFAULT_VISIBLE);
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [sewerEnabled, setSewerEnabled] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [hasSelectedPavingOnce, setHasSelectedPavingOnce] = useState(false);
  const [mapStatus, setMapStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locationStatus, setLocationStatus] = useState<UserLocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<"copied" | "unavailable" | null>(null);

  const technicalOverlayIsVisible = useCallback(() => hasTechnicalOverlay({
    drainageVisible: drainageEnabledRef.current,
    waterVisible: sanitationEnabledRef.current && waterEnabledRef.current,
    sewerVisible: sanitationEnabledRef.current && sewerEnabledRef.current,
  }), []);

  const updatePavingVisualContext = useCallback(() => {
    const map = mapRef.current;
    if (!map?.getLayer(LINE_LAYER_ID)) return;
    const technicalOverlayVisible = technicalOverlayIsVisible();
    const style = pavingVisualStyle(technicalOverlayVisible);
    map.setPaintProperty(LINE_LAYER_ID, "line-opacity", pavingOpacityExpression(selectedSegmentIdRef.current, technicalOverlayVisible));
    map.setPaintProperty(LINE_LAYER_ID, "line-width", style.width);
  }, [technicalOverlayIsVisible]);

  const clearSegmentSelection = useCallback(() => {
    setSelected(null);
    setSelectedSegmentId(null);
    selectedSegmentIdRef.current = null;
    const map = mapRef.current;
    if (!map?.getLayer(SELECTED_LAYER_ID)) return;
    map.setFilter(SELECTED_LAYER_ID, pavingSelectionFilter(null));
    map.setFilter(SELECTED_CORE_LAYER_ID, pavingSelectionFilter(null));
    map.setPaintProperty(LINE_LAYER_ID, "line-opacity", pavingOpacityExpression(null, technicalOverlayIsVisible()));
    map.setFilter(WATER_SELECTED_ID, ["==", ["get", "id"], ""]);
    map.setFilter(SEWER_SELECTED_ID, ["==", ["get", "id"], ""]);
  }, [technicalOverlayIsVisible]);

  const closeInfo = useCallback(() => setInfoOpen(false), []);
  const closeMainMenu = useCallback(() => setMainMenuOpen(false), []);
  const openAbout = useCallback(() => { setMainMenuOpen(false); setInfoOpen(true); }, []);

  useEffect(() => {
    if (!locationMessage) return;
    const timeout = window.setTimeout(() => setLocationMessage(null), LOCATION_MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [locationMessage]);

  useEffect(() => {
    if (!shareMessage) return;
    const timeout = window.setTimeout(() => setShareMessage(null), SHARE_MESSAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [shareMessage]);

  const handleShare = useCallback(async () => {
    const outcome = await shareSite({ onEvent: (event) => {
      if (event === "share_native_opened") trackEvent(event, { share_method: "native" });
      else if (event === "share_link_copied") trackEvent(event, { share_method: "clipboard" });
      else trackEvent(event);
    } });
    if (outcome === "copied") setShareMessage("copied");
    if (outcome === "unavailable") setShareMessage("unavailable");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const hasEditableTarget = Boolean(target?.closest("input, textarea, select, [contenteditable='true']"));
      if (shouldClearPavingSelectionOnEscape({
        key: event.key,
        hasSelectedSegment: selectedSegmentId !== null,
        hasOpenOverlay: infoOpen || layersOpen || mainMenuOpen,
        hasEditableTarget,
      })) clearSegmentSelection();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSegmentSelection, infoOpen, layersOpen, mainMenuOpen, selectedSegmentId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Turbopack não publica automaticamente o worker ESM do MapLibre.
    maplibregl.setWorkerUrl(WORKER_URL);

    let map: MapLibreMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        center: CENTER,
        zoom: 15.2,
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
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
      });
    } catch (error) {
      console.error("[OliveiraMap] Falha ao instanciar o MapLibre.", error);
      queueMicrotask(() => setMapStatus("error"));
      return;
    }

    mapRef.current = map;
    let initializationFinished = false;
    const reportInitializationError = (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const isWorkerFailure = message.includes("Worker failed to load");
      if (initializationFinished && !isWorkerFailure) return;
      console.error("[OliveiraMap] Falha durante a inicialização do mapa.", error);
      setMapStatus("error");
    };
    map.on("error", (event) => reportInitializationError(event.error));
    const initializationTimeout = window.setTimeout(() => {
      reportInitializationError(new Error(`O evento style.load não ocorreu em ${MAP_INITIALIZATION_TIMEOUT_MS} ms.`));
    }, MAP_INITIALIZATION_TIMEOUT_MS);
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const collapseAttribution = () => {
      const attribution = map.getContainer().querySelector<HTMLElement>(".maplibregl-ctrl-attrib");
      attribution?.classList.remove("maplibregl-compact-show");
      attribution?.removeAttribute("open");
    };
    window.requestAnimationFrame(collapseAttribution);
    map.once("idle", collapseAttribution);

    map.once("style.load", () => {
      try {
      map.addSource(SOURCE_ID, { type: "geojson", data: segments });
      map.addSource(DRAINAGE_SOURCE_ID, { type: "geojson", data: drainage });
      map.addSource(WATER_SOURCE_ID, { type: "geojson", data: water });
      map.addSource(SEWER_SOURCE_ID, { type: "geojson", data: sewer });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": statusColorExpression as unknown as maplibregl.ExpressionSpecification,
          "line-width": PUBLIC_MAP_STYLE.paving.defaultWidth,
          "line-opacity": PUBLIC_MAP_STYLE.paving.defaultOpacity,
        },
      });
      map.addLayer({
        id: HIT_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": "#000000", "line-width": 28, "line-opacity": 0 },
      });
      map.addLayer({ id: SELECTED_LAYER_ID, type: "line", source: SOURCE_ID, filter: ["==", ["get", "axisId"], ""], paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 12, 18, 16], "line-opacity": 0.92, "line-blur": 0.6 } });
      map.addLayer({ id: SELECTED_CORE_LAYER_ID, type: "line", source: SOURCE_ID, filter: ["==", ["get", "axisId"], ""], paint: { "line-color": "#1d4ed8", "line-width": ["interpolate", ["linear"], ["zoom"], 13, 7, 18, 10], "line-opacity": 1 } });
      map.addLayer({ id: WATER_SELECTED_ID, type: "line", source: WATER_SOURCE_ID, filter: ["==", ["get", "id"], ""], layout: { visibility: "none" }, paint: { "line-color": "#facc15", "line-width": 11, "line-offset": PUBLIC_MAP_STYLE.sanitation.waterOffset, "line-opacity": 0.95 } });
      map.addLayer({ id: WATER_CASING_ID, type: "line", source: WATER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": PUBLIC_MAP_STYLE.sanitation.casingColor, "line-width": PUBLIC_MAP_STYLE.sanitation.casingWidth, "line-offset": PUBLIC_MAP_STYLE.sanitation.waterOffset, "line-opacity": 0.92 } });
      map.addLayer({ id: WATER_LINE_ID, type: "line", source: WATER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": SANITATION_STYLE.publicWater, "line-width": PUBLIC_MAP_STYLE.sanitation.lineWidth, "line-offset": PUBLIC_MAP_STYLE.sanitation.waterOffset, "line-opacity": 0.95 } });
      map.addLayer({ id: DRAINAGE_CASING_ID, type: "line", source: DRAINAGE_SOURCE_ID, filter: ["==", ["get", "featureType"], "segment"], layout: { visibility: "none" }, paint: { "line-color": PUBLIC_MAP_STYLE.drainage.casingColor, "line-width": PUBLIC_MAP_STYLE.drainage.casingWidth, "line-opacity": 0.9 } });
      map.addLayer({ id: DRAINAGE_LINE_ID, type: "line", source: DRAINAGE_SOURCE_ID, filter: ["==", ["get", "featureType"], "segment"], layout: { visibility: "none" }, paint: { "line-color": PUBLIC_MAP_STYLE.drainage.color, "line-width": PUBLIC_MAP_STYLE.drainage.lineWidth, "line-opacity": 0.95 } });
      map.addLayer({ id: SEWER_SELECTED_ID, type: "line", source: SEWER_SOURCE_ID, filter: ["==", ["get", "id"], ""], layout: { visibility: "none" }, paint: { "line-color": "#facc15", "line-width": 11, "line-offset": PUBLIC_MAP_STYLE.sanitation.sewerOffset, "line-opacity": 0.95 } });
      map.addLayer({ id: SEWER_CASING_ID, type: "line", source: SEWER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": PUBLIC_MAP_STYLE.sanitation.casingColor, "line-width": PUBLIC_MAP_STYLE.sanitation.casingWidth, "line-offset": PUBLIC_MAP_STYLE.sanitation.sewerOffset, "line-opacity": 0.92, "line-dasharray": [2, 1.5] } });
      map.addLayer({ id: SEWER_LINE_ID, type: "line", source: SEWER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": SANITATION_STYLE.publicSewer, "line-width": PUBLIC_MAP_STYLE.sanitation.lineWidth, "line-offset": PUBLIC_MAP_STYLE.sanitation.sewerOffset, "line-opacity": 0.95, "line-dasharray": [2, 1.5] } });
      map.addLayer({ id: DRAINAGE_NODE_ID, type: "circle", source: DRAINAGE_SOURCE_ID, filter: ["==", ["get", "featureType"], "node"], layout: { visibility: "none" }, paint: { "circle-radius": PUBLIC_MAP_STYLE.drainage.nodeRadius, "circle-color": PUBLIC_MAP_STYLE.drainage.color, "circle-stroke-color": "#ffffff", "circle-stroke-width": PUBLIC_MAP_STYLE.drainage.nodeStrokeWidth, "circle-opacity": 1, "circle-stroke-opacity": 0.96 } });
      map.addLayer({ id: WATER_HIT_ID, type: "line", source: WATER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": "#000", "line-width": 12, "line-offset": PUBLIC_MAP_STYLE.sanitation.waterOffset, "line-opacity": 0 } });
      map.addLayer({ id: DRAINAGE_HIT_ID, type: "line", source: DRAINAGE_SOURCE_ID, filter: ["==", ["get", "featureType"], "segment"], layout: { visibility: "none" }, paint: { "line-color": "#000", "line-width": 14, "line-opacity": 0 } });
      map.addLayer({ id: SEWER_HIT_ID, type: "line", source: SEWER_SOURCE_ID, layout: { visibility: "none" }, paint: { "line-color": "#000", "line-width": 12, "line-offset": PUBLIC_MAP_STYLE.sanitation.sewerOffset, "line-opacity": 0 } });

      map.on("click", HIT_LAYER_ID, (event: maplibregl.MapMouseEvent) => {
        const sanitationHits = [waterEnabledRef.current ? WATER_HIT_ID : null, sewerEnabledRef.current ? SEWER_HIT_ID : null].filter((id): id is string => Boolean(sanitationEnabledRef.current && id));
        if (sanitationHits.length && map.queryRenderedFeatures(event.point, { layers: sanitationHits }).length) return;
        if (drainageEnabledRef.current && map.queryRenderedFeatures(event.point, { layers: [DRAINAGE_HIT_ID] }).length) return;
        const feature = map.queryRenderedFeatures(event.point, { layers: [HIT_LAYER_ID] })[0];
        if (!feature?.properties) return;
        const segment = segments.features.find((item) => item.properties.axisId === feature.properties?.axisId);
        if (!segment) return;
        const properties = segment.properties;
        trackEvent("segment_selected", { segment_id: properties.axisId });
        setSelected(selectPaving(properties));
        setHasSelectedPavingOnce(true);
        selectedSegmentIdRef.current = properties.axisId;
        setSelectedSegmentId((currentId) => pavingSelectionAfterSegmentClick(currentId, properties.axisId));
        map.setFilter(SELECTED_LAYER_ID, pavingSelectionFilter(properties.axisId));
        map.setFilter(SELECTED_CORE_LAYER_ID, pavingSelectionFilter(properties.axisId));
        map.setFilter(WATER_SELECTED_ID, ["==", ["get", "id"], ""]); map.setFilter(SEWER_SELECTED_ID, ["==", ["get", "id"], ""]);
        map.setPaintProperty(LINE_LAYER_ID, "line-opacity", pavingOpacityExpression(properties.axisId, technicalOverlayIsVisible()));
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.fitBounds(pavingGeometryBounds(segment.geometry), { padding: pavingSelectionPadding(window.innerWidth < 768), maxZoom: PAVING_SELECTION_MAX_ZOOM, duration: reducedMotion ? 0 : PAVING_SELECTION_DURATION_MS });
      });
      map.on("click", DRAINAGE_HIT_ID, (event) => {
        const sanitationHits = [waterEnabledRef.current ? WATER_HIT_ID : null, sewerEnabledRef.current ? SEWER_HIT_ID : null].filter((id): id is string => Boolean(sanitationEnabledRef.current && id));
        if (sanitationHits.length && map.queryRenderedFeatures(event.point, { layers: sanitationHits }).length) return;
        const feature = map.queryRenderedFeatures(event.point, { layers: [DRAINAGE_HIT_ID] })[0];
        if (!feature?.properties) return;
        const properties = drainage.features.find((item) => item.properties.featureType === "segment" && item.properties.id === feature.properties?.id)?.properties;
        if (!properties) return;
        setSelected(selectDrainage(properties));
        setSelectedSegmentId(null);
        selectedSegmentIdRef.current = null;
        map.setFilter(SELECTED_LAYER_ID, pavingSelectionFilter(null));
        map.setFilter(SELECTED_CORE_LAYER_ID, pavingSelectionFilter(null)); map.setPaintProperty(LINE_LAYER_ID, "line-opacity", pavingOpacityExpression(null, technicalOverlayIsVisible()));
      });
      const selectNetwork = (type: "water" | "sewer", event: maplibregl.MapLayerMouseEvent) => { const hitId = type === "water" ? WATER_HIT_ID : SEWER_HIT_ID; const collection = type === "water" ? water : sewer; const feature = map.queryRenderedFeatures(event.point, { layers: [hitId] })[0]; const properties = collection.features.find((item) => item.properties.id === feature?.properties?.id)?.properties; if (!properties) return; setSelected(selectSanitation(properties)); setSelectedSegmentId(null); selectedSegmentIdRef.current = null; map.setFilter(SELECTED_LAYER_ID, pavingSelectionFilter(null)); map.setFilter(SELECTED_CORE_LAYER_ID, pavingSelectionFilter(null)); map.setPaintProperty(LINE_LAYER_ID, "line-opacity", pavingOpacityExpression(null, technicalOverlayIsVisible())); map.setFilter(WATER_SELECTED_ID, ["==", ["get", "id"], type === "water" ? properties.id : ""]); map.setFilter(SEWER_SELECTED_ID, ["==", ["get", "id"], type === "sewer" ? properties.id : ""]); };
      map.on("click", WATER_HIT_ID, (event) => selectNetwork("water", event));
      map.on("click", SEWER_HIT_ID, (event) => selectNetwork("sewer", event));
      map.on("click", (event) => {
        const interactiveLayers = [
          HIT_LAYER_ID,
          drainageEnabledRef.current ? DRAINAGE_HIT_ID : null,
          sanitationEnabledRef.current && waterEnabledRef.current ? WATER_HIT_ID : null,
          sanitationEnabledRef.current && sewerEnabledRef.current ? SEWER_HIT_ID : null,
        ].filter((id): id is string => id !== null);
        const renderedFeatures = map.queryRenderedFeatures(event.point, { layers: interactiveLayers });
        if (isEmptyInteractiveMapClick(renderedFeatures.length)) clearSegmentSelection();
      });
      map.on("mouseenter", HIT_LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", HIT_LAYER_ID, () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", DRAINAGE_HIT_ID, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", DRAINAGE_HIT_ID, () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", WATER_HIT_ID, () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", WATER_HIT_ID, () => { map.getCanvas().style.cursor = ""; }); map.on("mouseenter", SEWER_HIT_ID, () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", SEWER_HIT_ID, () => { map.getCanvas().style.cursor = ""; });
        initializationFinished = true;
        window.clearTimeout(initializationTimeout);
        setMapStatus("ready");
        trackEvent("map_loaded");
      } catch (error) {
        reportInitializationError(error);
      }
    });

    return () => {
      initializationFinished = true;
      window.clearTimeout(initializationTimeout);
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [clearSegmentSelection, drainage, segments, sewer, technicalOverlayIsVisible, water]);

  const changeDrainageVisibility = (enabled: boolean) => {
    setDrainageEnabled(enabled);
    drainageEnabledRef.current = enabled;
    const map = mapRef.current;
    if (map?.getLayer(DRAINAGE_LINE_ID)) {
      const visibility = enabled ? "visible" : "none";
      [DRAINAGE_CASING_ID, DRAINAGE_LINE_ID, DRAINAGE_NODE_ID, DRAINAGE_HIT_ID].forEach((layerId) => map.setLayoutProperty(layerId, "visibility", visibility));
    }
    updatePavingVisualContext();
    if (!enabled && selected?.type === "drainage") setSelected(null);
    if (enabled) trackEvent("layer_drainage_enabled", { layer_name: "drainage" });
  };

  const setNetworkVisibility = (type: "water" | "sewer", enabled: boolean) => {
    const layers = type === "water"
      ? [WATER_SELECTED_ID, WATER_CASING_ID, WATER_LINE_ID, WATER_HIT_ID]
      : [SEWER_SELECTED_ID, SEWER_CASING_ID, SEWER_LINE_ID, SEWER_HIT_ID];
    const visibility = sanitationEnabledRef.current && enabled ? "visible" : "none";
    const map = mapRef.current;
    if (map?.getLayer(layers[0])) layers.forEach((layerId) => map.setLayoutProperty(layerId, "visibility", visibility));
    updatePavingVisualContext();
    if (!enabled && selected?.type === "sanitation" && selected.properties.networkType === type) clearSegmentSelection();
  };
  const changeSanitationVisibility = (enabled: boolean) => { setSanitationEnabled(enabled); sanitationEnabledRef.current = enabled; if (enabled) { setWaterEnabled(true); setSewerEnabled(true); waterEnabledRef.current = true; sewerEnabledRef.current = true; trackEvent("layer_water_enabled", { layer_name: "water" }); trackEvent("layer_sewer_enabled", { layer_name: "sewer" }); } setNetworkVisibility("water", enabled); setNetworkVisibility("sewer", enabled); updatePavingVisualContext(); if (!enabled && selected?.type === "sanitation") clearSegmentSelection(); };
  const changeWaterVisibility = (enabled: boolean) => { setWaterEnabled(enabled); waterEnabledRef.current = enabled; setNetworkVisibility("water", enabled); updatePavingVisualContext(); if (enabled) trackEvent("layer_water_enabled", { layer_name: "water" }); };
  const changeSewerVisibility = (enabled: boolean) => { setSewerEnabled(enabled); sewerEnabledRef.current = enabled; setNetworkVisibility("sewer", enabled); updatePavingVisualContext(); if (enabled) trackEvent("layer_sewer_enabled", { layer_name: "sewer" }); };

  const recenterOnUser = (coordinate: UserCoordinate) => mapRef.current?.flyTo({ center: coordinate, zoom: 16, essential: true });
  const showUserMarker = (coordinate: UserCoordinate) => {
    if (userMarkerRef.current) return void userMarkerRef.current.setLngLat(coordinate);
    const element = document.createElement("button");
    element.type = "button"; element.title = "Você está aqui"; element.setAttribute("aria-label", "Você está aqui");
    Object.assign(element.style, { width: "18px", height: "18px", borderRadius: "9999px", border: "3px solid white", background: "#2563eb", boxShadow: "0 0 0 7px rgba(37,99,235,0.25)", cursor: "pointer" });
    element.addEventListener("click", (event) => event.stopPropagation()); element.addEventListener("mousedown", (event) => event.stopPropagation());
    const popup = new maplibregl.Popup({ offset: 16, closeButton: false }).setText("Você está aqui");
    userMarkerRef.current = new maplibregl.Marker({ element }).setLngLat(coordinate).setPopup(popup).addTo(mapRef.current!);
  };
  const locateUser = async () => {
    if (locationRequestInFlightRef.current || !mapRef.current) return;
    trackEvent("geolocation_requested");
    const cached = userLocationRef.current;
    if (!cached) locationRequestInFlightRef.current = true;
    // Privacidade: a coordenada existe somente em memória; não é persistida, enviada ou registrada.
    const coordinate = await requestUserLocation({ cached, secureContext: typeof window !== "undefined" && window.isSecureContext, geolocation: typeof navigator === "undefined" ? undefined : navigator.geolocation, setStatus: setLocationStatus, setMessage: setLocationMessage, recenter: recenterOnUser, showMarker: showUserMarker, onError: (errorType) => trackEvent("geolocation_error", { error_type: errorType }) });
    if (coordinate) userLocationRef.current = coordinate;
    if (coordinate) trackEvent("geolocation_success");
    locationRequestInFlightRef.current = false;
  };

  return (
    <div className={`relative h-full w-full overflow-hidden ${selected ? "map-has-selection" : ""}`}>
      <div ref={containerRef} data-selected-segment-id={selectedSegmentId ?? undefined} className="absolute inset-0 h-full min-h-[560px] w-full" aria-label="Mapa interativo dos trechos previstos para pavimentação" />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] md:px-6 md:pt-4">
        <div className="pointer-events-auto mx-auto flex max-w-7xl items-center">
          <div className="map-brand flex items-center gap-2.5 px-3 py-2.5 min-[360px]:px-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-stone-800" aria-hidden="true"><svg viewBox="0 0 32 32" className="size-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round"><path d="M7 25c4-2 5-6 5-10s3-7 8-8" /><path d="M20 7h5v5" /><path d="M12 24h.01M14 19h.01M15 14h.01" /></svg></span>
            <h1 className="whitespace-nowrap text-base font-black tracking-[-0.025em] text-stone-950 min-[360px]:text-xl">Oliveira com Asfalto</h1>
          </div>
        </div>
      </header>

      {mapStatus === "loading" && <div className="absolute inset-0 grid place-items-center bg-slate-100 text-sm font-medium text-slate-600">Carregando mapa…</div>}
      {mapStatus === "error" && <div role="alert" className="absolute inset-0 grid place-items-center bg-slate-100 px-6 text-center text-sm text-slate-700">Não foi possível carregar o mapa.</div>}

      {!selected && <div className={`map-mobile-bottom-ui ${layersOpen ? "is-open" : ""}`}>
        {!layersOpen && !mainMenuOpen && !hasSelectedPavingOnce && <MapHint />}
        <div className={`map-floating-actions pointer-events-none ${layersOpen ? "is-open" : ""}`}>
          <div className="map-actions-cluster pointer-events-auto">
            <div className="map-utility-dock"><UserLocationControl status={locationStatus} onLocate={locateUser} />
              <MapLayersControl open={layersOpen} onToggle={() => setLayersOpen((value) => !value)} drainageEnabled={drainageEnabled} onDrainageChange={changeDrainageVisibility} sanitationEnabled={sanitationEnabled} waterEnabled={waterEnabled} sewerEnabled={sewerEnabled} onSanitationChange={changeSanitationVisibility} onWaterChange={changeWaterVisibility} onSewerChange={changeSewerVisibility} />
              <button ref={menuButtonRef} type="button" onClick={() => { trackEvent("menu_opened"); setMainMenuOpen(true); }} aria-label="Abrir menu Mais" aria-expanded={mainMenuOpen} className="map-control-button map-more-button gap-2 px-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg><span>Mais</span>
              </button>
            </div>
            <button type="button" onClick={handleShare} aria-label="Compartilhar Oliveira com Asfalto" title="Compartilhar" className="map-share-button">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></svg><span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>}
      {locationMessage && <div role="alert" aria-live="assertive" className="absolute left-1/2 top-20 z-30 flex w-[min(92vw,30rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-rose-200 bg-white py-2 pl-4 pr-2 text-base font-medium leading-snug text-rose-950 shadow-xl md:top-24"><span className="flex-1">{locationMessage}</span><button type="button" onClick={() => setLocationMessage(null)} aria-label="Fechar aviso de localização" className="map-icon-button text-rose-900">×</button></div>}
      {shareMessage && <div role="status" aria-live="polite" className="absolute left-1/2 top-20 z-[70] w-[min(92vw,25rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base text-slate-800 shadow-xl md:top-24">{shareMessage === "copied" ? <><strong>Link copiado!</strong><span className="mt-0.5 block text-sm text-slate-600">Agora é só enviar para quem quiser.</span></> : <><strong>Não foi possível copiar automaticamente.</strong><a href={SITE_URL} className="mt-1 block break-all font-semibold text-blue-700 underline">{SITE_URL}</a></>}</div>}
      {!selected && !layersOpen && !mainMenuOpen && <MapLegend drainageVisible={drainageEnabled} waterVisible={sanitationEnabled && waterEnabled} sewerVisible={sanitationEnabled && sewerEnabled} />}
      {selected && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 md:inset-y-0 md:left-auto md:right-0 md:flex md:w-[400px] md:items-center md:justify-center md:p-5">
        {selected.type === "sanitation" ? <SanitationDetails segment={selected.properties} onClose={clearSegmentSelection} /> : selected.type === "drainage" ? <DrainageDetails segment={selected.properties} onClose={clearSegmentSelection} /> : <SegmentDetails segment={selected.properties} onClose={clearSegmentSelection} onShare={handleShare} />}
      </div>}
      <MapInfoPanel open={infoOpen} onClose={closeInfo} returnFocusRef={menuButtonRef} />
      <MainMenu open={mainMenuOpen} onClose={closeMainMenu} onAbout={openAbout} />
    </div>
  );
}
