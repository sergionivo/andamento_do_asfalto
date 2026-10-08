import type { StreetAliasEntry } from "@/types/official";

export const streetAliases: StreetAliasEntry[] = [
  {
    canonicalName: "Antônio Vieira d’Almeida",
    aliases: ["Antônio Vieira de Almeida", "Antônio Vieira"],
  },
  {
    canonicalName: "Professora Maria Lúcia Passarelli",
    aliases: [
      "Rua Professora Maria Lúcia Passarelli",
      "Profª Maria Lucia Passarelli",
      "Prof. Maria Lúcia Passarelli",
      "Professor Maria Lúcia Passarelli",
      "Maria Lúcia Passarelli",
    ],
  },
  {
    canonicalName: "Doutor Germano Barros de Souza",
    aliases: [
      "Rua Doutor Germano Barros de Souza",
      "Dr. Germano Barros de Souza",
      "Rua Dr. Germano Barros de Souza",
      "Germano Barros de Souza",
      // Grafia encontrada no OpenStreetMap em 07/10/2026 (way/154525554).
      "Rua Dourtor Germano Barros de Souza",
    ],
  },
  {
    canonicalName: "Fidelo Mariana Almeida",
    aliases: ["Fidelo Mariana de Almeida", "Fidelo Mariano de Almeida"],
  },
  {
    canonicalName: "Dorothéa de Oliveira",
    aliases: ["Dorothea de Oliveira"],
  },
];

export function aliasesForStreet(canonicalName: string): string[] {
  return streetAliases.find((entry) => entry.canonicalName === canonicalName)?.aliases ?? [];
}
