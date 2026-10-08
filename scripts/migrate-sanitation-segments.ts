import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sanitationFeatureId } from "../src/lib/sanitation-geometry";
import type { OsmCandidateCollection } from "../src/types/official";
import type { SanitationCollection, SanitationFeature, SanitationNetworkType } from "../src/types/sanitation";

const directory = path.join(process.cwd(), "src/data/generated");
let candidates!: OsmCandidateCollection;
const sameGeometry = (a: [number, number][], b: [number, number][]) => JSON.stringify(a) === JSON.stringify(b) || JSON.stringify(a) === JSON.stringify([...b].reverse());

async function migrate(networkType: SanitationNetworkType, filename: string) {
  const file = path.join(directory, filename); const collection = JSON.parse(await readFile(file, "utf8")) as SanitationCollection; const counts = new Map<string, number>();
  const features = collection.features.map((feature) => {
    const legacy = feature as SanitationFeature; const osmWayId = legacy.properties.osmWayId ?? legacy.properties.osmWayIds[0]; const segmentIndex = (counts.get(osmWayId) ?? 0) + 1; counts.set(osmWayId, segmentIndex);
    const original = candidates.features.find((candidate) => candidate.properties.osmId === osmWayId); const geometryMode = original && sameGeometry(legacy.geometry.coordinates, original.geometry.coordinates) ? "full_way" as const : "trimmed" as const;
    return { ...legacy, properties: { ...legacy.properties, id: sanitationFeatureId(networkType, osmWayId, segmentIndex), osmWayId, corridorName: legacy.properties.corridorName ?? legacy.properties.osmName, segmentIndex, geometryMode, startReference: legacy.properties.startReference ?? null, endReference: legacy.properties.endReference ?? null } };
  });
  await writeFile(file, `${JSON.stringify({ type: "FeatureCollection", features }, null, 2)}\n`, "utf8"); console.log(`${filename}: ${features.length} geometrias migradas sem recalcular coordenadas.`);
}
async function main() {
  candidates = JSON.parse(await readFile(path.join(directory, "osm-sanitation-corridors.geojson"), "utf8")) as OsmCandidateCollection;
  await migrate("water", "water-network.reference.validated.geojson");
  await migrate("sewer", "sewer-network.reference.validated.geojson");
}
void main();
