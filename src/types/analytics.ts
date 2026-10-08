export type AnalyticsConsent = "granted" | "denied";

export type AnalyticsEventName =
  | "map_loaded"
  | "segment_selected"
  | "segment_details_opened"
  | "layer_drainage_enabled"
  | "layer_water_enabled"
  | "layer_sewer_enabled"
  | "geolocation_requested"
  | "geolocation_success"
  | "geolocation_error"
  | "menu_opened"
  | "share_clicked"
  | "share_native_opened"
  | "share_link_copied"
  | "community_update_opened"
  | "community_update_submitted"
  | "community_update_error";

export interface AnalyticsEventParameters {
  segment_id?: string;
  layer_name?: "drainage" | "water" | "sewer";
  share_method?: "native" | "clipboard";
  error_type?: string;
  source_type?: "map" | "segment_details";
}

type GtagCommand = "config" | "consent" | "event" | "js";
type GtagArguments = [GtagCommand, ...unknown[]];
type ClarityArguments = [string, ...unknown[]];

declare global {
  interface Window {
    dataLayer?: GtagArguments[];
    gtag?: (...args: GtagArguments) => void;
    clarity?: (...args: ClarityArguments) => void;
    __oliveiraGaInitialized?: boolean;
  }
}

export {};
