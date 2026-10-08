import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ValidatedGeometryCollection, ValidatedGeometryFeature } from "@/types/official";

export const VALIDATED_GEOMETRY_PATH = path.join(
  process.cwd(),
  "src/data/generated/paving-segments.validated.geojson",
);

const emptyCollection = (): ValidatedGeometryCollection => ({ type: "FeatureCollection", features: [] });

export async function readValidatedGeometries(): Promise<ValidatedGeometryCollection> {
  try {
    return JSON.parse(await readFile(VALIDATED_GEOMETRY_PATH, "utf8")) as ValidatedGeometryCollection;
  } catch {
    return emptyCollection();
  }
}

export async function saveValidatedGeometry(feature: ValidatedGeometryFeature): Promise<ValidatedGeometryCollection> {
  const collection = await readValidatedGeometries();
  const features = collection.features.filter((item) => item.properties.axisId !== feature.properties.axisId);
  const updated: ValidatedGeometryCollection = { type: "FeatureCollection", features: [...features, feature] };
  await mkdir(path.dirname(VALIDATED_GEOMETRY_PATH), { recursive: true });
  await writeFile(VALIDATED_GEOMETRY_PATH, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  return updated;
}
