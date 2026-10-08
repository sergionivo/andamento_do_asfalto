export type DrainageBasin = "Bacia 01" | "Bacia 02";
export type DrainageValidationStatus = "confirmed" | "pending_document_check";

export interface DrainageSource {
  document: "Projeto de Infraestrutura — Lote 22 — Pranchas 04 a 14";
  primarySheets: readonly ["Prancha 12 — Projeto Executivo — Drenagem", "Prancha 13 — Projeto Executivo — Drenagem"];
  scope: "Projeto Executivo — Lote 22";
}

export interface DrainageNode {
  id: string;
  displayId: string;
  basin: DrainageBasin;
  x: number;
  y: number;
  depthMeters: number;
  groundElevation: null;
  invertElevation: null;
  source: DrainageSource;
}

export interface DrainageSegment {
  id: `T-${string}`;
  basin: DrainageBasin;
  startNode: string;
  endNode: string;
  officialLengthMeters: number | null;
  diameterMeters: number | null;
  material: string | null;
  validationStatus: DrainageValidationStatus;
  endsAtExistingDrainage?: boolean;
  source: DrainageSource;
}

export interface DrainageGeoJsonProperties {
  featureType: "node" | "segment";
  id: string;
  layerType?: "drainage";
  projectStatus?: "prevista";
  executionStatus?: "sem_informacao";
  geometryStatus?: "validated";
  geometrySource?: "Projeto Executivo — Lote 22";
  validationMethod?: "manual_against_project_drawings";
  sourceDrawings?: string[];
  validatedAt?: string;
  displayId?: string;
  basin: DrainageBasin;
  startNode?: string;
  endNode?: string;
  startNodeDisplay?: string;
  endNodeDisplay?: string;
  officialLengthMeters?: number | null;
  calculatedLengthMeters?: number;
  lengthDifferenceMeters?: number | null;
  diameterMeters?: number | null;
  material?: string | null;
  depthMeters?: number;
  validationStatus?: DrainageValidationStatus;
  source: string;
  sourceCrs: string;
  crsValidationStatus: "validated_against_project_drawings";
}

export interface DrainageGeoJsonCollection {
  type: "FeatureCollection";
  metadata: {
    sourceCrs: string;
    targetCrs: "EPSG:4326";
    crsValidationStatus: "validated_against_project_drawings";
    generatedFrom: "official_project_coordinates";
    projectStatus: "prevista";
    executionStatus: "sem_informacao";
    geometryStatus: "validated";
    validatedAt: string;
  };
  features: Array<{
    type: "Feature";
    properties: DrainageGeoJsonProperties;
    geometry: { type: "Point"; coordinates: [number, number] } | { type: "LineString"; coordinates: [number, number][] };
  }>;
}
