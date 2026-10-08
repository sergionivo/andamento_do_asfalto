import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { buildPublicMapData, validateValidatedGeometryData } from "../src/lib/public-map-data";
import type { ValidatedGeometryCollection } from "../src/types/official";
import type { OsmCandidateCollection } from "../src/types/official";
import type { SanitationCollection } from "../src/types/sanitation";
import { publicSanitationVisibility, SANITATION_PUBLIC_DEFAULT_VISIBLE, validateCanonicalSanitation } from "../src/lib/sanitation-data";

const validatedPath = "src/data/generated/paving-segments.validated.geojson";
const validated = JSON.parse(readFileSync(validatedPath, "utf8")) as ValidatedGeometryCollection;
const publicMap = buildPublicMapData(validated);
const water = JSON.parse(readFileSync("src/data/generated/water-network.reference.validated.geojson", "utf8")) as SanitationCollection;
const sewer = JSON.parse(readFileSync("src/data/generated/sewer-network.reference.validated.geojson", "utf8")) as SanitationCollection;
const sanitationCandidates = JSON.parse(readFileSync("src/data/generated/osm-sanitation-corridors.geojson", "utf8")) as OsmCandidateCollection;

test("arquivo validado preserva os 14 eixos T01–T14 com proveniência e soma oficial", () => {
  assert.deepEqual(validateValidatedGeometryData(validated), []);
  assert.deepEqual(
    validated.features.map((feature) => feature.properties.axisId).sort(),
    Array.from({ length: 14 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`),
  );
});

test("home é construída exclusivamente com os 14 vetores validados", () => {
  assert.equal(publicMap.features.length, 14);
  assert.equal(publicMap.features.some((feature) => "mock" in feature.properties), false);
  for (const feature of publicMap.features) {
    const source = validated.features.find((item) => item.properties.axisId === feature.properties.axisId);
    assert.ok(source);
    assert.deepEqual(feature.geometry, source.geometry);
  }
});

test("todos os trechos começam sem informação e validação geométrica não implica conclusão", () => {
  assert.ok(publicMap.features.every((feature) => feature.properties.status === "no_public_update"));
  assert.equal(publicMap.features.some((feature) => feature.properties.status === "concluida"), false);
  assert.ok(publicMap.features.every((feature) => feature.properties.operationalState.currentStage === null));
  assert.ok(publicMap.features.every((feature) => feature.properties.operationalState.lastUpdatedAt === null));
  assert.ok(publicMap.features.every((feature) => feature.properties.events.length === 0));
});

test("T01 mantém a extensão oficial conjunta e a soma pública é 3350,07 m", () => {
  const t01 = publicMap.features.find((feature) => feature.properties.axisId === "T01");
  assert.ok(t01);
  assert.equal(t01.properties.officialLengthMeters, 988.63);
  assert.equal(t01.properties.components.length, 0);
  const total = Number(publicMap.features.reduce((sum, feature) => sum + feature.properties.officialLengthMeters, 0).toFixed(2));
  assert.equal(total, 3350.07);
});

test("home usa exatamente os datasets canônicos validados de saneamento", () => {
  assert.deepEqual(validateCanonicalSanitation(water, "water", sanitationCandidates.features), []);
  assert.deepEqual(validateCanonicalSanitation(sewer, "sewer", sanitationCandidates.features), []);
  assert.equal(water.features.length, 30);
  assert.equal(new Set(water.features.map((feature) => feature.properties.osmWayId)).size, 27);
  assert.equal(sewer.features.length, 25);
  assert.equal(new Set(sewer.features.map((feature) => feature.properties.osmWayId)).size, 24);
  assert.ok([...water.features, ...sewer.features].every((feature) => feature.properties.interferenceStatus === "not_assessed" && feature.properties.blockageStatus === "not_assessed"));
});

test("saneamento inicia desligado e água/esgoto possuem controles independentes", () => {
  assert.equal(SANITATION_PUBLIC_DEFAULT_VISIBLE, false);
  assert.deepEqual(publicSanitationVisibility(false, true, true), { water: false, sewer: false });
  assert.deepEqual(publicSanitationVisibility(true, true, true), { water: true, sewer: true });
  assert.deepEqual(publicSanitationVisibility(true, false, true), { water: false, sewer: true });
  assert.deepEqual(publicSanitationVisibility(true, true, false), { water: true, sewer: false });
});

test("home não usa geometria mock para saneamento e preserva pavimentação/drenagem", () => {
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.equal(home.includes("paving-segments.mock"), false);
  assert.equal(home.includes("water-network.reference.validated.geojson"), true);
  assert.equal(home.includes("sewer-network.reference.validated.geojson"), true);
  assert.equal(publicMap.features.length, 14);
});
