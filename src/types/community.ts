export const COMMUNITY_OBSERVATION_TYPES = [
  "crew_or_machinery",
  "drainage_or_excavation",
  "road_preparation",
  "base_material",
  "curb_or_gutter",
  "asphalt_application",
  "signage_or_finishing",
  "apparently_stopped",
  "other",
] as const;

export type CommunityObservationType = (typeof COMMUNITY_OBSERVATION_TYPES)[number];

export interface CommunityImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface CommunityEvent {
  id: string;
  segmentId: string;
  observedAt: string;
  publishedAt: string;
  reviewedAt: string;
  observationType: CommunityObservationType;
  title: string;
  description?: string;
  images?: CommunityImage[];
  classification: "community_report";
  reviewStatus: "reviewed";
  sourceLabel: "Registro da comunidade";
}

