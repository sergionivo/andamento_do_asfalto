import type { OperationalStatus, ScopeStatus, SegmentOperationalState, WorkEvent } from "@/types/operational";

export type SegmentStatus = OperationalStatus;
export type Coordinates = [longitude: number, latitude: number];

export interface SegmentProgress { status: SegmentStatus; etapaAtual: string | null; bloqueio: string | null; responsavelAtual: string | null; previsao: string | null; ultimaAtualizacaoAndamento: string | null }

export interface PublicDataProvenance {
  workScope: "Projeto Executivo — Lote 22";
  cartography: "OpenStreetMap, validada manualmente contra o Projeto Executivo";
  method: "validação manual assistida";
  projectDataUpdatedAt: "06/10/2026";
}

export interface PublicSegmentProperties {
  axisId: string;
  displayName: string;
  area: string;
  officialLengthMeters: number;
  components: Array<{ street: string; officialLengthMeters: number }>;
  provenance: PublicDataProvenance;
  operationalState: SegmentOperationalState;
  events: WorkEvent[];
  scopeStatus: ScopeStatus;
  operationalStatus: OperationalStatus;
  status: OperationalStatus;
}

export interface PublicSegmentFeature {
  type: "Feature";
  properties: PublicSegmentProperties;
  geometry:
    | { type: "LineString"; coordinates: Coordinates[] }
    | { type: "MultiLineString"; coordinates: Coordinates[][] };
}

export interface PublicSegmentCollection {
  type: "FeatureCollection";
  features: PublicSegmentFeature[];
}
