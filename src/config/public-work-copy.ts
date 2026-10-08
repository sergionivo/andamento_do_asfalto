import type { OperationalStatus, ScopeStatus } from "@/types/operational";

export const PUBLIC_WORK_COPY = {
  scope: {
    included: { label: "Prevista na obra", description: "Este trecho faz parte do projeto contratado." },
    partially_included: { label: "Parcialmente prevista na obra", description: "Parte deste trecho faz parte do projeto contratado." },
    not_included: { label: "Não prevista na obra", description: "Este trecho não consta no escopo disponível." },
    unknown: { label: "Situação no projeto não confirmada", description: "Ainda não foi possível confirmar a situação deste trecho no projeto." },
  } satisfies Record<ScopeStatus, { label: string; description: string }>,
  operational: {
    no_public_update: { label: "Sem atualização pública", description: "Ainda não localizamos informação pública suficiente para indicar a etapa atual deste trecho." },
  } as Partial<Record<OperationalStatus, { label: string; description: string }>>,
  unknownStage: "Informação não divulgada",
  noConfirmedBlockage: "Nenhum bloqueio confirmado",
  noForecast: "Sem previsão divulgada",
} as const;
