import { OFFICIAL_WORK_SOURCE } from "@/config/provenance";
import type { OfficialPavingAxis } from "@/types/official";

const defaults = {
  geometryStatus: "pending_validation",
  dataClassification: "official",
  source: OFFICIAL_WORK_SOURCE,
  currentStatus: "sem_informacao",
} as const;

export const EXPECTED_OFFICIAL_LENGTH_METERS = 3350.07;

export const officialPavingAxes: OfficialPavingAxis[] = [
  {
    ...defaults,
    id: "T01",
    technicalName: "Prof. Maria Lúcia Passarelli / Dr. Germano Barros de Souza",
    displayName: "Professora Maria Lúcia Passarelli / Doutor Germano Barros de Souza",
    streets: ["Professora Maria Lúcia Passarelli", "Doutor Germano Barros de Souza"],
    area: "Oliveira II",
    officialLengthMeters: 988.63,
    components: [],
    note: "Extensão conjunta; não dividir entre as duas ruas.",
    reviewGuidance: "É um eixo contínuo envolvendo duas ruas. Não distribuir automaticamente a metragem entre elas.",
  },
  { ...defaults, id: "T02", technicalName: "Leonel Velasco", displayName: "Leonel Velasco", streets: ["Leonel Velasco"], area: "Oliveira II", officialLengthMeters: 168.71, components: [], reviewGuidance: "É diferente de T10, apesar de possuir o mesmo nome de rua." },
  { ...defaults, id: "T03", technicalName: "Engenheiro Orlando Oliveira", displayName: "Engenheiro Orlando Oliveira", streets: ["Engenheiro Orlando Oliveira"], area: "Oliveira II", officialLengthMeters: 202.85, components: [], reviewGuidance: "É diferente de T11." },
  { ...defaults, id: "T04", technicalName: "Otorino Vieira", displayName: "Otorino Vieira", streets: ["Otorino Vieira"], area: "Oliveira II", officialLengthMeters: 236.47, components: [], reviewGuidance: "Confirmar visualmente os limites do trecho no projeto oficial." },
  { ...defaults, id: "T05", technicalName: "Antônio Vieira d’Almeida", displayName: "Antônio Vieira d’Almeida", streets: ["Antônio Vieira d’Almeida"], area: "Oliveira II", officialLengthMeters: 270.32, components: [], reviewGuidance: "O candidato encontrado ainda exige validação manual contra o projeto." },
  {
    ...defaults,
    id: "T06",
    technicalName: "Travessa Luiz Arruda / Fidelo Mariana Almeida",
    displayName: "Travessa Luiz Arruda / Fidelo Mariana Almeida",
    streets: ["Travessa Luiz Arruda", "Fidelo Mariana Almeida"],
    area: "Oliveira II",
    officialLengthMeters: 424.57,
    components: [
      { street: "Travessa Luiz Arruda", officialLengthMeters: 96.78 },
      { street: "Fidelo Mariana Almeida", officialLengthMeters: 327.79 },
    ],
    reviewGuidance: "Composição conhecida: Travessa Luiz Arruda = 96,78 m; Fidelo Mariana Almeida = 327,79 m.",
  },
  { ...defaults, id: "T07", technicalName: "Otacílio de Souza", displayName: "Otacílio de Souza", streets: ["Otacílio de Souza"], area: "Oliveira II", officialLengthMeters: 198.7, components: [], reviewGuidance: "O candidato encontrado ainda exige validação manual contra o projeto." },
  { ...defaults, id: "T08", technicalName: "José Garcia Lopes Filho", displayName: "José Garcia Lopes Filho", streets: ["José Garcia Lopes Filho"], area: "Oliveira II", officialLengthMeters: 87.05, components: [], reviewGuidance: "Trecho entre Rua Dr. Germano Barros de Souza e Rua Leonel Velasco." },
  { ...defaults, id: "T09", technicalName: "Orlandina de Oliveira Lima", displayName: "Orlandina de Oliveira Lima", streets: ["Orlandina de Oliveira Lima"], area: "Oliveira II", officialLengthMeters: 65.6, components: [], reviewGuidance: "Trecho entre Rua Dr. Germano Barros de Souza e o eixo Leonel Velasco - 01." },
  { ...defaults, id: "T10", technicalName: "Leonel Velasco - 01", displayName: "Leonel Velasco — trecho 2", streets: ["Leonel Velasco"], area: "Oliveira II", officialLengthMeters: 95.28, components: [], reviewGuidance: "Segundo trecho da Rua Leonel Velasco. Não unir automaticamente com T02." },
  { ...defaults, id: "T11", technicalName: "Engenheiro Orlando Oliveira - 01", displayName: "Engenheiro Orlando Oliveira — trecho 2", streets: ["Engenheiro Orlando Oliveira"], area: "Oliveira II", officialLengthMeters: 145.52, components: [], reviewGuidance: "Segundo trecho da Engenheiro Orlando Oliveira. Não unir automaticamente com T03." },
  { ...defaults, id: "T12", technicalName: "Dorothéa de Oliveira", displayName: "Dorothéa de Oliveira", streets: ["Dorothéa de Oliveira"], area: "Trecho contratado no Oliveira II; a via continua pelo Oliveira I", officialLengthMeters: 208.12, components: [], reviewGuidance: "O trecho contratado está no Oliveira II. A continuação dentro do Oliveira I não integra o pavimento deste projeto." },
  {
    ...defaults,
    id: "T13",
    technicalName: "Antônio João Escobar / Júlio Augusto de Campos",
    displayName: "Antônio João Escobar / Júlio Augusto de Campos",
    streets: ["Antônio João Escobar", "Júlio Augusto de Campos"],
    area: "Limite Oliveira I / Oliveira II e interior do Oliveira I",
    officialLengthMeters: 196.7,
    components: [
      { street: "Antônio João Escobar", officialLengthMeters: 68.51 },
      { street: "Júlio Augusto de Campos", officialLengthMeters: 128.19 },
    ],
    reviewGuidance: "Começa na Antônio João Escobar a leste da Rua Dorothéa de Oliveira, curva para a Júlio Augusto de Campos e segue até próximo da Rua João Ribeiro Guimarães.",
  },
  { ...defaults, id: "T14", technicalName: "Saladino Nunes", displayName: "Saladino Nunes", streets: ["Saladino Nunes"], area: "Oliveira I", officialLengthMeters: 61.55, components: [], reviewGuidance: "Trecho entre Rua Dorothéa de Oliveira e Rua Júlio Augusto de Campos." },
];

export const officialTotalLengthMeters = Number(
  officialPavingAxes.reduce((total, axis) => total + axis.officialLengthMeters, 0).toFixed(2),
);

if (officialTotalLengthMeters !== EXPECTED_OFFICIAL_LENGTH_METERS) {
  throw new Error(
    `Soma oficial inválida: esperado ${EXPECTED_OFFICIAL_LENGTH_METERS} m, obtido ${officialTotalLengthMeters} m.`,
  );
}
