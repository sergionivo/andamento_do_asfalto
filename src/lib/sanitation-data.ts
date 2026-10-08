import { SANITATION_NOTE, SANITATION_SOURCE, SANITATION_SOURCE_DOCUMENT } from "@/config/sanitation";
import { validateSanitationFeature } from "@/lib/sanitation-geometry";
import type { OsmCandidateFeature } from "@/types/official";
import type { SanitationCollection, SanitationNetworkType } from "@/types/sanitation";

export const SANITATION_PUBLIC_DEFAULT_VISIBLE = false;
export const publicSanitationVisibility = (enabled: boolean, waterEnabled: boolean, sewerEnabled: boolean) => ({ water: enabled && waterEnabled, sewer: enabled && sewerEnabled });

const expected = {
  water: { segments: 30, corridors: 27 },
  sewer: { segments: 25, corridors: 24 },
} as const;

export function validateCanonicalSanitation(collection: SanitationCollection, networkType: SanitationNetworkType, originals: OsmCandidateFeature[]): string[] {
  const errors: string[] = [];
  const ids = collection.features.map((feature) => feature.properties.id);
  const geometries = collection.features.map((feature) => JSON.stringify(feature.geometry));
  const corridors = new Set(collection.features.map((feature) => feature.properties.osmWayId));
  if (collection.features.length !== expected[networkType].segments) errors.push(`${networkType}: quantidade de segmentos inválida.`);
  if (corridors.size !== expected[networkType].corridors) errors.push(`${networkType}: quantidade de corredores inválida.`);
  if (new Set(ids).size !== ids.length) errors.push(`${networkType}: IDs duplicados.`);
  if (new Set(geometries).size !== geometries.length) errors.push(`${networkType}: segmentos geométricos duplicados.`);
  for (const feature of collection.features) {
    const properties = feature.properties;
    if (properties.networkType !== networkType || properties.layerType !== "sanitation") errors.push(`${properties.id}: classificação de rede inválida.`);
    if (properties.source !== SANITATION_SOURCE || properties.sourceDocument !== SANITATION_SOURCE_DOCUMENT) errors.push(`${properties.id}: fonte ou documento ausente.`);
    if (properties.geometryStatus !== "validated" || properties.precisionClassification !== "reference_corridor") errors.push(`${properties.id}: validação ou precisão inválida.`);
    if (properties.interferenceStatus !== "not_assessed" || properties.blockageStatus !== "not_assessed" || properties.executionStatus !== "not_applicable") errors.push(`${properties.id}: inferência indevida.`);
    if (!properties.validatedAt || properties.note !== SANITATION_NOTE) errors.push(`${properties.id}: data ou nota obrigatória ausente.`);
    errors.push(...validateSanitationFeature(feature, originals).map((error) => `${properties.id}: ${error}`));
  }
  return errors;
}
