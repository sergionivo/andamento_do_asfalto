import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");

test("home pública não depende de localhost nem de porta absoluta", () => {
  assert.equal(source.includes("localhost"), false);
  assert.equal(source.includes("127.0.0.1"), false);
  assert.equal(source.includes(":3000"), false);
  assert.match(source, /tiles: \["https:\/\/tile\.openstreetmap\.org/);
});

test("worker do MapLibre usa caminho relativo e existe como asset local", () => {
  assert.match(source, /const WORKER_URL = "\/maplibre-gl-worker\.mjs"/);
  const worker = readFileSync("public/maplibre-gl-worker.mjs", "utf8");
  assert.match(worker, /self\.worker=new RS\(self\)/);
});

test("inicialização possui loading, ready, error, timeout e diagnóstico", () => {
  assert.match(source, /useState<"loading" \| "ready" \| "error">\("loading"\)/);
  assert.match(source, /setMapStatus\("ready"\)/);
  assert.match(source, /setMapStatus\("error"\)/);
  assert.match(source, /MAP_INITIALIZATION_TIMEOUT_MS/);
  assert.match(source, /console\.error\("\[OliveiraMap\]/);
});

test("geolocalização permanece fora do fluxo de inicialização", () => {
  const initialization = source.slice(source.indexOf("useEffect(() => {", source.indexOf("const handleKeyDown")), source.indexOf("const changeDrainageVisibility"));
  assert.equal(initialization.includes("requestUserLocation"), false);
  assert.equal(initialization.includes("navigator.geolocation"), false);
});
