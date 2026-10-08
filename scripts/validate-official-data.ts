import {
  EXPECTED_OFFICIAL_LENGTH_METERS,
  officialPavingAxes,
  officialTotalLengthMeters,
} from "../src/data/paving-segments.official";

if (officialPavingAxes.length !== 14) {
  throw new Error(`Esperados 14 eixos oficiais; encontrados ${officialPavingAxes.length}.`);
}

console.log(`Cadastro oficial validado: 14 eixos, ${officialTotalLengthMeters.toFixed(2)} m.`);
console.log(`Total esperado: ${EXPECTED_OFFICIAL_LENGTH_METERS.toFixed(2)} m.`);
