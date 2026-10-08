import { readFileSync } from "node:fs";
import path from "node:path";
import { SanitationReviewMap } from "@/components/map/SanitationReviewMap";
import type { DrainageGeoJsonCollection } from "@/types/drainage";
import type { OsmCandidateCollection, ValidatedGeometryCollection } from "@/types/official";
import type { SanitationCollection } from "@/types/sanitation";

export default function SanitationPage() {
  const candidates = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/osm-sanitation-corridors.geojson"), "utf8")) as OsmCandidateCollection;
  const paving = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/paving-segments.validated.geojson"), "utf8")) as ValidatedGeometryCollection;
  const drainage = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/drainage.project.validated.geojson"), "utf8")) as DrainageGeoJsonCollection;
  const initialWater = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/water-network.reference.validated.geojson"), "utf8")) as SanitationCollection;
  const initialSewer = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/sewer-network.reference.validated.geojson"), "utf8")) as SanitationCollection;
  return <SanitationReviewMap candidates={candidates} paving={paving} drainage={drainage} initialWater={initialWater} initialSewer={initialSewer} />;
}
