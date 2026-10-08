import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { PUBLIC_WORK_COPY } from "../src/config/public-work-copy";
import { buildPublicMapData } from "../src/lib/public-map-data";
import { formatApproximateLength } from "../src/lib/public-formatters";
import type { ValidatedGeometryCollection } from "../src/types/official";

test("formatter cidadão arredonda comprimentos para dezenas", () => {
  assert.equal(formatApproximateLength(202.85), "aproximadamente 200 metros");
  assert.equal(formatApproximateLength(270.32), "aproximadamente 270 metros");
  assert.equal(formatApproximateLength(988.63), "aproximadamente 990 metros");
  assert.equal(formatApproximateLength(61.55), "aproximadamente 60 metros");
});

test("formatter não altera o valor técnico original", () => {
  const technicalLength = 202.85;
  formatApproximateLength(technicalLength);
  assert.equal(technicalLength, 202.85);
});

test("trecho incluído sem eventos separa escopo de andamento", () => {
  const validated = JSON.parse(readFileSync("src/data/generated/paving-segments.validated.geojson", "utf8")) as ValidatedGeometryCollection;
  const segment = buildPublicMapData(validated).features[0].properties;
  assert.equal(segment.scopeStatus, "included");
  assert.equal(segment.operationalStatus, "no_public_update");
  assert.equal(PUBLIC_WORK_COPY.scope[segment.scopeStatus].label, "Prevista na obra");
  assert.equal(PUBLIC_WORK_COPY.operational[segment.operationalStatus]?.label, "Sem atualização pública");
  assert.notEqual(PUBLIC_WORK_COPY.operational[segment.operationalStatus]?.label, "Aguardando início");
});

test("card resumido omite campos vazios e detalhes mantêm campos completos", () => {
  const source = readFileSync("src/components/map/SegmentDetails.tsx", "utf8");
  assert.match(source, /state\.currentStage && <section>/);
  assert.match(source, /state\.currentResponsible && <section>/);
  assert.match(source, /Detalhes completos/);
  for (const field of ["Situação no projeto", "Andamento", "Etapa atual", "Responsável atual", "Bloqueio", "Previsão", "Última atualização", "Fonte"]) assert.ok(source.includes(field));
});
