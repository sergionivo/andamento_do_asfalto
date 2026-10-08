import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { buildSanitationFeature, sanitationSegmentsAdjacent, sanitationSegmentsOverlap, validateSanitationFeature } from "../src/lib/sanitation-geometry";
import { appendSanitationDraftFragment, applySanitationEndpointClick, cancelSanitationEditing, closeSanitationCorridor, INITIAL_SANITATION_UI_STATE, sanitationCtaLabel, sanitationDraftGeometry, sanitationEndpointFeatures, selectSanitationCorridor, startSanitationEditing, type SanitationDraft } from "../src/lib/sanitation-editor";
import { mergeSanitationFeatures, removeSanitationFeature } from "../src/lib/sanitation-store";
import type { DrainageGeoJsonCollection } from "../src/types/drainage";
import type { OsmCandidateCollection, ValidatedGeometryCollection } from "../src/types/official";
import type { SanitationCollection } from "../src/types/sanitation";

const candidates = JSON.parse(readFileSync("src/data/generated/osm-sanitation-corridors.geojson", "utf8")) as OsmCandidateCollection;
const candidate = candidates.features.find((feature) => feature.geometry.coordinates.length >= 6) ?? candidates.features[0];
const draft = (networkType: "water" | "sewer" = "water"): SanitationDraft => ({ networkType, candidate, start: null, end: null, fragments: [] });

test("feature de limites foi removida por completo e não aparece na home", () => {
  const removed = ["src/app/dev/limites/page.tsx", "src/app/api/dev/territory-boundaries/route.ts", "src/components/map/TerritoryBoundaryEditor.tsx", "src/types/territory.ts", "src/data/generated/territory-boundaries.project.validated.geojson"];
  assert.ok(removed.every((file) => !existsSync(file)));
  assert.equal(readFileSync("src/components/map/MapLayersControl.tsx", "utf8").includes("Limites Oliveira"), false);
});

test("pavimentação e drenagem preservam 14 e 22 trechos", () => {
  const paving = JSON.parse(readFileSync("src/data/generated/paving-segments.validated.geojson", "utf8")) as ValidatedGeometryCollection;
  const drainage = JSON.parse(readFileSync("src/data/generated/drainage.project.validated.geojson", "utf8")) as DrainageGeoJsonCollection;
  assert.equal(paving.features.length, 14);
  assert.equal(drainage.features.filter((feature) => feature.properties.featureType === "segment").length, 22);
});

test("água e esgoto são datasets independentes e não contêm inferências", () => {
  const water = JSON.parse(readFileSync("src/data/generated/water-network.reference.validated.geojson", "utf8")) as SanitationCollection;
  const sewer = JSON.parse(readFileSync("src/data/generated/sewer-network.reference.validated.geojson", "utf8")) as SanitationCollection;
  assert.notEqual(water, sewer);
  assert.equal(water.features.length, 30);
  assert.equal(sewer.features.length, 24);
  for (const feature of [...water.features, ...sewer.features]) {
    assert.equal(feature.properties.interferenceStatus, "not_assessed");
    assert.equal(feature.properties.blockageStatus, "not_assessed");
  }
});

test("validação exige proveniência, precisão referencial e nunca infere bloqueio ou interferência", () => {
  const feature = buildSanitationFeature("water", candidate, candidate.geometry.coordinates, "validated");
  assert.deepEqual(validateSanitationFeature(feature, candidates.features), []);
  assert.equal(feature.properties.precisionClassification, "reference_corridor");
  assert.equal(feature.properties.interferenceStatus, "not_assessed");
  assert.equal(feature.properties.blockageStatus, "not_assessed");
  const invalid = structuredClone(feature);
  Object.assign(invalid.properties, { source: "", precisionClassification: "exact", interferenceStatus: "confirmed", blockageStatus: "confirmed" });
  assert.match(validateSanitationFeature(invalid, candidates.features).join(" "), /Proveniência/);
  assert.match(validateSanitationFeature(invalid, candidates.features).join(" "), /reference_corridor/);
  assert.match(validateSanitationFeature(invalid, candidates.features).join(" "), /não podem ser inferidos/);
});

test("geometria com conector fora do way original é rejeitada", () => {
  const coordinates = [...candidate.geometry.coordinates, [-54.7, -20.5] as [number, number]];
  const feature = buildSanitationFeature("sewer", candidate, coordinates, "validated");
  assert.match(validateSanitationFeature(feature, candidates.features).join(" "), /integridade|não pertence/);
});

test("um way aceita um segmento único, way completo, dois e três fragmentos descontínuos", () => {
  const original = candidate.geometry.coordinates;
  const a = [original[0], original[1]];
  const b = [original.at(-2)!, original.at(-1)!];
  const middle = original.length > 4 ? [original[2], original[3]] : [original[0], original[1]];
  const single = buildSanitationFeature("water", candidate, a, "validated", 1, "trimmed");
  const full = buildSanitationFeature("water", candidate, original, "validated", 1, "full_way");
  const two = [buildSanitationFeature("sewer", candidate, a, "validated", 1, "trimmed"), buildSanitationFeature("sewer", candidate, b, "validated", 2, "trimmed")];
  const three = [...two, buildSanitationFeature("sewer", candidate, middle, "validated", 3, "trimmed")];
  assert.equal(single.properties.segmentIndex, 1); assert.equal(full.properties.geometryMode, "full_way"); assert.equal(two.length, 2); assert.equal(three.length, 3);
  assert.ok(two.every((feature) => feature.geometry.type === "LineString"));
});

test("água completa e esgoto fragmentado permanecem independentes no mesmo way", () => {
  const original = candidate.geometry.coordinates; const waterFeature = buildSanitationFeature("water", candidate, original, "validated", 1, "full_way");
  const sewerFeature = buildSanitationFeature("sewer", candidate, [original[0], original[1]], "validated", 1, "trimmed");
  assert.equal(waterFeature.properties.networkType, "water"); assert.equal(sewerFeature.properties.networkType, "sewer"); assert.notDeepEqual(waterFeature.geometry, sewerFeature.geometry);
});

test("adicionar segundo segmento faz append e remover o segundo preserva o primeiro", () => {
  const original = candidate.geometry.coordinates; const first = buildSanitationFeature("sewer", candidate, [original[0], original[1]], "validated", 1, "trimmed"); const second = buildSanitationFeature("sewer", candidate, [original.at(-2)!, original.at(-1)!], "validated", 2, "trimmed");
  const appended = mergeSanitationFeatures({ type: "FeatureCollection", features: [first] }, [second]); assert.deepEqual(appended.features.map((feature) => feature.properties.id), [first.properties.id, second.properties.id]);
  const removed = removeSanitationFeature(appended, second.properties.id); assert.deepEqual(removed.features.map((feature) => feature.properties.id), [first.properties.id]);
});

test("fragmentos não criam conector e o intervalo sem rede permanece vazio", () => {
  const original = candidate.geometry.coordinates; const first = [original[0], original[1]]; const second = [original.at(-2)!, original.at(-1)!];
  const collection = [buildSanitationFeature("sewer", candidate, first, "validated", 1, "trimmed"), buildSanitationFeature("sewer", candidate, second, "validated", 2, "trimmed")];
  assert.deepEqual(collection[0].geometry.coordinates, first); assert.deepEqual(collection[1].geometry.coordinates, second); assert.equal(collection.some((feature) => feature.geometry.coordinates.includes(original[Math.floor(original.length / 2)])), false);
});

test("sobreposição é detectada e adjacência não une segmentos automaticamente", () => {
  const original = candidate.geometry.coordinates; const whole = original; const beginning = [original[0], original[1]];
  assert.equal(sanitationSegmentsOverlap(whole, beginning, original), true);
  const adjacentA = [original[0], original[1]]; const adjacentB = [original[1], original[2] ?? original.at(-1)!];
  assert.equal(sanitationSegmentsAdjacent(adjacentA, adjacentB, original), true); assert.deepEqual(adjacentA, [original[0], original[1]]); assert.deepEqual(adjacentB, [original[1], original[2] ?? original.at(-1)!]);
});

test("migração preservou todas as geometrias e adicionou identidade de segmento", () => {
  const water = JSON.parse(readFileSync("src/data/generated/water-network.reference.validated.geojson", "utf8")) as SanitationCollection; const sewer = JSON.parse(readFileSync("src/data/generated/sewer-network.reference.validated.geojson", "utf8")) as SanitationCollection;
  assert.equal(water.features.length, 30); assert.equal(sewer.features.length, 24);
  for (const feature of [...water.features, ...sewer.features]) { assert.ok(Number.isInteger(feature.properties.segmentIndex)); assert.ok(feature.properties.segmentIndex >= 1); assert.match(feature.properties.id, /-\d{2}$/); assert.ok(["full_way", "trimmed"].includes(feature.properties.geometryMode)); }
});

test("clique no way em modo A cria e exibe A e avança para B", () => {
  const clicked = candidate.geometry.coordinates[1];
  const result = applySanitationEndpointClick(draft(), "start", clicked, candidate.properties.osmId);
  assert.ok(result);
  assert.deepEqual(result.draft.start, clicked);
  assert.equal(result.draft.end, null);
  assert.equal(result.nextMode, "end");
  assert.deepEqual(sanitationEndpointFeatures(result.draft).features.map((feature) => feature.properties.label), ["A"]);
});

test("clique no way em modo B cria B e produz geometria A → B válida", () => {
  const withA = applySanitationEndpointClick(draft(), "start", candidate.geometry.coordinates[1], candidate.properties.osmId)!;
  const withB = applySanitationEndpointClick(withA.draft, "end", candidate.geometry.coordinates[4], candidate.properties.osmId);
  assert.ok(withB);
  assert.ok(withB.draft.end);
  assert.equal(withB.nextMode, null);
  assert.deepEqual(sanitationEndpointFeatures(withB.draft).features.map((feature) => feature.properties.label), ["A", "B"]);
  assert.ok((sanitationDraftGeometry(withB.draft)?.length ?? 0) >= 2);
});

test("clique fora do corredor selecionado não cria ponto e extremos coincidentes são rejeitados", () => {
  assert.equal(applySanitationEndpointClick(draft(), "start", candidate.geometry.coordinates[1], "way/outro"), null);
  const withA = applySanitationEndpointClick(draft(), "start", candidate.geometry.coordinates[1], candidate.properties.osmId)!;
  const tooClose = applySanitationEndpointClick(withA.draft, "end", candidate.geometry.coordinates[1], candidate.properties.osmId);
  assert.ok(tooClose);
  assert.equal(tooClose.draft.end, null);
  assert.equal(tooClose.nextMode, "end");
  assert.match(tooClose.error ?? "", /muito próximos/);
});

test("adicionar segundo trecho mantém o primeiro e ambos permanecem independentes", () => {
  const firstEndpoints = applySanitationEndpointClick(
    applySanitationEndpointClick(draft(), "start", candidate.geometry.coordinates[0], candidate.properties.osmId)!.draft,
    "end", candidate.geometry.coordinates[1], candidate.properties.osmId,
  )!.draft;
  const first = appendSanitationDraftFragment(firstEndpoints, sanitationDraftGeometry(firstEndpoints)!);
  const secondEndpoints = applySanitationEndpointClick(
    applySanitationEndpointClick(first, "start", candidate.geometry.coordinates[3], candidate.properties.osmId)!.draft,
    "end", candidate.geometry.coordinates[4], candidate.properties.osmId,
  )!.draft;
  const second = appendSanitationDraftFragment(secondEndpoints, sanitationDraftGeometry(secondEndpoints)!);
  assert.equal(second.fragments.length, 2);
  assert.notDeepEqual(second.fragments[0].coordinates, second.fragments[1].coordinates);
});

test("água e esgoto mantêm rascunhos A/B independentes", () => {
  const waterDraft = applySanitationEndpointClick(draft("water"), "start", candidate.geometry.coordinates[1], candidate.properties.osmId)!.draft;
  const sewerDraft = draft("sewer");
  const drafts = { water: waterDraft, sewer: sewerDraft };
  assert.ok(drafts.water.start);
  assert.equal(drafts.sewer.start, null);
  assert.equal(drafts.water.networkType, "water");
  assert.equal(drafts.sewer.networkType, "sewer");
});

test("usar way completo continua criando um segmento integral", () => {
  const full = buildSanitationFeature("water", candidate, candidate.geometry.coordinates, "validated", 1, "full_way");
  assert.equal(full.properties.geometryMode, "full_way");
  assert.deepEqual(full.geometry.coordinates, candidate.geometry.coordinates);
});

test("corredor sem água ou esgoto pode ser selecionado sem iniciar edição", () => {
  const water = JSON.parse(readFileSync("src/data/generated/water-network.reference.validated.geojson", "utf8")) as SanitationCollection;
  const sewer = JSON.parse(readFileSync("src/data/generated/sewer-network.reference.validated.geojson", "utf8")) as SanitationCollection;
  const occupied = new Set([...water.features, ...sewer.features].map((feature) => feature.properties.osmWayId));
  const emptyCorridor = candidates.features.find((feature) => !occupied.has(feature.properties.osmId));
  assert.ok(emptyCorridor);
  const result = selectSanitationCorridor(INITIAL_SANITATION_UI_STATE, emptyCorridor.properties.osmId, false);
  assert.equal(result.state.selectedCorridorId, emptyCorridor.properties.osmId);
  assert.equal(result.state.editingNetwork, null);
  assert.equal(result.state.draftMode, "idle");
});

test("fechar, clique vazio e Escape em idle retornam ao estado inicial", () => {
  const selected = selectSanitationCorridor(INITIAL_SANITATION_UI_STATE, candidate.properties.osmId, false).state;
  assert.deepEqual(closeSanitationCorridor(), INITIAL_SANITATION_UI_STATE);
  assert.notDeepEqual(selected, INITIAL_SANITATION_UI_STATE);
  assert.deepEqual(closeSanitationCorridor(), INITIAL_SANITATION_UI_STATE);
});

test("CTA diferencia rede vazia de rede que já possui segmentos", () => {
  assert.equal(sanitationCtaLabel("water", 0), "Adicionar trecho de água");
  assert.equal(sanitationCtaLabel("water", 1), "Adicionar outro trecho de água");
  assert.equal(sanitationCtaLabel("sewer", 0), "Adicionar trecho de esgoto");
  assert.equal(sanitationCtaLabel("sewer", 3), "Adicionar outro trecho de esgoto");
});

test("iniciar e cancelar água preserva o corredor e não altera esgoto", () => {
  const selected = selectSanitationCorridor(INITIAL_SANITATION_UI_STATE, candidate.properties.osmId, false).state;
  const editing = startSanitationEditing(selected, "water");
  assert.equal(editing.selectedCorridorId, candidate.properties.osmId);
  assert.equal(editing.editingNetwork, "water");
  assert.equal(editing.draftMode, "define_start");
  const cancelled = cancelSanitationEditing(editing);
  assert.equal(cancelled.selectedCorridorId, candidate.properties.osmId);
  assert.equal(cancelled.editingNetwork, null);
});

test("troca de corredor é direta sem draft e exige confirmação lógica com draft", () => {
  const first = selectSanitationCorridor(INITIAL_SANITATION_UI_STATE, candidate.properties.osmId, false).state;
  const other = candidates.features.find((feature) => feature.properties.osmId !== candidate.properties.osmId)!;
  const direct = selectSanitationCorridor(first, other.properties.osmId, false);
  assert.equal(direct.requiresConfirmation, false);
  assert.equal(direct.state.selectedCorridorId, other.properties.osmId);
  const guarded = selectSanitationCorridor(first, other.properties.osmId, true);
  assert.equal(guarded.requiresConfirmation, true);
  assert.deepEqual(guarded.state, first);
});

test("A/B aceita somente o corredor selecionado", () => {
  const waterDraft = draft("water");
  assert.equal(applySanitationEndpointClick(waterDraft, "start", candidate.geometry.coordinates[1], "way/outro"), null);
  assert.ok(applySanitationEndpointClick(waterDraft, "start", candidate.geometry.coordinates[1], candidate.properties.osmId));
});

test("datasets persistidos permanecem com 30 segmentos de água e 24 de esgoto", () => {
  const waterRaw = readFileSync("src/data/generated/water-network.reference.validated.geojson");
  const sewerRaw = readFileSync("src/data/generated/sewer-network.reference.validated.geojson");
  assert.equal((JSON.parse(waterRaw.toString()) as SanitationCollection).features.length, 30);
  assert.equal((JSON.parse(sewerRaw.toString()) as SanitationCollection).features.length, 24);
  assert.equal(createHash("sha256").update(JSON.stringify((JSON.parse(waterRaw.toString()) as SanitationCollection).features.map((feature) => feature.geometry))).digest("hex"), "a3cd32a07f676284d0aa362fb90ee2a36000d8a58ee627d8306e9e998a36f46c");
  assert.equal(createHash("sha256").update(JSON.stringify((JSON.parse(sewerRaw.toString()) as SanitationCollection).features.map((feature) => feature.geometry))).digest("hex"), "9b65d700a252582359dadcf21da2a2ece434f715b5716071ba46fbb5e08f71e7");
});
