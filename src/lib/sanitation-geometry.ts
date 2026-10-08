import { editingGeometryIntegrity, lineLengthMeters, snapToLine, type Position } from "@/lib/geometry-editing";
import { SANITATION_NOTE, SANITATION_SOURCE, SANITATION_SOURCE_DOCUMENT } from "@/config/sanitation";
import type { OsmCandidateFeature } from "@/types/official";
import type { SanitationFeature, SanitationGeometryMode, SanitationNetworkType } from "@/types/sanitation";

export function sanitationFeatureId(networkType: SanitationNetworkType, osmWayId: string, segmentIndex: number) {
  return `${networkType}-${osmWayId.replace(/^way\//, "")}-${String(segmentIndex).padStart(2, "0")}`;
}

export function buildSanitationFeature(networkType: SanitationNetworkType, candidate: OsmCandidateFeature, coordinates: Position[], geometryStatus: "candidate" | "validated" = "candidate", segmentIndex = 1, geometryMode: SanitationGeometryMode = "full_way", id?: string): SanitationFeature {
  return { type: "Feature", properties: {
    id: id ?? sanitationFeatureId(networkType, candidate.properties.osmId, segmentIndex),
    networkType, layerType: "sanitation", source: SANITATION_SOURCE, sourceDocument: SANITATION_SOURCE_DOCUMENT,
    geometrySource: "OpenStreetMap", geometryMethod: "manual_reference_against_project_layout", geometryStatus,
    precisionClassification: "reference_corridor", infrastructureStatus: "existing_network_cadastral_reference",
    executionStatus: "not_applicable", interferenceStatus: "not_assessed", blockageStatus: "not_assessed",
    osmWayIds: [candidate.properties.osmId], osmWayId: candidate.properties.osmId, corridorName: candidate.properties.osmName,
    segmentIndex, geometryMode, startReference: null, endReference: null, osmName: candidate.properties.osmName,
    geometryLengthMeters: Number(lineLengthMeters(coordinates).toFixed(2)), validatedAt: geometryStatus === "validated" ? new Date().toISOString() : null,
    note: SANITATION_NOTE,
  }, geometry: { type: "LineString", coordinates } };
}

export function validateSanitationFeature(feature: SanitationFeature, originals: OsmCandidateFeature[]): string[] {
  const errors: string[] = []; const properties = feature?.properties; const coordinates = feature?.geometry?.coordinates ?? [];
  if (feature?.geometry?.type !== "LineString" || coordinates.length < 2) errors.push("Geometria vazia ou inválida.");
  if (!properties?.source || properties.source !== SANITATION_SOURCE || properties.sourceDocument !== SANITATION_SOURCE_DOCUMENT) errors.push("Proveniência obrigatória ausente.");
  if (properties?.precisionClassification !== "reference_corridor") errors.push("A precisão deve ser reference_corridor.");
  if (properties?.interferenceStatus !== "not_assessed" || properties?.blockageStatus !== "not_assessed") errors.push("Interferência e bloqueio não podem ser inferidos.");
  if (!Array.isArray(properties?.osmWayIds) || !properties.osmWayIds.length || new Set(properties.osmWayIds).size !== properties.osmWayIds.length) errors.push("osmWayIds inválidos ou duplicados.");
  if (properties?.osmWayIds?.length !== 1 || properties.osmWayId !== properties.osmWayIds[0] || !Number.isInteger(properties.segmentIndex) || properties.segmentIndex < 1 || !["full_way", "trimmed"].includes(properties.geometryMode)) errors.push("Identidade do segmento inválida.");
  const selected = originals.filter((item) => properties?.osmWayIds.includes(item.properties.osmId));
  if (selected.length !== properties?.osmWayIds.length) errors.push("Way de origem não encontrado.");
  const integrity = editingGeometryIntegrity(coordinates.length ? [coordinates] : [], selected.map((item) => item.geometry.coordinates));
  if (!integrity.valid) errors.push(integrity.error ?? "Geometria não pertence ao corredor original.");
  return errors;
}

function lineOrder(point: Position, original: Position[]) {
  const snapped = snapToLine(point, original);
  return snapped ? snapped.segmentIndex + snapped.t : null;
}

export function sanitationSegmentRange(coordinates: Position[], original: Position[]): [number, number] | null {
  if (coordinates.length < 2) return null; const first = lineOrder(coordinates[0], original); const last = lineOrder(coordinates.at(-1)!, original); if (first === null || last === null) return null; return first <= last ? [first, last] : [last, first];
}

export function sanitationSegmentsOverlap(a: Position[], b: Position[], original: Position[], tolerance = 1e-7): boolean {
  const first = sanitationSegmentRange(a, original); const second = sanitationSegmentRange(b, original); if (!first || !second) return false;
  return Math.min(first[1], second[1]) - Math.max(first[0], second[0]) > tolerance;
}

export function sanitationSegmentsAdjacent(a: Position[], b: Position[], original: Position[], tolerance = 1e-7): boolean {
  const first = sanitationSegmentRange(a, original); const second = sanitationSegmentRange(b, original); if (!first || !second) return false;
  return Math.abs(first[1] - second[0]) <= tolerance || Math.abs(second[1] - first[0]) <= tolerance;
}
