import { officialPavingAxes } from "@/data/paving-segments.official";
import type { PublicDataProvenance, PublicSegmentCollection, PublicSegmentProperties } from "@/types/map";
import type { ValidatedGeometryCollection } from "@/types/official";
import { getSegmentEvents, getSegmentOperationalState } from "@/lib/operational-data";
import type { WorkEvent } from "@/types/operational";

export const PUBLIC_MAP_PROVENANCE: PublicDataProvenance = {
  workScope: "Projeto Executivo — Lote 22",
  cartography: "OpenStreetMap, validada manualmente contra o Projeto Executivo",
  method: "validação manual assistida",
  projectDataUpdatedAt: "06/10/2026",
};

function publicArea(axisId: string, area: string): string {
  if (axisId === "T13") return "Oliveira I / Oliveira II";
  if (axisId === "T14") return "Oliveira I";
  if (area.includes("Oliveira II")) return "Oliveira II";
  return area;
}

export function buildPublicMapData(validated: ValidatedGeometryCollection, events?: WorkEvent[]): PublicSegmentCollection {
  const geometryByAxis = new Map(validated.features.map((feature) => [feature.properties.axisId, feature]));

  return {
    type: "FeatureCollection",
    features: officialPavingAxes.map((axis) => {
      const validatedFeature = geometryByAxis.get(axis.id);
      if (!validatedFeature) throw new Error(`Geometria validada ausente para ${axis.id}.`);
      const properties: PublicSegmentProperties = {
        axisId: axis.id,
        displayName: axis.displayName,
        area: publicArea(axis.id, axis.area),
        officialLengthMeters: axis.officialLengthMeters,
        components: axis.components,
        provenance: PUBLIC_MAP_PROVENANCE,
        operationalState: getSegmentOperationalState(axis.id, events),
        events: getSegmentEvents(axis.id, events),
        scopeStatus: "included",
        operationalStatus: getSegmentOperationalState(axis.id, events).currentStatus,
        status: getSegmentOperationalState(axis.id, events).currentStatus,
      };
      return { type: "Feature", properties, geometry: validatedFeature.geometry };
    }),
  };
}

export function validateValidatedGeometryData(validated: ValidatedGeometryCollection): string[] {
  const errors: string[] = [];
  const expectedIds = Array.from({ length: 14 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`);
  const ids = validated.features.map((feature) => feature.properties.axisId);
  if (validated.features.length !== 14) errors.push(`Esperadas 14 features; recebidas ${validated.features.length}.`);
  if (new Set(ids).size !== ids.length) errors.push("Há IDs de eixo duplicados.");
  if (expectedIds.some((id) => !ids.includes(id))) errors.push("O conjunto deve conter exatamente T01–T14.");
  if (validated.features.some((feature) => feature.properties.geometryStatus !== "validated")) errors.push("Há geometria sem status validated.");
  if (validated.features.some((feature) => {
    const coordinates = feature.geometry.coordinates;
    return !coordinates.length || (feature.geometry.type === "LineString" ? coordinates.length < 2 : coordinates.some((line) => line.length < 2));
  })) errors.push("Há geometria vazia.");
  const total = Number(validated.features.reduce((sum, feature) => sum + feature.properties.officialLengthMeters, 0).toFixed(2));
  if (total !== 3350.07) errors.push(`Soma oficial inválida: ${total} m.`);
  if (validated.features.some((feature) => feature.properties.geometrySource !== "OpenStreetMap" || feature.properties.validationMethod !== "manual" || !feature.properties.osmWayIds?.length)) errors.push("Há feature sem proveniência cartográfica ou método de validação.");
  return errors;
}
