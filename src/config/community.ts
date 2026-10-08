import type { CommunityObservationType } from "@/types/community";

export const COMMUNITY_FORM_NAME = "community-update";
export const COMMUNITY_MAX_FILES = 4;
export const COMMUNITY_MAX_FILE_BYTES = 2 * 1024 * 1024;
// Reserva margem para os campos e os limites do multipart sob o teto de 8 MB do Netlify.
export const COMMUNITY_MAX_REQUEST_BYTES = 7 * 1024 * 1024;
export const COMMUNITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const COMMUNITY_OBSERVATION_LABELS: Record<CommunityObservationType, string> = {
  crew_or_machinery: "Máquinas ou equipes trabalhando",
  drainage_or_excavation: "Escavação ou drenagem",
  road_preparation: "Preparação da rua",
  base_material: "Base/cascalhamento",
  curb_or_gutter: "Meio-fio ou sarjeta",
  asphalt_application: "Aplicação de asfalto",
  signage_or_finishing: "Sinalização ou acabamento",
  apparently_stopped: "Obra aparentemente parada",
  other: "Outro",
};

export const COMMUNITY_PUBLICATION_GUIDANCE: Record<CommunityObservationType, string> = {
  ...COMMUNITY_OBSERVATION_LABELS,
  apparently_stopped: "Sem atividade visível no momento do registro",
};
