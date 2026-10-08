import { cropLineBetween, distanceMeters, snapToLine, type Position } from "@/lib/geometry-editing";
import type { OsmCandidateFeature } from "@/types/official";
import type { SanitationGeometryMode, SanitationNetworkType } from "@/types/sanitation";

export type SanitationEndpointMode = "start" | "end" | null;
export type SanitationDraftMode = "idle" | "define_start" | "define_end" | "ready";

export interface SanitationUiState {
  selectedCorridorId: string | null;
  editingNetwork: SanitationNetworkType | null;
  draftMode: SanitationDraftMode;
}

export const INITIAL_SANITATION_UI_STATE: SanitationUiState = {
  selectedCorridorId: null,
  editingNetwork: null,
  draftMode: "idle",
};

export interface SanitationDraftFragment {
  coordinates: Position[];
  geometryMode: SanitationGeometryMode;
  id?: string;
  segmentIndex?: number;
}

export interface SanitationDraft {
  networkType: SanitationNetworkType;
  candidate: OsmCandidateFeature;
  start: Position | null;
  end: Position | null;
  fragments: SanitationDraftFragment[];
  pendingIdentity?: SanitationDraftFragment;
}

interface EndpointClickResult {
  draft: SanitationDraft;
  nextMode: SanitationEndpointMode;
  error: string | null;
}

export const ENDPOINTS_TOO_CLOSE_MESSAGE = "O início e o fim do trecho estão muito próximos.";

export const sanitationEndpointMode = (mode: SanitationDraftMode): SanitationEndpointMode =>
  mode === "define_start" ? "start" : mode === "define_end" ? "end" : null;

export const sanitationDraftModeAfterClick = (mode: SanitationEndpointMode): SanitationDraftMode =>
  mode === "end" ? "define_end" : mode === null ? "ready" : "define_start";

export const sanitationCtaLabel = (networkType: SanitationNetworkType, count: number) =>
  `${count > 0 ? "Adicionar outro" : "Adicionar"} trecho de ${networkType === "water" ? "água" : "esgoto"}`;

export function sanitationDraftHasChanges(draft: SanitationDraft | null | undefined): boolean {
  return Boolean(draft && (draft.start || draft.end || draft.fragments.length || draft.pendingIdentity));
}

export function selectSanitationCorridor(
  state: SanitationUiState,
  corridorId: string,
  hasUnsavedDraft: boolean,
): { state: SanitationUiState; requiresConfirmation: boolean } {
  if (state.selectedCorridorId === corridorId) return { state, requiresConfirmation: false };
  if (hasUnsavedDraft) return { state, requiresConfirmation: true };
  return {
    state: { selectedCorridorId: corridorId, editingNetwork: null, draftMode: "idle" },
    requiresConfirmation: false,
  };
}

export function startSanitationEditing(state: SanitationUiState, networkType: SanitationNetworkType): SanitationUiState {
  if (!state.selectedCorridorId) return state;
  return { ...state, editingNetwork: networkType, draftMode: "define_start" };
}

export function cancelSanitationEditing(state: SanitationUiState): SanitationUiState {
  return { ...state, editingNetwork: null, draftMode: "idle" };
}

export function closeSanitationCorridor(): SanitationUiState {
  return INITIAL_SANITATION_UI_STATE;
}

export function applySanitationEndpointClick(
  draft: SanitationDraft,
  mode: Exclude<SanitationEndpointMode, null>,
  clickedPoint: Position,
  hitOsmWayId: string,
  minimumLengthMeters = 0.5,
): EndpointClickResult | null {
  if (hitOsmWayId !== draft.candidate.properties.osmId) return null;

  const snapped = snapToLine(clickedPoint, draft.candidate.geometry.coordinates);
  if (!snapped) return null;

  if (mode === "start") {
    return {
      draft: { ...draft, start: snapped.point, end: null },
      nextMode: "end",
      error: null,
    };
  }

  if (draft.start && distanceMeters(draft.start, snapped.point) < minimumLengthMeters) {
    return { draft: { ...draft, end: null }, nextMode: "end", error: ENDPOINTS_TOO_CLOSE_MESSAGE };
  }

  return {
    draft: { ...draft, end: snapped.point },
    nextMode: null,
    error: null,
  };
}

export function sanitationDraftGeometry(draft: SanitationDraft): Position[] | null {
  if (!draft.start || !draft.end) return null;
  const coordinates = cropLineBetween(draft.candidate.geometry.coordinates, draft.start, draft.end);
  return coordinates.length > 1 ? coordinates : null;
}

export function sanitationEndpointFeatures(draft: SanitationDraft | null) {
  return {
    type: "FeatureCollection" as const,
    features: draft
      ? [
          draft.start && { type: "Feature" as const, properties: { label: "A" }, geometry: { type: "Point" as const, coordinates: draft.start } },
          draft.end && { type: "Feature" as const, properties: { label: "B" }, geometry: { type: "Point" as const, coordinates: draft.end } },
        ].filter((feature): feature is NonNullable<typeof feature> => Boolean(feature))
      : [],
  };
}

export function appendSanitationDraftFragment(draft: SanitationDraft, coordinates: Position[]): SanitationDraft {
  return {
    ...draft,
    start: null,
    end: null,
    pendingIdentity: undefined,
    fragments: [
      ...draft.fragments,
      { ...draft.pendingIdentity, coordinates, geometryMode: "trimmed" },
    ],
  };
}
