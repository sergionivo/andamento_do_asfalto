import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEditingLines,
  buildEditingGeometry,
  editingGeometryIntegrity,
  editingLinesLengthMeters,
  lineLengthMeters,
  selectedWaysLengthMeters,
} from "../src/lib/geometry-editing";
import type { OsmCandidateCollection, OsmCandidateFeature } from "../src/types/official";

const candidates = JSON.parse(
  readFileSync("src/data/generated/osm-street-candidates.geojson", "utf8"),
) as OsmCandidateCollection;

function candidate(osmId: string): OsmCandidateFeature {
  const feature = candidates.features.find((item) => item.properties.osmId === osmId);
  assert.ok(feature, `Candidato ${osmId} deve existir.`);
  return feature;
}

const mariaLucia = candidate("way/154525570");
const doutorGermano = candidate("way/154525554");

test("ways distintos contribuem exatamente uma vez para o comprimento combinado", () => {
  const expected = lineLengthMeters(mariaLucia.geometry.coordinates)
    + lineLengthMeters(doutorGermano.geometry.coordinates);
  const lines = buildEditingLines([mariaLucia, doutorGermano], null, null);
  const actual = editingLinesLengthMeters(lines);

  assert.equal(lines.length, 2);
  assert.ok(Math.abs(actual - expected) < 0.01, `Esperado ${expected}, obtido ${actual}.`);
  assert.ok(Math.abs(actual - 986.45) < 0.02, `T01 deve medir aproximadamente 986,45 m; obtido ${actual}.`);
});

test("o mesmo osmWayId selecionado duas vezes não duplica o comprimento", () => {
  const expected = lineLengthMeters(mariaLucia.geometry.coordinates);
  const actual = selectedWaysLengthMeters([mariaLucia, mariaLucia]);

  assert.ok(Math.abs(actual - expected) < 0.01, `Esperado ${expected}, obtido ${actual}.`);
});

test("full_ways preserva T01 como duas linhas sem criar conector", () => {
  const result = buildEditingGeometry([mariaLucia, doutorGermano], null, null, "full_ways");

  assert.equal(result.error, null);
  assert.deepEqual(result.lines, [mariaLucia.geometry.coordinates, doutorGermano.geometry.coordinates]);
  assert.equal(editingGeometryIntegrity(result.lines, result.lines).valid, true);
});

test("A e B em componentes diferentes não criam segmento fora das ruas originais", () => {
  const first = mariaLucia.geometry.coordinates;
  const second = doutorGermano.geometry.coordinates;
  const result = buildEditingGeometry(
    [mariaLucia, doutorGermano],
    first[Math.floor(first.length / 2)],
    second[Math.floor(second.length / 2)],
    "trimmed",
  );

  assert.match(result.error ?? "", /mais de uma geometria/);
  assert.deepEqual(result.lines, [first, second]);
  assert.equal(editingGeometryIntegrity(result.lines, [first, second]).valid, true);
});

test("verificação de integridade rejeita um conector entre duas ruas", () => {
  const first = mariaLucia.geometry.coordinates;
  const second = doutorGermano.geometry.coordinates;
  const connector = [first.at(-1)!, second[0]];
  const integrity = editingGeometryIntegrity([first, connector, second], [first, second]);

  assert.equal(integrity.valid, false);
  assert.match(integrity.error ?? "", /integridade/);
});
