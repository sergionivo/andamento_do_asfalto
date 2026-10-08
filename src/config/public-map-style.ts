import type { ExpressionSpecification } from "maplibre-gl";

export const PUBLIC_MAP_STYLE = {
  paving: {
    defaultOpacity: 0.95,
    technicalContextOpacity: 0.32,
    defaultWidth: ["interpolate", ["linear"], ["zoom"], 13, 5, 18, 9] as ExpressionSpecification,
    technicalContextWidth: ["interpolate", ["linear"], ["zoom"], 13, 4, 18, 7] as ExpressionSpecification,
  },
  drainage: {
    color: "#0891b2",
    casingColor: "#ffffff",
    casingWidth: ["interpolate", ["linear"], ["zoom"], 13, 7, 18, 9] as ExpressionSpecification,
    lineWidth: ["interpolate", ["linear"], ["zoom"], 13, 4, 18, 5] as ExpressionSpecification,
    nodeRadius: ["interpolate", ["linear"], ["zoom"], 13, 7, 18, 9] as ExpressionSpecification,
    nodeStrokeWidth: 2.5,
  },
  sanitation: {
    waterOffset: -5,
    sewerOffset: 5,
    casingColor: "#ffffff",
    casingWidth: 8,
    lineWidth: 4,
  },
} as const;

export interface TechnicalOverlayVisibility {
  drainageVisible: boolean;
  waterVisible: boolean;
  sewerVisible: boolean;
}

export function hasTechnicalOverlay({ drainageVisible, waterVisible, sewerVisible }: TechnicalOverlayVisibility): boolean {
  return drainageVisible || waterVisible || sewerVisible;
}

export function pavingVisualStyle(technicalOverlayVisible: boolean) {
  return technicalOverlayVisible
    ? { opacity: PUBLIC_MAP_STYLE.paving.technicalContextOpacity, width: PUBLIC_MAP_STYLE.paving.technicalContextWidth }
    : { opacity: PUBLIC_MAP_STYLE.paving.defaultOpacity, width: PUBLIC_MAP_STYLE.paving.defaultWidth };
}
