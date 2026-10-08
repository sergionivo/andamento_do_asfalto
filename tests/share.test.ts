import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, resolveSiteUrl } from "../src/config/site";
import { SITE_SHARE_TEXT, shareSite } from "../src/lib/share";

test("compartilhamento nativo recebe título, texto e URL canônica", async () => {
  let received: ShareData | undefined;
  const events: string[] = [];
  const outcome = await shareSite({
    share: async (data) => { received = data; },
    writeText: async () => assert.fail("clipboard não deve ser usado"),
    onEvent: (event) => events.push(event),
  });
  assert.equal(outcome, "shared");
  assert.deepEqual(received, { title: "Oliveira com Asfalto", text: SITE_SHARE_TEXT, url: SITE_URL });
  assert.deepEqual(events, ["share_clicked", "share_native_opened"]);
});

test("cancelamento da share sheet não vira erro nem copia o link", async () => {
  let copied = false;
  const abort = new Error("cancelado");
  abort.name = "AbortError";
  const outcome = await shareSite({ share: async () => { throw abort; }, writeText: async () => { copied = true; } });
  assert.equal(outcome, "cancelled");
  assert.equal(copied, false);
});

test("fallback copia a URL e é instrumentável", async () => {
  let copied = "";
  const events: string[] = [];
  const outcome = await shareSite({ writeText: async (text) => { copied = text; }, onEvent: (event) => events.push(event) });
  assert.equal(outcome, "copied");
  assert.equal(copied, SITE_URL);
  assert.deepEqual(events, ["share_clicked", "share_link_copied"]);
});

test("ausência de APIs não quebra a aplicação", async () => {
  assert.equal(await shareSite({ legacyCopy: () => false }), "unavailable");
});

test("URL pública tem fallback seguro e metadata social completa", () => {
  assert.equal(resolveSiteUrl(undefined), "https://oliveiracomasfalto.netlify.app");
  assert.equal(resolveSiteUrl("valor inválido"), "https://oliveiracomasfalto.netlify.app");
  assert.equal(resolveSiteUrl("https://exemplo.test/rota"), "https://exemplo.test");
  assert.equal(SITE_TITLE, "Oliveira com Asfalto — e a sua rua?");
  assert.match(SITE_DESCRIPTION, /Residencial Oliveira/);
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  for (const field of ["metadataBase", "alternates", "canonical", "openGraph", "twitter", "summary_large_image", "og-image.png"]) assert.ok(layout.includes(field));
});

test("imagem social é PNG 1200 × 630 e ícones da marca substituem o favicon genérico", () => {
  const png = readFileSync("public/og-image.png");
  assert.equal(png.toString("ascii", 1, 4), "PNG");
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.ok(readFileSync("src/app/icon.png").length > 0);
  assert.ok(readFileSync("src/app/apple-icon.png").length > 0);
});

test("dock, ficha e toast expõem compartilhamento acessível", () => {
  const map = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
  const details = readFileSync("src/components/map/SegmentDetails.tsx", "utf8");
  assert.match(map, /aria-label="Compartilhar Oliveira com Asfalto"/);
  assert.match(details, /aria-label="Compartilhar Oliveira com Asfalto"/);
  assert.match(map, /aria-live="polite"/);
  assert.match(map, /Link copiado!/);
  assert.equal(map.includes("alert("), false);
});

