import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const map = readFileSync("src/components/map/OliveiraMap.tsx", "utf8");
const menu = readFileSync("src/components/map/MainMenu.tsx", "utf8");
const layers = readFileSync("src/components/map/MapLayersControl.tsx", "utf8");
const legend = readFileSync("src/components/map/MapLegend.tsx", "utf8");
const hint = readFileSync("src/components/map/MapHint.tsx", "utf8");
const details = readFileSync("src/components/map/SegmentDetails.tsx", "utf8");
const info = readFileSync("src/components/map/MapInfoPanel.tsx", "utf8");
const locationControl = readFileSync("src/components/map/UserLocationControl.tsx", "utf8");
const css = readFileSync("src/app/globals.css", "utf8");

test("menu principal possui abertura, fechamento, itens futuros e Instagram", () => {
  assert.match(map, /aria-label="Abrir menu Mais"/);
  assert.match(map, /<MainMenu open=\{mainMenuOpen\}/);
  assert.match(menu, /aria-label="Fechar menu"/);
  assert.match(menu, /História da pavimentação/);
  assert.match(menu, /Como usamos os dados/);
  assert.match(menu, /Sugestões e correções/);
  assert.match(menu, /Novidades/);
  assert.match(menu, /Privacidade e métricas/);
  assert.match(menu, /Em breve/);
  assert.match(menu, /https:\/\/www\.instagram\.com\/oliveiracomasfalto\//);
});

test("Camadas mantém controle funcional e vira sheet amplo no mobile", () => {
  assert.match(layers, /aria-expanded=\{open\}/);
  assert.match(layers, /onClick=\{onToggle\}/);
  assert.match(layers, /fixed inset-x-0 bottom-0/);
  assert.match(layers, /md:absolute/);
  assert.match(layers, /size-6 accent-cyan-700/);
});

test("copy cidadã e legenda condicional acompanham camadas ativas", () => {
  assert.match(layers, /Obra do asfalto/);
  assert.match(layers, /Drenagem da chuva/);
  assert.match(layers, /Rede de água/);
  assert.match(layers, /Rede de esgoto/);
  assert.match(legend, /\{drainageVisible &&/);
  assert.match(legend, /\{waterVisible &&/);
  assert.match(legend, /\{sewerVisible &&/);
});

test("hint inicial é simples, sem handle ou aparência de bottom sheet", () => {
  assert.match(hint, /Toque em uma rua para ver os detalhes/);
  assert.equal(hint.includes("h-1 w-10"), false);
  assert.equal(hint.includes("rounded-t-3xl"), false);
  assert.match(map, /map-mobile-bottom-ui[\s\S]*!layersOpen && !mainMenuOpen && !hasSelectedPavingOnce && <MapHint/);
  assert.match(map, /setHasSelectedPavingOnce\(true\)/);
});

test("sistema visual garante alvos de toque e foco visível", () => {
  assert.match(css, /--map-control-size: 48px/);
  assert.match(css, /min-height: var\(--map-control-size\)/);
  assert.match(css, /width: 48px;\s+height: 48px/);
  assert.match(css, /:focus-visible/);
});

test("mobile mantém zoom, atribuição compacta e amplia tipografia", () => {
  assert.match(css, /div\.maplibregl-ctrl-top-right \{\s+display: block/);
  assert.match(css, /--text-body: 1rem/);
  assert.match(css, /maplibregl-ctrl-attrib-button/);
  assert.match(css, /width: 30px;\s+height: 30px/);
});

test("dock separa ações do app no canto direito", () => {
  assert.match(locationControl, /Onde estou/);
  assert.match(layers, />Camadas</);
  assert.match(map, />Mais</);
  assert.match(map, />Compartilhar</);
  assert.match(map, /className="map-share-button"/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(map, /!selected && <div/);
  assert.match(map, /map-floating-actions/);
  assert.match(css, /\.map-mobile-bottom-ui \{[\s\S]*bottom: calc\(0\.75rem \+ env\(safe-area-inset-bottom\)\)[\s\S]*flex-direction: column/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*\.map-floating-actions \{[\s\S]*right: 24px;[\s\S]*bottom: 24px/);
  assert.match(css, /\.map-actions-cluster \{[\s\S]*flex-direction: column/);
  assert.match(css, /@media \(min-width: 768px\)[\s\S]*\.map-actions-cluster \{[\s\S]*flex-direction: row/);
  assert.match(css, /\.map-share-button \{[\s\S]*background: #1d4ed8/);
  assert.match(css, /\.map-legend \{[\s\S]*top: var\(--mobile-legend-top\)[\s\S]*bottom: auto/);
  assert.match(css, /\.map-hint \{[\s\S]*position: static/);
  assert.match(css, /#layers-panel \{[\s\S]*var\(--mobile-action-area-height\)/);
  assert.equal(map.includes("md:right-[420px]"), false);
});

test("detalhes têm rolagem interna, disclosure secundário e CTA comunitário fixo", () => {
  assert.match(details, /max-h-\[80dvh\]/);
  assert.match(details, /min-h-0 overflow-y-auto/);
  assert.match(details, /Ver detalhes técnicos/);
  assert.match(details, /Ocultar detalhes técnicos/);
  assert.match(details, /<footer[\s\S]*Enviar atualização/);
  assert.equal(details.includes("h-1 w-10"), false);
});

test("painel Sobre bloqueia a página, fecha por Escape e restaura foco", () => {
  assert.match(info, /document\.body\.style\.overflow = "hidden"/);
  assert.match(info, /event\.key === "Escape"/);
  assert.match(info, /previouslyFocused\?\.focus\(\)/);
  assert.match(info, /min-h-0 overflow-y-auto/);
});

test("atribuição, localização e seleção continuam presentes", () => {
  assert.match(map, /new maplibregl\.AttributionControl\(\{ compact: true \}\)/);
  assert.match(map, /maplibregl-compact-show/);
  assert.match(map, /removeAttribute\("open"\)/);
  assert.match(map, /© OpenStreetMap contributors/);
  assert.match(map, /<UserLocationControl/);
  assert.match(map, /requestUserLocation/);
  assert.match(map, /setSelected\(selectPaving\(properties\)\)/);
});
