import type { SegmentProgress } from "@/types/map";

// MOCK: estados usados somente para validar a interface; não são dados oficiais.
export const pavingProgressMock: Array<SegmentProgress & { id: string }> = [
  { id: "trecho-001", status: "no_public_update", etapaAtual: null, bloqueio: null, responsavelAtual: null, previsao: null, ultimaAtualizacaoAndamento: null },
  { id: "trecho-002", status: "em_preparacao", etapaAtual: "Preparação demonstrativa", bloqueio: null, responsavelAtual: null, previsao: null, ultimaAtualizacaoAndamento: null },
  { id: "trecho-003", status: "em_execucao", etapaAtual: "Execução demonstrativa", bloqueio: null, responsavelAtual: null, previsao: null, ultimaAtualizacaoAndamento: null },
  { id: "trecho-004", status: "concluida", etapaAtual: "Demonstração concluída", bloqueio: null, responsavelAtual: null, previsao: null, ultimaAtualizacaoAndamento: null },
];
