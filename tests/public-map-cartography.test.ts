import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { PUBLIC_MAP_STYLE, hasTechnicalOverlay, pavingVisualStyle } from "../src/config/public-map-style";
import { buildPublicDrainageLayer } from "../src/lib/drainage-data";
import type { DrainageGeoJsonCollection } from "../src/types/drainage";

test("pavimentação alterna entre default e contexto técnico", () => {
  assert.equal(hasTechnicalOverlay({ drainageVisible: false, waterVisible: false, sewerVisible: false }), false);
  assert.equal(pavingVisualStyle(false).opacity, 0.95);
  assert.equal(hasTechnicalOverlay({ drainageVisible: true, waterVisible: false, sewerVisible: false }), true);
  assert.equal(hasTechnicalOverlay({ drainageVisible: false, waterVisible: true, sewerVisible: false }), true);
  assert.equal(hasTechnicalOverlay({ drainageVisible: false, waterVisible: false, sewerVisible: true }), true);
  assert.equal(pavingVisualStyle(true).opacity, 0.32);
  assert.deepEqual(pavingVisualStyle(false).width, PUBLIC_MAP_STYLE.paving.defaultWidth);
});

test("água e esgoto usam offsets opostos e drenagem permanece central", () => {
  assert.ok(PUBLIC_MAP_STYLE.sanitation.waterOffset < 0);
  assert.ok(PUBLIC_MAP_STYLE.sanitation.sewerOffset > 0);
  assert.equal(Math.abs(PUBLIC_MAP_STYLE.sanitation.waterOffset), Math.abs(PUBLIC_MAP_STYLE.sanitation.sewerOffset));
  const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  const drainageLayer = source.slice(source.indexOf("id: DRAINAGE_LINE_ID"), source.indexOf("id: SEWER_SELECTED_ID"));
  assert.equal(drainageLayer.includes("line-offset"), false);
});

test("PVs públicos são somente os 24 nós reais do dataset canônico", () => {
  const canonical = JSON.parse(readFileSync("src/data/generated/drainage.project.validated.geojson", "utf8")) as DrainageGeoJsonCollection;
  const canonicalNodes = canonical.features.filter((feature) => feature.properties.featureType === "node");
  const publicNodes = buildPublicDrainageLayer(canonical).features.filter((feature) => feature.properties.featureType === "node");
  assert.equal(publicNodes.length, 24);
  assert.deepEqual(publicNodes, canonicalNodes);
});

test("ordem visual mantém highlight abaixo das redes técnicas e PVs acima das linhas", () => {
  const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  const paving = source.indexOf("id: LINE_LAYER_ID");
  const highlight = source.indexOf("id: SELECTED_LAYER_ID");
  const water = source.indexOf("id: WATER_LINE_ID");
  const drainage = source.indexOf("id: DRAINAGE_LINE_ID");
  const sewer = source.indexOf("id: SEWER_LINE_ID");
  const nodes = source.indexOf("id: DRAINAGE_NODE_ID");
  assert.ok(paving < highlight);
  assert.ok(highlight < water);
  assert.ok(water < drainage);
  assert.ok(drainage < sewer);
  assert.ok(sewer < nodes);
});

test("desligar todas as redes restaura explicitamente o estilo normal", () => {
  const visibility = { drainageVisible: false, waterVisible: false, sewerVisible: false };
  assert.equal(hasTechnicalOverlay(visibility), false);
  assert.deepEqual(pavingVisualStyle(hasTechnicalOverlay(visibility)), {
    opacity: PUBLIC_MAP_STYLE.paving.defaultOpacity,
    width: PUBLIC_MAP_STYLE.paving.defaultWidth,
  });
});
