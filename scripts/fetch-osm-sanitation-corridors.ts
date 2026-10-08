import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OsmCandidateCollection, OsmCandidateFeature } from "../src/types/official";

const BOUNDS: [number, number, number, number] = [-20.486, -54.671, -20.462, -54.645];
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
interface Way { type: "way"; id: number; tags?: { name?: string }; geometry?: Array<{ lat: number; lon: number }> }
const radians = (value: number) => value * Math.PI / 180;
const distance = (a: [number, number], b: [number, number]) => { const dLat = radians(b[1] - a[1]); const dLon = radians(b[0] - a[0]); const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2; return 12_742_000 * Math.asin(Math.sqrt(value)); };

async function fetchWays(): Promise<Way[]> {
  const [south, west, north, east] = BOUNDS; const query = `[out:json][timeout:30];way["highway"]["name"](${south},${west},${north},${east});out tags geom;`; let lastError: unknown;
  for (const endpoint of ENDPOINTS) try { const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": "OliveiraComAsfalto-dev/0.1" }, body: `data=${encodeURIComponent(query)}`, signal: AbortSignal.timeout(45_000) }); if (!response.ok) throw new Error(`${response.status}`); return ((await response.json()) as { elements: Way[] }).elements; } catch (error) { lastError = error; }
  throw lastError;
}

async function main() {
  const ways = await fetchWays();
  const features: OsmCandidateFeature[] = ways.flatMap((way) => { const name = way.tags?.name; const coordinates = way.geometry?.map(({ lon, lat }) => [lon, lat] as [number, number]); if (!name || !coordinates || coordinates.length < 2) return []; return [{ type: "Feature", properties: { osmId: `way/${way.id}`, osmName: name, matchedCanonicalName: name, axisIds: [], matchType: "canonical", geometrySource: "OpenStreetMap", geometryStatus: "candidate", candidateLengthMeters: Number(coordinates.slice(1).reduce((sum, point, index) => sum + distance(coordinates[index], point), 0).toFixed(2)) }, geometry: { type: "LineString", coordinates } }]; });
  const collection: OsmCandidateCollection = { type: "FeatureCollection", metadata: { generatedAt: new Date().toISOString(), source: "OpenStreetMap", license: "ODbL", geometryStatus: "candidate", queryBounds: BOUNDS }, features };
  const output = path.join(process.cwd(), "src/data/generated/osm-sanitation-corridors.geojson"); await mkdir(path.dirname(output), { recursive: true }); await writeFile(output, `${JSON.stringify(collection, null, 2)}\n`, "utf8"); console.log(`${features.length} corredores OSM gravados em ${output}`);
}
void main();
