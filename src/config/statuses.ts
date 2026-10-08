import type { SegmentStatus } from "@/types/map";

export interface StatusConfig {
  label: string;
  color: string;
  description: string;
}

export const STATUS_CONFIG: Record<SegmentStatus, StatusConfig> = {
  nao_iniciada: { label: "Não iniciada", color: "#64748b", description: "A execução ainda não foi iniciada." },
  prevista: { label: "Prevista", color: "#7c3aed", description: "A execução está prevista." },
  em_preparacao: { label: "Em preparação", color: "#ca8a04", description: "O trecho está na etapa de preparação." },
  em_execucao: { label: "Em execução", color: "#2563eb", description: "Há serviços em andamento neste trecho." },
  aguardando: { label: "Aguardando", color: "#ea580c", description: "O andamento está aguardando uma próxima etapa." },
  bloqueada: { label: "Obra bloqueada", color: "#dc2626", description: "Há um impedimento informado para este trecho." },
  liberada_proxima_etapa: { label: "Liberada para próxima etapa", color: "#0f766e", description: "O trecho foi liberado para avançar." },
  concluida: { label: "Concluída", color: "#15803d", description: "O serviço informado para este trecho foi concluído." },
  no_public_update: { label: "Sem atualização pública", color: "#64748b", description: "Ainda não localizamos informação pública suficiente para indicar a etapa atual deste trecho." },
};

export const statusColorExpression = [
  "match",
  ["get", "status"],
  ...Object.entries(STATUS_CONFIG).flatMap(([status, config]) => [status, config.color]),
  STATUS_CONFIG.no_public_update.color,
] as const;
