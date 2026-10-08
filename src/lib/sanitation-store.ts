import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SanitationCollection, SanitationFeature, SanitationNetworkType } from "@/types/sanitation";

export const sanitationPath = (networkType: SanitationNetworkType) => path.join(process.cwd(), "src/data/generated", networkType === "water" ? "water-network.reference.validated.geojson" : "sewer-network.reference.validated.geojson");
export function mergeSanitationFeatures(current: SanitationCollection, incoming: SanitationFeature[]): SanitationCollection { const ids = new Set(incoming.map((feature) => feature.properties.id)); return { type: "FeatureCollection", features: [...current.features.filter((feature) => !ids.has(feature.properties.id)), ...incoming] }; }
export function removeSanitationFeature(current: SanitationCollection, id: string): SanitationCollection { return { type: "FeatureCollection", features: current.features.filter((feature) => feature.properties.id !== id) }; }
export async function readSanitation(networkType: SanitationNetworkType): Promise<SanitationCollection> { return JSON.parse(await readFile(sanitationPath(networkType), "utf8")) as SanitationCollection; }
export async function saveSanitation(feature: SanitationFeature): Promise<SanitationCollection> {
  const current = await readSanitation(feature.properties.networkType); const features = [...current.features.filter((item) => item.properties.id !== feature.properties.id), feature];
  const updated = { type: "FeatureCollection" as const, features }; await writeFile(sanitationPath(feature.properties.networkType), `${JSON.stringify(updated, null, 2)}\n`, "utf8"); return updated;
}
export async function saveSanitationBatch(features: SanitationFeature[]): Promise<SanitationCollection> {
  if (!features.length) throw new Error("Nenhum segmento para salvar."); const networkType = features[0].properties.networkType;
  if (features.some((feature) => feature.properties.networkType !== networkType)) throw new Error("Uma operação não pode misturar água e esgoto.");
  const current = await readSanitation(networkType); const updated = mergeSanitationFeatures(current, features);
  await writeFile(sanitationPath(networkType), `${JSON.stringify(updated, null, 2)}\n`, "utf8"); return updated;
}
export async function removeSanitation(networkType: SanitationNetworkType, id: string): Promise<SanitationCollection> {
  const current = await readSanitation(networkType); const updated = removeSanitationFeature(current, id);
  await writeFile(sanitationPath(networkType), `${JSON.stringify(updated, null, 2)}\n`, "utf8"); return updated;
}
