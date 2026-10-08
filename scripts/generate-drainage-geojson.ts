import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDrainageGeoJson } from "../src/lib/drainage-data";

async function main() {
  const outputPath = path.join(process.cwd(), "src/data/generated/drainage.project.validated.geojson");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(buildDrainageGeoJson(), null, 2)}\n`, "utf8");
  console.log(`Drenagem gerada em ${outputPath}`);
}

void main();
