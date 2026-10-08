import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { PAVING_SELECTION_DURATION_MS, PAVING_SELECTION_MAX_ZOOM, isEmptyInteractiveMapClick, pavingGeometryBounds, pavingOpacityExpression, pavingSelectionAfterSegmentClick, pavingSelectionFilter, pavingSelectionPadding, shouldClearPavingSelectionOnEscape } from "../src/lib/paving-selection";
import type { PublicSegmentFeature } from "../src/types/map";

test("bounding box usa toda a geometria LineString e MultiLineString", () => {
  const line = { type: "LineString", coordinates: [[-54.66, -20.48], [-54.65, -20.47], [-54.67, -20.46]] } as PublicSegmentFeature["geometry"];
  const multi = { type: "MultiLineString", coordinates: [[[-54.66, -20.48], [-54.65, -20.47]], [[-54.68, -20.49], [-54.64, -20.45]]] } as PublicSegmentFeature["geometry"];
  assert.deepEqual(pavingGeometryBounds(line), [[-54.67, -20.48], [-54.65, -20.46]]);
  assert.deepEqual(pavingGeometryBounds(multi), [[-54.68, -20.49], [-54.64, -20.45]]);
});

test("fitBounds usa paddings específicos para desktop e mobile", () => {
  assert.deepEqual(pavingSelectionPadding(false), { top: 80, right: 480, bottom: 80, left: 80 });
  assert.deepEqual(pavingSelectionPadding(true), { top: 80, right: 40, bottom: 300, left: 40 });
  assert.equal(PAVING_SELECTION_MAX_ZOOM, 17);
  assert.equal(PAVING_SELECTION_DURATION_MS, 650);
});

test("seleção move filtro, mantém demais segmentos visíveis e fechar restaura estilo", () => {
  assert.deepEqual(pavingSelectionFilter("T05"), ["==", ["get", "axisId"], "T05"]);
  assert.deepEqual(pavingSelectionFilter("T06"), ["==", ["get", "axisId"], "T06"]);
  assert.deepEqual(pavingSelectionFilter(null), ["==", ["get", "axisId"], ""]);
  assert.deepEqual(pavingOpacityExpression("T05"), ["case", ["==", ["get", "axisId"], "T05"], 0.98, 0.62]);
  assert.equal(pavingOpacityExpression(null), 0.95);
  assert.equal(pavingOpacityExpression("T05", true), 0.32);
  assert.equal(pavingOpacityExpression(null, true), 0.32);
});

test("highlight usa a source existente e seleção não remove marcador de localização", () => {
  const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  assert.match(source, /paving-segment-selected-core/);
  assert.match(source, /source: SOURCE_ID/);
  const closeBlock = source.slice(source.indexOf("const clearSegmentSelection"), source.indexOf("useEffect(() =>", source.indexOf("const clearSegmentSelection")));
  assert.equal(closeBlock.includes("userMarkerRef.current?.remove"), false);
  assert.equal(closeBlock.includes("fitBounds"), false);
  assert.equal(closeBlock.includes("flyTo"), false);
});

test("clique em rua mantém a mesma seleção ou troca diretamente para outra", () => {
  assert.equal(pavingSelectionAfterSegmentClick("T05", "T05"), "T05");
  assert.equal(pavingSelectionAfterSegmentClick("T05", "T06"), "T06");
});

test("clique vazio é distinguido de pavimentação, drenagem e saneamento", () => {
  assert.equal(isEmptyInteractiveMapClick(0), true);
  assert.equal(isEmptyInteractiveMapClick(1), false);
  assert.equal(isEmptyInteractiveMapClick(3), false);
});

test("Escape só limpa trecho sem overlay ou campo editável ativo", () => {
  const base = { key: "Escape", hasSelectedSegment: true, hasOpenOverlay: false, hasEditableTarget: false };
  assert.equal(shouldClearPavingSelectionOnEscape(base), true);
  assert.equal(shouldClearPavingSelectionOnEscape({ ...base, hasSelectedSegment: false }), false);
  assert.equal(shouldClearPavingSelectionOnEscape({ ...base, hasOpenOverlay: true }), false);
  assert.equal(shouldClearPavingSelectionOnEscape({ ...base, hasEditableTarget: true }), false);
  assert.equal(shouldClearPavingSelectionOnEscape({ ...base, key: "Enter" }), false);
});

test("clique vazio, Escape e X usam a limpeza central sem afetar câmera, camadas ou localização", () => {
  const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  assert.match(source, /map\.on\("click", \(event\) => \{/);
  assert.match(source, /isEmptyInteractiveMapClick\(renderedFeatures\.length\)\) clearSegmentSelection\(\)/);
  assert.match(source, /shouldClearPavingSelectionOnEscape/);
  assert.match(source, /onClose=\{clearSegmentSelection\}/);
  assert.match(source, /window\.removeEventListener\("keydown", handleKeyDown\)/);
  assert.equal(source.includes('map.on("mouseup",'), false);
  assert.equal(source.includes('map.on("touchend",'), false);
});
