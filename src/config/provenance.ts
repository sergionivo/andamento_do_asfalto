import type { DataSource } from "@/types/official";

export const OFFICIAL_WORK_SOURCE: DataSource = {
  title: "Projeto Executivo — Lote 22",
  classification: "official",
};

export const CARTOGRAPHY_SOURCE = {
  title: "OpenStreetMap",
  classification: "open_data",
  license: "ODbL",
  qualification: "OpenStreetMap, validada manualmente contra o Projeto Executivo",
} as const;

export const PROVENANCE_LABELS = {
  workData: "Dados da obra",
  cartography: "Geometria cartográfica",
  progress: "Andamento",
  noProgress: "Sem informação atual",
} as const;
