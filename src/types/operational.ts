export const OPERATIONAL_STATUSES = ["nao_iniciada", "prevista", "em_preparacao", "em_execucao", "aguardando", "bloqueada", "liberada_proxima_etapa", "concluida", "no_public_update"] as const;
export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];
export type ScopeStatus = "included" | "partially_included" | "not_included" | "unknown";

export const WORK_STAGES = ["preparacao_mobilizacao", "remocoes", "sondagem_interferencias", "abertura_valas", "galerias", "pocos_visita_bocas_lobo", "reaterro_recomposicao", "terraplenagem", "regularizacao_subleito", "sub_base", "base", "imprimacao", "pintura_ligacao", "cbuq_asfalto", "meio_fio_sarjeta", "passeio_acessibilidade", "sinalizacao", "recebimento"] as const;
export type WorkStage = (typeof WORK_STAGES)[number];
export type EvidenceClassification = "official" | "project_estimate" | "field_observation" | "community_report";
export type ForecastType = "official" | "project_estimate" | "sem_previsao_divulgada";
export type WorkEventType = "status_update" | "stage_update" | "blockage" | "forecast" | "responsibility" | "general_update";

export interface WorkEvent {
  id: string;
  segmentId: string;
  date: string;
  eventType: WorkEventType;
  stage: WorkStage | null;
  status: OperationalStatus;
  title: string;
  description: string;
  responsibleParty: string | null;
  dependency: string | null;
  blockage: string | null;
  nextAction: string | null;
  nextStage: WorkStage | null;
  forecast: { type: Exclude<ForecastType, "sem_previsao_divulgada">; value: string } | null;
  evidenceType: string;
  sourceTitle: string;
  sourceUrl: string | null;
  sourceDate: string;
  classification: EvidenceClassification;
  createdAt: string;
}

export interface SegmentOperationalState {
  segmentId: string;
  currentStage: WorkStage | null;
  currentStatus: OperationalStatus;
  currentResponsible: string | null;
  blockage: string | null;
  dependency: string | null;
  nextAction: string | null;
  nextStage: WorkStage | null;
  forecastType: ForecastType;
  forecastValue: string | null;
  lastUpdatedAt: string | null;
  lastEvidenceId: string | null;
}
