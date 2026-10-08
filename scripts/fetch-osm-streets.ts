import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { officialPavingAxes } from "../src/data/paving-segments.official";
import { aliasesForStreet } from "../src/data/street-aliases";
import type { OsmCandidateCollection, OsmCandidateFeature, StreetMatchType } from "../src/types/official";

const QUERY_BOUNDS: [south: number, west: number, north: number, east: number] = [
  -20.486,
  -54.671,
  -20.462,
  -54.645,
];

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

interface OverpassWay {
  type: "way";
  id: number;
  tags?: { name?: string };
  geometry?: Array<{ lat: number; lon: number }>;
}

interface OverpassResponse {
  elements: OverpassWay[];
}

function normalizeStreetName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/ª/g, "a")
    .replace(/º/g, "o")
    .replace(/[’'`´]/g, "")
    .replace(/\b(rua|r|travessa|tv|avenida|av)\b\.?/g, " ")
    .replace(/\b(dr|doutor)\b\.?/g, " doutor ")
    .replace(/\b(prof|profa|professor|professora)\b\.?/g, " professor ")
    .replace(/\bde\b|\bda\b|\bdo\b|\bdos\b|\bdas\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const radius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLon = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(value));
}

function lineLengthMeters(coordinates: [number, number][]): number {
  return coordinates.slice(1).reduce((total, coordinate, index) => {
    return total + haversineMeters(coordinates[index], coordinate);
  }, 0);
}

const streetIndex = officialPavingAxes.flatMap((axis) =>
  axis.streets.flatMap((canonicalName) => [
    { axisId: axis.id, canonicalName, candidateName: canonicalName, matchType: "canonical" as const },
    ...aliasesForStreet(canonicalName).map((alias) => ({
      axisId: axis.id,
      canonicalName,
      candidateName: alias,
      matchType: "alias" as const,
    })),
  ]),
);

function matchStreet(osmName: string) {
  const normalizedOsmName = normalizeStreetName(osmName);
  const matches = streetIndex.filter((entry) => normalizeStreetName(entry.candidateName) === normalizedOsmName);
  if (!matches.length) return null;

  const canonicalName = matches[0].canonicalName;
  const axisIds = [...new Set(matches.filter((match) => match.canonicalName === canonicalName).map((match) => match.axisId))];
  const matchType: StreetMatchType = matches.some(
    (match) => match.matchType === "canonical" && match.canonicalName === canonicalName,
  ) ? "canonical" : "alias";

  return { canonicalName, axisIds, matchType };
}

async function fetchOverpass(): Promise<OverpassResponse> {
  const [south, west, north, east] = QUERY_BOUNDS;
  const query = `[out:json][timeout:30];way["highway"]["name"](${south},${west},${north},${east});out tags geom;`;
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "OliveiraComAsfalto-dev/0.1 (cartographic review tool)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) throw new Error(`${endpoint} respondeu ${response.status}`);
      return (await response.json()) as OverpassResponse;
    } catch (error) {
      lastError = error;
      console.warn(`Falha em ${endpoint}:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Nenhum endpoint Overpass respondeu.");
}

async function main() {
  const response = await fetchOverpass();
  const features: OsmCandidateFeature[] = response.elements.flatMap((way) => {
    const osmName = way.tags?.name;
    const coordinates = way.geometry?.map(({ lon, lat }) => [lon, lat] as [number, number]);
    if (!osmName || !coordinates || coordinates.length < 2) return [];

    const match = matchStreet(osmName);
    if (!match) return [];

    return [{
      type: "Feature" as const,
      properties: {
        osmId: `way/${way.id}`,
        osmName,
        matchedCanonicalName: match.canonicalName,
        axisIds: match.axisIds,
        matchType: match.matchType,
        geometrySource: "OpenStreetMap" as const,
        geometryStatus: "candidate" as const,
        candidateLengthMeters: Number(lineLengthMeters(coordinates).toFixed(2)),
      },
      geometry: { type: "LineString" as const, coordinates },
    }];
  });

  const collection: OsmCandidateCollection = {
    type: "FeatureCollection",
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "OpenStreetMap",
      license: "ODbL",
      geometryStatus: "candidate",
      queryBounds: QUERY_BOUNDS,
    },
    features,
  };

  const outputDirectory = path.join(process.cwd(), "src/data/generated");
  const outputPath = path.join(outputDirectory, "osm-street-candidates.geojson");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, "utf8");

  console.log(`Arquivo gerado: ${outputPath}`);
  console.log(`Vias OSM consultadas: ${response.elements.length}`);
  console.log(`Geometrias candidatas compatíveis: ${features.length}`);
  for (const feature of features) {
    console.log(`- ${feature.properties.osmName} (${feature.properties.osmId}) → ${feature.properties.axisIds.join(", ")}`);
  }

  console.log("Cobertura dos eixos compostos:");
  for (const axis of officialPavingAxes.filter((item) => item.streets.length > 1)) {
    for (const street of axis.streets) {
      const matches = features.filter(
        (feature) => feature.properties.axisIds.includes(axis.id) && feature.properties.matchedCanonicalName === street,
      );
      const ids = matches.map((feature) => feature.properties.osmId).join(", ");
      console.log(`- ${axis.id} · ${street}: ${ids || "nenhum candidato"}`);
    }
  }
}

main().catch((error) => {
  console.error("Não foi possível buscar geometrias candidatas do OpenStreetMap.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
