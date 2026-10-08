export type OfficialArea =
  | "Oliveira I"
  | "Oliveira II"
  | "Trecho contratado no Oliveira II; a via continua pelo Oliveira I"
  | "Limite Oliveira I / Oliveira II e interior do Oliveira I";

export type GeometryValidationStatus = "pending_validation" | "validated";
export type CandidateReviewStatus = "pending" | "candidate_found" | "ambiguous" | "not_found" | "validated";
export type StreetMatchType = "canonical" | "alias";
export type ValidationGeometryMode = "full_ways" | "trimmed";

export interface DataSource {
  title: string;
  classification: "official" | "open_data";
}

export interface OfficialAxisComponent {
  street: string;
  officialLengthMeters: number;
}

export interface OfficialPavingAxis {
  id: `T${string}`;
  technicalName: string;
  displayName: string;
  streets: string[];
  area: OfficialArea;
  officialLengthMeters: number;
  components: OfficialAxisComponent[];
  geometryStatus: GeometryValidationStatus;
  dataClassification: "official";
  source: DataSource;
  currentStatus: "sem_informacao";
  note?: string;
  reviewGuidance: string;
}

export interface StreetAliasEntry {
  canonicalName: string;
  aliases: string[];
}

export interface OsmCandidateProperties {
  osmId: string;
  osmName: string;
  matchedCanonicalName: string;
  axisIds: string[];
  matchType: StreetMatchType;
  geometrySource: "OpenStreetMap";
  geometryStatus: "candidate";
  candidateLengthMeters: number;
}

export interface OsmCandidateFeature {
  type: "Feature";
  properties: OsmCandidateProperties;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export interface OsmCandidateCollection {
  type: "FeatureCollection";
  metadata: {
    generatedAt: string | null;
    source: "OpenStreetMap";
    license: "ODbL";
    geometryStatus: "candidate";
    queryBounds: [number, number, number, number];
  };
  features: OsmCandidateFeature[];
}

export interface ValidatedGeometryProperties {
  axisId: string;
  geometrySource: "OpenStreetMap";
  geometryStatus: "validated";
  validationMethod: "manual";
  validationGeometryMode: ValidationGeometryMode;
  officialLengthMeters: number;
  geometryLengthMeters: number;
  startReference: string;
  endReference: string;
  validatedAt: string;
  osmWayIds: string[];
}

export interface ValidatedGeometryFeature {
  type: "Feature";
  properties: ValidatedGeometryProperties;
  geometry:
    | { type: "LineString"; coordinates: [number, number][] }
    | { type: "MultiLineString"; coordinates: [number, number][][] };
}

export interface ValidatedGeometryCollection {
  type: "FeatureCollection";
  features: ValidatedGeometryFeature[];
}
