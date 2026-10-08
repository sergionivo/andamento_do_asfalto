import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { drainageCoordinateToWgs84 } from "../src/config/drainage-crs";
import { officialDrainageNodes } from "../src/data/drainage-nodes.official";
import { officialDrainageSegments } from "../src/data/drainage-segments.official";
import { buildDrainageGeoJson, buildPublicDrainageLayer, DRAINAGE_PUBLIC_DEFAULT_VISIBLE, validateProjectDrainage } from "../src/lib/drainage-data";
import { selectDrainage, selectPaving } from "../src/lib/public-map-selection";
import { buildPublicMapData } from "../src/lib/public-map-data";
import type { DrainageGeoJsonCollection } from "../src/types/drainage";
import type { ValidatedGeometryCollection } from "../src/types/official";

const generated = JSON.parse(readFileSync("src/data/generated/drainage.project.validated.geojson", "utf8")) as DrainageGeoJsonCollection;
const expectedIds = [...Array.from({ length: 13 }, (_, index) => `T-${String(index + 1).padStart(2, "0")}`), ...Array.from({ length: 9 }, (_, index) => `T-${String(index + 15).padStart(2, "0")}`)];

test("drenagem possui 24 nós, 22 trechos esperados e não possui T-14", () => {
  assert.equal(officialDrainageNodes.length, 24);
  assert.equal(officialDrainageSegments.length, 22);
  assert.deepEqual(officialDrainageSegments.map((segment) => segment.id), expectedIds);
  assert.equal(officialDrainageSegments.some((segment) => segment.id === "T-14"), false);
});

test("todos os trechos referenciam nós válidos da mesma bacia", () => {
  const nodes = new Map(officialDrainageNodes.map((node) => [node.id, node]));
  for (const segment of officialDrainageSegments) {
    const start = nodes.get(segment.startNode);
    const end = nodes.get(segment.endNode);
    assert.ok(start, `${segment.id}: nó inicial inválido`);
    assert.ok(end, `${segment.id}: nó final inválido`);
    assert.equal(start.basin, segment.basin);
    assert.equal(end.basin, segment.basin);
  }
  assert.notEqual(nodes.get("PV0_BACIA01")?.id, nodes.get("PV0_BACIA02")?.id);
});

test("GeoJSON é reproduzível, não contém coordenadas vazias nem conexões artificiais", () => {
  assert.deepEqual(generated, buildDrainageGeoJson());
  const nodes = new Map(generated.features.filter((feature) => feature.properties.featureType === "node").map((feature) => [feature.properties.id, feature.geometry.coordinates]));
  for (const feature of generated.features.filter((item) => item.properties.featureType === "segment")) {
    assert.equal(feature.geometry.type, "LineString");
    assert.equal(feature.geometry.coordinates.length, 2);
    assert.deepEqual(feature.geometry.coordinates[0], nodes.get(feature.properties.startNode!));
    assert.deepEqual(feature.geometry.coordinates[1], nodes.get(feature.properties.endNode!));
  }
});

test("comprimento calculado é comparado, sem substituir valor oficial", () => {
  const segments = generated.features.filter((feature) => feature.properties.featureType === "segment");
  for (const feature of segments) {
    assert.ok((feature.properties.calculatedLengthMeters ?? 0) > 0);
    if (feature.properties.officialLengthMeters == null) assert.equal(feature.properties.lengthDifferenceMeters, null);
    else assert.equal(feature.properties.lengthDifferenceMeters, Number((feature.properties.calculatedLengthMeters! - feature.properties.officialLengthMeters).toFixed(2)));
  }
  assert.equal(segments.find((feature) => feature.properties.id === "T-11")?.properties.officialLengthMeters, null);
});

test("PV1 transformado pelo CRS candidato cai no entorno cartográfico esperado", () => {
  const [longitude, latitude] = drainageCoordinateToWgs84(743841.171, 7734608.489);
  assert.ok(longitude > -54.67 && longitude < -54.65, `longitude inesperada: ${longitude}`);
  assert.ok(latitude > -20.48 && latitude < -20.46, `latitude inesperada: ${latitude}`);
});

test("arquivo canônico congelado possui integridade e status públicos corretos", () => {
  assert.deepEqual(validateProjectDrainage(generated), []);
  assert.equal(existsSync("src/data/generated/drainage.validated.geojson"), false);
  const segments = generated.features.filter((feature) => feature.properties.featureType === "segment");
  assert.ok(segments.every((feature) => feature.properties.geometryStatus === "validated"));
  assert.ok(segments.every((feature) => feature.properties.projectStatus === "prevista"));
  assert.ok(segments.every((feature) => feature.properties.executionStatus === "sem_informacao"));
  assert.equal(segments.some((feature) => ["concluida", "executada", "em_execucao"].includes(String(feature.properties.executionStatus))), false);
});

test("home recebe 22 trechos e os 24 nós reais validados, sem pontos sintéticos ou mocks", () => {
  const publicLayer = buildPublicDrainageLayer(generated);
  assert.equal(DRAINAGE_PUBLIC_DEFAULT_VISIBLE, false);
  assert.equal(publicLayer.features.filter((feature) => feature.properties.featureType === "segment").length, 22);
  const publicNodes = publicLayer.features.filter((feature) => feature.properties.featureType === "node");
  const canonicalNodes = generated.features.filter((feature) => feature.properties.featureType === "node");
  assert.equal(publicNodes.length, 24);
  assert.deepEqual(publicNodes, canonicalNodes);
  assert.equal(JSON.stringify(publicLayer).toLowerCase().includes("mock"), false);
});

test("seleções de drenagem e pavimentação são discriminadas e independentes", () => {
  const drainage = buildPublicDrainageLayer(generated).features[0].properties;
  const pavingValidated = JSON.parse(readFileSync("src/data/generated/paving-segments.validated.geojson", "utf8")) as ValidatedGeometryCollection;
  const paving = buildPublicMapData(pavingValidated).features[0].properties;
  assert.equal(selectDrainage(drainage).type, "drainage");
  assert.equal(selectPaving(paving).type, "paving");
  assert.equal(pavingValidated.features.length, 14);
});
