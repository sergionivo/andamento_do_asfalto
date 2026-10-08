import {
  EXPECTED_OFFICIAL_LENGTH_METERS,
  officialPavingAxes,
  officialTotalLengthMeters,
} from "../src/data/paving-segments.official";
import { existsSync } from "node:fs";
import path from "node:path";
import { communityEvents } from "../src/data/community-events";
import { validateCommunityEvents } from "../src/lib/community-events";

if (officialPavingAxes.length !== 14) {
  throw new Error(`Esperados 14 eixos oficiais; encontrados ${officialPavingAxes.length}.`);
}

console.log(`Cadastro oficial validado: 14 eixos, ${officialTotalLengthMeters.toFixed(2)} m.`);
console.log(`Total esperado: ${EXPECTED_OFFICIAL_LENGTH_METERS.toFixed(2)} m.`);

const segmentIds = new Set(officialPavingAxes.map((axis) => axis.id));
const communityErrors = validateCommunityEvents(
  communityEvents,
  segmentIds,
  (publicPath) => existsSync(path.join(process.cwd(), "public", publicPath.replace(/^\//, ""))),
);
if (communityErrors.length) throw new Error(`Registros da comunidade inválidos:\n- ${communityErrors.join("\n- ")}`);
console.log(`Registros da comunidade validados: ${communityEvents.length}.`);
