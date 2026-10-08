import { readFileSync } from "node:fs";
import path from "node:path";
import { GeometryReview } from "@/components/map/GeometryReview";
import { officialPavingAxes } from "@/data/paving-segments.official";
import type { OsmCandidateCollection, ValidatedGeometryCollection } from "@/types/official";

export const metadata = {
  title: "Revisão cartográfica | Oliveira com Asfalto",
};

export default function GeometryReviewPage() {
  const candidatePath = path.join(process.cwd(), "src/data/generated/osm-street-candidates.geojson");
  const validatedPath = path.join(process.cwd(), "src/data/generated/paving-segments.validated.geojson");
  const candidates = JSON.parse(readFileSync(candidatePath, "utf8")) as OsmCandidateCollection;
  const validated = JSON.parse(readFileSync(validatedPath, "utf8")) as ValidatedGeometryCollection;

  return <GeometryReview axes={officialPavingAxes} candidates={candidates} initialValidated={validated} />;
}
