import { readFileSync } from "node:fs";
import path from "node:path";
import { DrainageReviewMap } from "@/components/map/DrainageReviewMap";
import type { DrainageGeoJsonCollection } from "@/types/drainage";
import type { ValidatedGeometryCollection } from "@/types/official";

export default function DrainageReviewPage() {
  const drainage = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/drainage.project.validated.geojson"), "utf8")) as DrainageGeoJsonCollection;
  const paving = JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated/paving-segments.validated.geojson"), "utf8")) as ValidatedGeometryCollection;
  return <DrainageReviewMap drainage={drainage} paving={paving} />;
}
