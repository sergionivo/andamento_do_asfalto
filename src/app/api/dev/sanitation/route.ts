import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { sanitationSegmentsOverlap, validateSanitationFeature } from "@/lib/sanitation-geometry";
import { readSanitation, removeSanitation, saveSanitationBatch } from "@/lib/sanitation-store";
import type { OsmCandidateCollection } from "@/types/official";
import type { SanitationFeature, SanitationNetworkType } from "@/types/sanitation";

const unavailable = () => NextResponse.json({ error: "Rota disponível apenas em desenvolvimento." }, { status: 404 });
const validNetwork = (value: unknown): value is SanitationNetworkType => value === "water" || value === "sewer";
export async function GET(request: Request) { if (process.env.NODE_ENV !== "development") return unavailable(); const type = new URL(request.url).searchParams.get("type"); if (!validNetwork(type)) return NextResponse.json({ error: "Rede inválida." }, { status: 400 }); return NextResponse.json(await readSanitation(type)); }
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return unavailable(); const body = await request.json() as SanitationFeature | SanitationFeature[]; const features = Array.isArray(body) ? body : [body];
  const candidates = JSON.parse(await readFile(path.join(process.cwd(), "src/data/generated/osm-sanitation-corridors.geojson"), "utf8")) as OsmCandidateCollection;
  const errors = features.flatMap((feature) => validateSanitationFeature(feature, candidates.features)); const first = features[0];
  if (!first || !validNetwork(first.properties.networkType) || features.some((feature) => feature.properties.networkType !== first.properties.networkType || feature.properties.geometryStatus !== "validated" || !feature.properties.validatedAt)) errors.push("Metadados de validação inválidos.");
  if (new Set(features.map((feature) => feature.properties.id)).size !== features.length) errors.push("IDs de segmentos duplicados na operação.");
  if (first) {
    const current = await readSanitation(first.properties.networkType); const replacing = new Set(features.map((feature) => feature.properties.id)); const combined = [...current.features.filter((feature) => !replacing.has(feature.properties.id)), ...features];
    for (let i = 0; i < combined.length; i += 1) for (let j = i + 1; j < combined.length; j += 1) {
      const a = combined[i]; const b = combined[j]; if (a.properties.osmWayId !== b.properties.osmWayId) continue;
      const original = candidates.features.find((candidate) => candidate.properties.osmId === a.properties.osmWayId);
      if (original && sanitationSegmentsOverlap(a.geometry.coordinates, b.geometry.coordinates, original.geometry.coordinates)) errors.push("Este trecho se sobrepõe a outro segmento já cadastrado para esta rede.");
    }
  }
  if (errors.length) return NextResponse.json({ error: [...new Set(errors)].join(" ") }, { status: 400 }); return NextResponse.json(await saveSanitationBatch(features), { status: 201 });
}
export async function DELETE(request: Request) {
  if (process.env.NODE_ENV !== "development") return unavailable(); const body = await request.json() as { networkType?: unknown; id?: unknown };
  if (!validNetwork(body.networkType) || typeof body.id !== "string") return NextResponse.json({ error: "Remoção inválida." }, { status: 400 }); return NextResponse.json(await removeSanitation(body.networkType, body.id));
}
