import { readFileSync } from "node:fs";
import path from "node:path";
import { OliveiraMap } from "@/components/map/OliveiraMap";
import { buildPublicMapData, validateValidatedGeometryData } from "@/lib/public-map-data";
import { buildPublicDrainageLayer, validateProjectDrainage } from "@/lib/drainage-data";
import type { DrainageGeoJsonCollection } from "@/types/drainage";
import type { ValidatedGeometryCollection } from "@/types/official";
import type { OsmCandidateCollection } from "@/types/official";
import type { SanitationCollection } from "@/types/sanitation";
import { validateCanonicalSanitation } from "@/lib/sanitation-data";

export default function Home() {
  const geoJsonPath = path.join(process.cwd(), "src/data/generated/paving-segments.validated.geojson");
  const validated = JSON.parse(readFileSync(geoJsonPath, "utf8")) as ValidatedGeometryCollection;
  const validationErrors = validateValidatedGeometryData(validated);
  if (validationErrors.length) throw new Error(validationErrors.join(" "));
  const segments = buildPublicMapData(validated);
  const canonicalDrainage = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/drainage.project.validated.geojson"), "utf8")) as DrainageGeoJsonCollection;
  const drainageErrors = validateProjectDrainage(canonicalDrainage);
  if (drainageErrors.length) throw new Error(drainageErrors.join(" "));
  const drainage = buildPublicDrainageLayer(canonicalDrainage);
  const candidates = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/osm-sanitation-corridors.geojson"), "utf8")) as OsmCandidateCollection;
  const water = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/water-network.reference.validated.geojson"), "utf8")) as SanitationCollection;
  const sewer = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/sewer-network.reference.validated.geojson"), "utf8")) as SanitationCollection;
  const sanitationErrors = [...validateCanonicalSanitation(water, "water", candidates.features), ...validateCanonicalSanitation(sewer, "sewer", candidates.features)];
  if (sanitationErrors.length) throw new Error(sanitationErrors.join(" "));

  return (
    <main className="h-dvh min-h-[560px] overflow-hidden bg-slate-100">
      <OliveiraMap segments={segments} drainage={drainage} water={water} sewer={sewer} />
    </main>
  );
}
