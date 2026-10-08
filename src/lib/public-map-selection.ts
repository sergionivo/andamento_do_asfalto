import type { DrainageGeoJsonProperties } from "@/types/drainage";
import type { PublicSegmentProperties } from "@/types/map";
import type { SanitationProperties } from "@/types/sanitation";

export type PublicMapSelection =
  | { type: "paving"; properties: PublicSegmentProperties }
  | { type: "drainage"; properties: DrainageGeoJsonProperties }
  | { type: "sanitation"; properties: SanitationProperties };

export const selectPaving = (properties: PublicSegmentProperties): PublicMapSelection => ({ type: "paving", properties });
export const selectDrainage = (properties: DrainageGeoJsonProperties): PublicMapSelection => ({ type: "drainage", properties });
export const selectSanitation = (properties: SanitationProperties): PublicMapSelection => ({ type: "sanitation", properties });
