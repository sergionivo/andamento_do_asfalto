import type { OsmCandidateFeature, ValidationGeometryMode } from "@/types/official";

export type Position = [number, number];

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMeters(a: Position, b: Position): number {
  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLon = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(value));
}

export function lineLengthMeters(coordinates: Position[]): number {
  return coordinates.slice(1).reduce((total, point, index) => total + distanceMeters(coordinates[index], point), 0);
}

export function uniqueSelectedWays(features: OsmCandidateFeature[]): OsmCandidateFeature[] {
  const seen = new Set<string>();
  return features.filter((feature) => {
    if (seen.has(feature.properties.osmId)) return false;
    seen.add(feature.properties.osmId);
    return true;
  });
}

export function editingLinesLengthMeters(lines: Position[][]): number {
  return lines.reduce((total, line) => total + lineLengthMeters(line), 0);
}

export function selectedWaysLengthMeters(features: OsmCandidateFeature[]): number {
  return editingLinesLengthMeters(
    uniqueSelectedWays(features).map((feature) => feature.geometry.coordinates),
  );
}

export interface SnappedPoint {
  point: Position;
  segmentIndex: number;
  t: number;
  distanceToLineMeters: number;
}

export interface SnappedLinePoint extends SnappedPoint {
  lineIndex: number;
}

export function selectedWayLines(features: OsmCandidateFeature[]): Position[][] {
  return uniqueSelectedWays(features).map((feature) =>
    feature.geometry.coordinates.map((position) => [...position] as Position),
  );
}

export function snapToLines(point: Position, lines: Position[][]): SnappedLinePoint | null {
  let best: SnappedLinePoint | null = null;
  lines.forEach((line, lineIndex) => {
    const snapped = snapToLine(point, line);
    if (snapped && (!best || snapped.distanceToLineMeters < best.distanceToLineMeters)) {
      best = { ...snapped, lineIndex };
    }
  });
  return best;
}

export const MULTILINE_TRIM_ERROR =
  "Este eixo contém mais de uma geometria. Use os ways completos ou recorte cada trecho individualmente.";

export interface EditingGeometryResult {
  lines: Position[][];
  error: string | null;
}

export function buildEditingGeometry(
  features: OsmCandidateFeature[],
  start: Position | null,
  end: Position | null,
  mode: ValidationGeometryMode,
): EditingGeometryResult {
  const lines = selectedWayLines(features);
  if (mode === "full_ways" || !lines.length) return { lines, error: null };
  if (lines.length > 1) return { lines, error: MULTILINE_TRIM_ERROR };
  if (!start || !end) return { lines, error: "Defina os pontos A e B para concluir o recorte." };
  return { lines: [cropLineBetween(lines[0], start, end)], error: null };
}

export function buildEditingLines(
  features: OsmCandidateFeature[],
  start: Position | null,
  end: Position | null,
): Position[][] {
  return buildEditingGeometry(features, start, end, start && end ? "trimmed" : "full_ways").lines;
}

function interpolate(a: Position, b: Position, t: number): Position {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function editingGeometryIntegrity(
  editingLines: Position[][],
  originalLines: Position[][],
  toleranceMeters = 0.35,
): { valid: boolean; error: string | null } {
  if (!editingLines.some((line) => line.length > 1)) {
    return { valid: false, error: "A geometria em edição está vazia." };
  }
  for (const line of editingLines) {
    for (let index = 0; index < line.length - 1; index += 1) {
      const samples = [0, 0.25, 0.5, 0.75, 1].map((t) => interpolate(line[index], line[index + 1], t));
      const contained = originalLines.some((original) =>
        samples.every((sample) => (snapToLine(sample, original)?.distanceToLineMeters ?? Infinity) <= toleranceMeters),
      );
      if (!contained) {
        return {
          valid: false,
          error: "Erro de integridade: a geometria em edição contém trecho que não pertence aos ways selecionados.",
        };
      }
    }
  }
  return { valid: true, error: null };
}

export function snapToLine(point: Position, line: Position[]): SnappedPoint | null {
  if (line.length < 2) return null;
  const latitudeScale = Math.cos(toRadians(point[1]));
  let best: SnappedPoint | null = null;

  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];
    const ax = (start[0] - point[0]) * latitudeScale;
    const ay = start[1] - point[1];
    const bx = (end[0] - point[0]) * latitudeScale;
    const by = end[1] - point[1];
    const dx = bx - ax;
    const dy = by - ay;
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator));
    const snapped: Position = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
    const candidate: SnappedPoint = {
      point: snapped,
      segmentIndex: index,
      t,
      distanceToLineMeters: distanceMeters(point, snapped),
    };
    if (!best || candidate.distanceToLineMeters < best.distanceToLineMeters) best = candidate;
  }

  return best;
}

export function cropLineBetween(line: Position[], start: Position | null, end: Position | null): Position[] {
  if (!start || !end || line.length < 2) return line;
  const snappedStart = snapToLine(start, line);
  const snappedEnd = snapToLine(end, line);
  if (!snappedStart || !snappedEnd) return line;

  const startOrder = snappedStart.segmentIndex + snappedStart.t;
  const endOrder = snappedEnd.segmentIndex + snappedEnd.t;
  const first = startOrder <= endOrder ? snappedStart : snappedEnd;
  const last = startOrder <= endOrder ? snappedEnd : snappedStart;
  const result: Position[] = [first.point];

  for (let index = first.segmentIndex + 1; index <= last.segmentIndex; index += 1) {
    result.push(line[index]);
  }
  result.push(last.point);

  return result.filter((point, index) => index === 0 || distanceMeters(result[index - 1], point) > 0.01);
}
