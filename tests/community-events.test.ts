import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { communityEvents } from "../src/data/community-events";
import { submitCommunityContribution } from "../src/components/map/CommunityContributionForm";
import { getSegmentOperationalState } from "../src/lib/operational-data";
import { getLatestCommunityEvent, getSegmentTimeline, isSafeCommunityImagePath, validateCommunityEvents } from "../src/lib/community-events";
import type { CommunityEvent } from "../src/types/community";

const communityEvent = (overrides: Partial<CommunityEvent> = {}): CommunityEvent => ({
  id: "community-T04-2026-10-08-01",
  segmentId: "T04",
  observedAt: "2026-10-08",
  publishedAt: "2026-10-09T12:00:00Z",
  reviewedAt: "2026-10-09T11:00:00Z",
  observationType: "crew_or_machinery",
  title: "Atividade registrada no trecho",
  description: "Máquinas foram observadas durante a manhã.",
  classification: "community_report",
  reviewStatus: "reviewed",
  sourceLabel: "Registro da comunidade",
  ...overrides,
});

test("fonte canônica começa vazia e não publica submissões automaticamente", () => {
  assert.deepEqual(communityEvents, []);
});

test("evento comunitário aparece somente na timeline do segmento correto", () => {
  const event = communityEvent();
  assert.equal(getSegmentTimeline("T04", [], [event])[0]?.kind, "community");
  assert.equal(getSegmentTimeline("T03", [], [event]).length, 0);
  assert.equal(getLatestCommunityEvent("T04", [event])?.id, event.id);
});

test("ordenação usa data observada e preserva classificação", () => {
  const older = communityEvent({ id: "community-T04-2026-10-07-01", observedAt: "2026-10-07" });
  const newer = communityEvent();
  const timeline = getSegmentTimeline("T04", [], [older, newer]);
  assert.deepEqual(timeline.map((item) => item.event.id), [newer.id, older.id]);
  assert.equal(newer.classification, "community_report");
});

test("relatos comunitários nunca alteram estado operacional oficial", () => {
  const baseline = getSegmentOperationalState("T04", []);
  for (const observationType of ["asphalt_application", "apparently_stopped"] as const) {
    const event = communityEvent({ observationType });
    assert.equal(getSegmentTimeline("T04", [], [event]).length, 1);
    assert.deepEqual(getSegmentOperationalState("T04", []), baseline);
  }
  assert.equal(baseline.currentStatus, "no_public_update");
  assert.equal(baseline.currentStage, null);
  assert.equal(baseline.blockage, null);
  assert.equal(baseline.lastUpdatedAt, null);
});

test("validator aceita imagens locais seguras e rejeita paralisada e traversal", () => {
  const valid = communityEvent({ images: [{ src: "/community/T04/2026-10-08-01-01.webp", alt: "Rua vista durante a manhã" }] });
  assert.deepEqual(validateCommunityEvents([valid], new Set(["T04"])), []);
  assert.equal(isSafeCommunityImagePath("/community/T04/../segredo.webp", "T04"), false);
  const invalid = communityEvent({ observationType: "apparently_stopped", title: "Obra paralisada" });
  assert.match(validateCommunityEvents([invalid], new Set(["T04"]))[0], /não pode declarar obra paralisada/);
});

test("formulário contextual inclui CTA, rua readonly, segmentId, estados e privacidade", () => {
  const details = readFileSync("src/components/map/SegmentDetails.tsx", "utf8");
  const form = readFileSync("src/components/map/CommunityContributionForm.tsx", "utf8");
  assert.match(details, /Viu alguma mudança nesta rua\?/);
  assert.match(details, /Enviar atualização/);
  assert.match(form, /name="segmentId" value=\{segmentId\}/);
  assert.match(form, /name="streetLabel" value=\{streetLabel\} readOnly/);
  assert.match(form, /"idle" \| "submitting" \| "success" \| "error"/);
  assert.match(form, /Recebemos seu registro/);
  assert.match(form, /Nada será publicado automaticamente/);
  assert.equal(form.includes("dangerouslySetInnerHTML"), false);
  assert.equal(form.includes("latitude"), false);
  assert.equal(form.includes("longitude"), false);
});

test("timeline só renderiza fotos presentes e não conhece contato privado", () => {
  const timeline = readFileSync("src/components/map/SegmentTimeline.tsx", "utf8");
  const publicType = readFileSync("src/types/community.ts", "utf8");
  assert.match(timeline, /event\.images\?\.length/);
  assert.match(timeline, /Registro da comunidade/);
  assert.equal(timeline.includes("contact"), false);
  assert.equal(publicType.includes("contact"), false);
  assert.equal(publicType.includes("telefone"), false);
  assert.equal(publicType.includes("email"), false);
});

test("definição estática do Netlify expõe os mesmos campos de arquivo", () => {
  const formDefinition = readFileSync("public/__forms.html", "utf8");
  assert.match(formDefinition, /data-netlify="true"/);
  assert.match(formDefinition, /netlify-honeypot="bot-field"/);
  for (const index of [1, 2, 3, 4]) assert.match(formDefinition, new RegExp(`name="photo_${index}"`));
});

test("envio usa POST multipart para o Netlify e trata respostas de sucesso e erro", async () => {
  const payload = new FormData();
  payload.set("form-name", "community-update");
  payload.set("segmentId", "T04");
  let request: { input?: RequestInfo | URL; init?: RequestInit } = {};
  const successFetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    request = { input, init };
    return new Response(null, { status: 200 });
  }) as typeof fetch;
  await submitCommunityContribution(payload, successFetcher);
  assert.equal(request.input, "/");
  assert.equal(request.init?.method, "POST");
  assert.equal(request.init?.body, payload);
  assert.equal(request.init?.headers, undefined);

  const failureFetcher = (async () => new Response(null, { status: 500 })) as typeof fetch;
  await assert.rejects(() => submitCommunityContribution(payload, failureFetcher), /HTTP 500/);
});
