import { DRAINAGE_SOURCE_CRS, DRAINAGE_TARGET_CRS, drainageCoordinateToWgs84 } from "@/config/drainage-crs";
import { officialDrainageNodes } from "@/data/drainage-nodes.official";
import { officialDrainageSegments } from "@/data/drainage-segments.official";
import type { DrainageGeoJsonCollection } from "@/types/drainage";

const round = (value: number) => Number(value.toFixed(2));
export const DRAINAGE_VALIDATED_AT = "2026-10-07";
export const DRAINAGE_SOURCE_DRAWINGS = ["Prancha 12", "Prancha 13", "Prancha 15", "Prancha 16", "Prancha 17"];
export const DRAINAGE_PUBLIC_DEFAULT_VISIBLE = false;

export function buildDrainageGeoJson(): DrainageGeoJsonCollection {
  const nodes = new Map(officialDrainageNodes.map((node) => [node.id, node]));
  const common = {
    source: "Projeto Executivo — Lote 22",
    sourceCrs: DRAINAGE_SOURCE_CRS.code,
    crsValidationStatus: DRAINAGE_SOURCE_CRS.validationStatus,
  } as const;
  const nodeFeatures: DrainageGeoJsonCollection["features"] = officialDrainageNodes.map((node) => ({
    type: "Feature",
    properties: { featureType: "node", id: node.id, displayId: node.displayId, basin: node.basin, depthMeters: node.depthMeters, ...common },
    geometry: { type: "Point", coordinates: drainageCoordinateToWgs84(node.x, node.y) },
  }));
  const segmentFeatures: DrainageGeoJsonCollection["features"] = officialDrainageSegments.map((segment) => {
    const start = nodes.get(segment.startNode);
    const end = nodes.get(segment.endNode);
    if (!start || !end) throw new Error(`${segment.id} referencia nó inexistente.`);
    if (start.basin !== segment.basin || end.basin !== segment.basin) throw new Error(`${segment.id} cruza bacias indevidamente.`);
    const calculatedLengthMeters = round(Math.hypot(end.x - start.x, end.y - start.y));
    return {
      type: "Feature",
      properties: {
        featureType: "segment", id: segment.id, basin: segment.basin,
        layerType: "drainage", projectStatus: "prevista", executionStatus: "sem_informacao",
        geometryStatus: "validated", geometrySource: "Projeto Executivo — Lote 22",
        validationMethod: "manual_against_project_drawings", sourceDrawings: DRAINAGE_SOURCE_DRAWINGS,
        validatedAt: DRAINAGE_VALIDATED_AT,
        startNode: segment.startNode, endNode: segment.endNode,
        startNodeDisplay: start.displayId, endNodeDisplay: end.displayId,
        officialLengthMeters: segment.officialLengthMeters,
        calculatedLengthMeters,
        lengthDifferenceMeters: segment.officialLengthMeters === null ? null : round(calculatedLengthMeters - segment.officialLengthMeters),
        diameterMeters: segment.diameterMeters, material: segment.material,
        validationStatus: segment.validationStatus, ...common,
      },
      geometry: { type: "LineString", coordinates: [drainageCoordinateToWgs84(start.x, start.y), drainageCoordinateToWgs84(end.x, end.y)] },
    };
  });
  return {
    type: "FeatureCollection",
    metadata: { sourceCrs: DRAINAGE_SOURCE_CRS.code, targetCrs: DRAINAGE_TARGET_CRS, crsValidationStatus: DRAINAGE_SOURCE_CRS.validationStatus, generatedFrom: "official_project_coordinates", projectStatus: "prevista", executionStatus: "sem_informacao", geometryStatus: "validated", validatedAt: DRAINAGE_VALIDATED_AT },
    features: [...nodeFeatures, ...segmentFeatures],
  };
}

export function buildPublicDrainageLayer(collection: DrainageGeoJsonCollection): DrainageGeoJsonCollection {
  // Os pontos publicados são exclusivamente os nós reais do projeto já presentes
  // no dataset canônico; nenhuma coordenada intermediária é sintetizada aqui.
  return { ...collection, features: collection.features.filter((feature) => feature.properties.featureType === "segment" || feature.properties.featureType === "node") };
}

export function validateProjectDrainage(collection: DrainageGeoJsonCollection): string[] {
  const errors: string[] = [];
  const nodes = collection.features.filter((feature) => feature.properties.featureType === "node");
  const segments = collection.features.filter((feature) => feature.properties.featureType === "segment");
  const nodeIds = new Set(nodes.map((feature) => feature.properties.id));
  const expectedIds = [...Array.from({ length: 13 }, (_, index) => `T-${String(index + 1).padStart(2, "0")}`), ...Array.from({ length: 9 }, (_, index) => `T-${String(index + 15).padStart(2, "0")}`)];
  const ids = segments.map((feature) => feature.properties.id);
  if (segments.length !== 22) errors.push(`Esperados 22 trechos; recebidos ${segments.length}.`);
  if (new Set(ids).size !== ids.length) errors.push("Há trechos duplicados.");
  if (expectedIds.some((id) => !ids.includes(id)) || ids.includes("T-14")) errors.push("IDs de drenagem inválidos.");
  for (const feature of segments) {
    if (feature.geometry.type !== "LineString" || feature.geometry.coordinates.length !== 2) errors.push(`${feature.properties.id} possui geometria inválida ou conexão artificial.`);
    if (!nodeIds.has(feature.properties.startNode ?? "") || !nodeIds.has(feature.properties.endNode ?? "")) errors.push(`${feature.properties.id} referencia nó inexistente.`);
    const start = nodes.find((node) => node.properties.id === feature.properties.startNode);
    const end = nodes.find((node) => node.properties.id === feature.properties.endNode);
    if (start?.properties.basin !== feature.properties.basin || end?.properties.basin !== feature.properties.basin) errors.push(`${feature.properties.id} cruza bacias.`);
    if (feature.properties.geometryStatus !== "validated" || feature.properties.projectStatus !== "prevista" || feature.properties.executionStatus !== "sem_informacao") errors.push(`${feature.properties.id} possui status público inválido.`);
  }
  return errors;
}
