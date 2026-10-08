import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import { INSECURE_LOCATION_MESSAGE, geolocationErrorMessage, isLocationButtonDisabled, requestUserLocation, type UserCoordinate, type UserLocationStatus } from "../src/lib/user-location";

const harness = () => {
  const statuses: UserLocationStatus[] = []; const messages: Array<string | null> = []; const centered: UserCoordinate[] = []; const markers: UserCoordinate[] = [];
  return { statuses, messages, centered, markers, setStatus: (value: UserLocationStatus) => statuses.push(value), setMessage: (value: string | null) => messages.push(value), recenter: (value: UserCoordinate) => centered.push(value), showMarker: (value: UserCoordinate) => markers.push(value) };
};

test("navegador sem geolocation retorna mensagem sem solicitar posição", async () => {
  const state = harness();
  assert.equal(await requestUserLocation({ ...state, cached: null }), null);
  assert.deepEqual(state.statuses, ["error"]);
  assert.equal(state.messages.at(-1), "Seu navegador não oferece suporte à localização.");
});

test("permission denied, posição indisponível e timeout têm mensagens específicas", async () => {
  assert.equal(geolocationErrorMessage(1), "Permita o acesso à localização no navegador para usar este recurso.");
  assert.equal(geolocationErrorMessage(2), "Não conseguimos identificar sua localização agora.");
  assert.equal(geolocationErrorMessage(3), "A localização demorou para responder. Tente novamente.");
  const state = harness();
  await requestUserLocation({ ...state, cached: null, geolocation: { getCurrentPosition: (_success, error) => error({ code: 1 }) } });
  assert.deepEqual(state.statuses, ["loading", "error"]);
});

test("acesso sem contexto seguro não chama a API de geolocalização", async () => {
  const state = harness(); let requests = 0;
  const result = await requestUserLocation({ ...state, cached: null, secureContext: false, geolocation: { getCurrentPosition: () => { requests += 1; } } });
  assert.equal(result, null);
  assert.equal(requests, 0);
  assert.deepEqual(state.statuses, ["error"]);
  assert.equal(state.messages.at(-1), INSECURE_LOCATION_MESSAGE);
});

test("sucesso cria marcador, centraliza e retorna longitude/latitude", async () => {
  const state = harness();
  const result = await requestUserLocation({ ...state, cached: null, geolocation: { getCurrentPosition: (success) => success({ coords: { latitude: -20.474, longitude: -54.658 } }) } });
  assert.deepEqual(result, [-54.658, -20.474]);
  assert.deepEqual(state.markers, [[-54.658, -20.474]]);
  assert.deepEqual(state.centered, [[-54.658, -20.474]]);
  assert.deepEqual(state.statuses, ["loading", "located"]);
});

test("segundo clique usa posição em memória e apenas recentraliza", async () => {
  const state = harness(); let requests = 0;
  const cached: UserCoordinate = [-54.658, -20.474];
  await requestUserLocation({ ...state, cached, geolocation: { getCurrentPosition: () => { requests += 1; } } });
  assert.equal(requests, 0); assert.deepEqual(state.centered, [cached]); assert.deepEqual(state.markers, []);
});

test("botão fica desabilitado somente durante loading", () => {
  assert.equal(isLocationButtonDisabled("loading"), true);
  assert.equal(isLocationButtonDisabled("idle"), false);
  assert.equal(isLocationButtonDisabled("located"), false);
  assert.equal(isLocationButtonDisabled("error"), false);
});

test("implementação não persiste nem envia a localização", () => {
  const source = readFileSync("src/components/map/OliveiraMap.tsx", "utf8") + readFileSync("src/lib/user-location.ts", "utf8");
  assert.equal(/localStorage|sessionStorage|fetch\(|sendBeacon|XMLHttpRequest/.test(source), false);
});
