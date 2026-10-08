export type SanitationNetworkType = "water" | "sewer";
export type SanitationGeometryMode = "full_way" | "trimmed";
export type SanitationPosition = [number, number];

export interface SanitationProperties {
  id: string;
  networkType: SanitationNetworkType;
  layerType: "sanitation";
  source: "Águas Guariroba S.A. — cadastro de 2025";
  sourceDocument: "Projeto Executivo — Lote 22 — Prancha 02";
  geometrySource: "OpenStreetMap";
  geometryMethod: "manual_reference_against_project_layout";
  geometryStatus: "validated" | "candidate";
  precisionClassification: "reference_corridor";
  infrastructureStatus: "existing_network_cadastral_reference";
  executionStatus: "not_applicable";
  interferenceStatus: "not_assessed";
  blockageStatus: "not_assessed";
  osmWayIds: string[];
  osmWayId: string;
  corridorName: string;
  segmentIndex: number;
  geometryMode: SanitationGeometryMode;
  startReference: string | null;
  endReference: string | null;
  osmName: string;
  geometryLengthMeters: number;
  validatedAt: string | null;
  note: "Representação cartográfica de referência. Não indica posição subterrânea exata, interferência ou bloqueio.";
}

export interface SanitationFeature {
  type: "Feature";
  properties: SanitationProperties;
  geometry: { type: "LineString"; coordinates: SanitationPosition[] };
}

export interface SanitationCollection {
  type: "FeatureCollection";
  features: SanitationFeature[];
}
