import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { officialPavingAxes } from "@/data/paving-segments.official";
import { editingGeometryIntegrity, selectedWayLines, type Position } from "@/lib/geometry-editing";
import { readValidatedGeometries, saveValidatedGeometry } from "@/lib/geometry-validation-store";
import type { OsmCandidateCollection, ValidatedGeometryFeature } from "@/types/official";

const unavailable = () => NextResponse.json({ error: "Rota disponível apenas em desenvolvimento." }, { status: 404 });
const candidatesPath = path.join(process.cwd(), "src/data/generated/osm-street-candidates.geojson");

function featureLines(feature: ValidatedGeometryFeature): Position[][] {
  return feature.geometry.type === "LineString"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") return unavailable();
  return NextResponse.json(await readValidatedGeometries());
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return unavailable();

  const feature = (await request.json()) as ValidatedGeometryFeature;
  const axis = officialPavingAxes.find((item) => item.id === feature?.properties?.axisId);
  const coordinates = feature?.geometry?.coordinates;

  if (
    !axis ||
    feature.type !== "Feature" ||
    !["LineString", "MultiLineString"].includes(feature.geometry?.type) ||
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    feature.properties.geometrySource !== "OpenStreetMap" ||
    feature.properties.geometryStatus !== "validated" ||
    feature.properties.validationMethod !== "manual" ||
    !["full_ways", "trimmed"].includes(feature.properties.validationGeometryMode) ||
    feature.properties.officialLengthMeters !== axis.officialLengthMeters ||
    !Array.isArray(feature.properties.osmWayIds) ||
    !feature.properties.osmWayIds.length
  ) {
    return NextResponse.json({ error: "Geometria ou metadados inválidos." }, { status: 400 });
  }

  const candidates = JSON.parse(await readFile(candidatesPath, "utf8")) as OsmCandidateCollection;
  const wayIds = [...new Set(feature.properties.osmWayIds)];
  const selected = candidates.features.filter((candidate) => wayIds.includes(candidate.properties.osmId));
  if (selected.length !== wayIds.length) {
    return NextResponse.json({ error: "Um ou mais ways selecionados não existem no arquivo de candidatos." }, { status: 400 });
  }

  const originalLines = selectedWayLines(selected);
  const editingLines = featureLines(feature);
  const integrity = editingGeometryIntegrity(editingLines, originalLines);
  if (!integrity.valid) {
    return NextResponse.json({ error: integrity.error }, { status: 400 });
  }
  if (
    feature.properties.validationGeometryMode === "full_ways" &&
    JSON.stringify(editingLines) !== JSON.stringify(originalLines)
  ) {
    return NextResponse.json({ error: "No modo ways completos, a geometria deve preservar integralmente os ways selecionados." }, { status: 400 });
  }

  const updated = await saveValidatedGeometry(feature);
  return NextResponse.json(updated, { status: 201 });
}
