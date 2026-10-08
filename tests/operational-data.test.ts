import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { operationalEvents } from "../src/data/operational-events";
import { segmentOperationalStates } from "../src/data/segment-operational-state";
import { getSegmentEvents, getSegmentOperationalState } from "../src/lib/operational-data";
import type { WorkEvent } from "../src/types/operational";

const event = (overrides: Partial<WorkEvent> = {}): WorkEvent => ({ id: "event-1", segmentId: "T01", date: "2026-10-01", eventType: "status_update", stage: "preparacao_mobilizacao", status: "em_preparacao", title: "Atualização oficial", description: "Registro identificado para teste.", responsibleParty: "Órgão responsável", dependency: null, blockage: null, nextAction: "Mobilizar equipe", nextStage: "remocoes", forecast: { type: "official", value: "Outubro de 2026" }, evidenceType: "Documento oficial", sourceTitle: "Boletim oficial", sourceUrl: null, sourceDate: "2026-10-01", classification: "official", createdAt: "2026-10-01T12:00:00Z", ...overrides });

test("arquivo inicial vazio produz Sem atualização pública para os 14 eixos", () => {
  assert.deepEqual(operationalEvents, []);
  assert.equal(segmentOperationalStates.length, 14);
  for (const state of segmentOperationalStates) { assert.equal(state.currentStatus, "no_public_update"); assert.equal(state.currentStage, null); assert.equal(state.forecastType, "sem_previsao_divulgada"); assert.equal(state.lastUpdatedAt, null); }
});

test("evento oficial mais recente atualiza o estado e eventos antigos permanecem no histórico", () => {
  const old = event({ id: "old", date: "2026-09-01", status: "prevista", stage: null, createdAt: "2026-09-01T12:00:00Z" });
  const recent = event({ id: "recent" });
  const events = getSegmentEvents("T01", [old, recent]);
  assert.deepEqual(events.map((item) => item.id), ["recent", "old"]);
  const state = getSegmentOperationalState("T01", [old, recent]);
  assert.equal(state.currentStatus, "em_preparacao"); assert.equal(state.lastEvidenceId, "recent");
});

test("bloqueio só aparece quando existe evento explícito", () => {
  assert.equal(getSegmentOperationalState("T01", [event()]).blockage, null);
  assert.equal(getSegmentOperationalState("T01", [event({ eventType: "blockage", status: "bloqueada", blockage: "Impedimento documentado" })]).blockage, "Impedimento documentado");
  assert.equal(getSegmentOperationalState("T01", []).blockage, null);
});

test("previsão oficial e estimativa do projeto permanecem distintas", () => {
  assert.equal(getSegmentOperationalState("T01", [event({ forecast: { type: "official", value: "2026" } })]).forecastType, "official");
  assert.equal(getSegmentOperationalState("T01", [event({ forecast: { type: "project_estimate", value: "4 semanas" }, classification: "project_estimate" })]).forecastType, "project_estimate");
});

test("água, esgoto e ausência de eventos nunca geram bloqueio operacional", () => {
  const water = JSON.parse(readFileSync("src/data/generated/water-network.reference.validated.geojson", "utf8"));
  const sewer = JSON.parse(readFileSync("src/data/generated/sewer-network.reference.validated.geojson", "utf8"));
  assert.ok(water.features.length > 0 && sewer.features.length > 0);
  assert.equal(getSegmentOperationalState("T01").blockage, null);
});

test("geometrias cartográficas congeladas permanecem intactas", () => {
  const expected: Record<string, string> = { "src/data/generated/paving-segments.validated.geojson": "2aa92743705d22820ab0981f96d6cfd5781661c7", "src/data/generated/drainage.project.validated.geojson": "4914be691e8da57f7fa6bb763c497a8c2eb38bb3", "src/data/generated/water-network.reference.validated.geojson": "4c9c7aaec030e8655c0e72af381931d862b99d34", "src/data/generated/sewer-network.reference.validated.geojson": "9dd0a94b9647780ff70b1cfe6a3c6db56d3b552c" };
  for (const [file, hash] of Object.entries(expected)) assert.equal(createHash("sha1").update(readFileSync(file)).digest("hex"), hash);
});
