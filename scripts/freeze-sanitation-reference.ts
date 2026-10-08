import { readFileSync, writeFileSync } from "node:fs";
import { SANITATION_SOURCE, SANITATION_SOURCE_DOCUMENT } from "../src/config/sanitation";
import type { SanitationCollection, SanitationNetworkType } from "../src/types/sanitation";

const files: Array<[string, SanitationNetworkType]> = [
  ["src/data/generated/water-network.reference.validated.geojson", "water"],
  ["src/data/generated/sewer-network.reference.validated.geojson", "sewer"],
];

for (const [file, networkType] of files) {
  const collection = JSON.parse(readFileSync(file, "utf8")) as SanitationCollection & { features: Array<Omit<SanitationCollection["features"][number], "properties"> & { properties: SanitationCollection["features"][number]["properties"] & { sourceDrawing?: string } }> };
  const frozen = {
    ...collection,
    features: collection.features.map((feature) => {
      const legacyProperties = feature.properties as typeof feature.properties & { sourceDrawing?: string };
      const { sourceDrawing: _legacySourceDrawing, ...properties } = legacyProperties;
      void _legacySourceDrawing;
      return { ...feature, properties: { ...properties, networkType, layerType: "sanitation", source: SANITATION_SOURCE, sourceDocument: SANITATION_SOURCE_DOCUMENT } };
    }),
  };
  writeFileSync(file, `${JSON.stringify(frozen, null, 2)}\n`);
}
