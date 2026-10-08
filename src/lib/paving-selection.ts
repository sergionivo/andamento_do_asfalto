import type { PublicSegmentFeature } from "@/types/map";
import type { ExpressionSpecification, FilterSpecification } from "maplibre-gl";
import { PUBLIC_MAP_STYLE } from "@/config/public-map-style";

export const PAVING_SELECTION_MAX_ZOOM = 17;
export const PAVING_SELECTION_DURATION_MS = 650;

export function pavingGeometryBounds(geometry: PublicSegmentFeature["geometry"]): [[number, number], [number, number]] {
  const coordinates = geometry.type === "LineString" ? geometry.coordinates : geometry.coordinates.flat();
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  return [[Math.min(...longitudes), Math.min(...latitudes)], [Math.max(...longitudes), Math.max(...latitudes)]];
}

export function pavingSelectionPadding(mobile: boolean) {
  return mobile
    ? { top: 80, right: 40, bottom: 300, left: 40 }
    : { top: 80, right: 480, bottom: 80, left: 80 };
}

export function pavingOpacityExpression(selectedSegmentId: string | null, technicalOverlayVisible = false): number | ExpressionSpecification {
  if (technicalOverlayVisible) return PUBLIC_MAP_STYLE.paving.technicalContextOpacity;
  return selectedSegmentId
    ? ["case", ["==", ["get", "axisId"], selectedSegmentId], 0.98, 0.62]
    : PUBLIC_MAP_STYLE.paving.defaultOpacity;
}

export const pavingSelectionFilter = (selectedSegmentId: string | null): FilterSpecification => ["==", ["get", "axisId"], selectedSegmentId ?? ""];

export function pavingSelectionAfterSegmentClick(currentSegmentId: string | null, clickedSegmentId: string): string {
  return currentSegmentId === clickedSegmentId ? currentSegmentId : clickedSegmentId;
}

export function isEmptyInteractiveMapClick(renderedFeatureCount: number): boolean {
  return renderedFeatureCount === 0;
}

interface EscapeSelectionContext {
  key: string;
  hasSelectedSegment: boolean;
  hasOpenOverlay: boolean;
  hasEditableTarget: boolean;
}

export function shouldClearPavingSelectionOnEscape({ key, hasSelectedSegment, hasOpenOverlay, hasEditableTarget }: EscapeSelectionContext): boolean {
  return key === "Escape" && hasSelectedSegment && !hasOpenOverlay && !hasEditableTarget;
}
