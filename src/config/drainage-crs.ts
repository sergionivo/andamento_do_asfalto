import proj4 from "proj4";

export const DRAINAGE_SOURCE_CRS = {
  code: "EPSG:31981",
  name: "SIRGAS 2000 / UTM zone 21S",
  proj4Definition: "+proj=utm +zone=21 +south +ellps=GRS80 +units=m +no_defs +type=crs",
  validationStatus: "validated_against_project_drawings",
  rationale: "Transformação conferida visualmente contra as Pranchas 12, 13, 15, 16 e 17 do Projeto Executivo.",
} as const;

export const DRAINAGE_TARGET_CRS = "EPSG:4326" as const;
proj4.defs(DRAINAGE_SOURCE_CRS.code, DRAINAGE_SOURCE_CRS.proj4Definition);

export function drainageCoordinateToWgs84(x: number, y: number): [number, number] {
  const [longitude, latitude] = proj4(DRAINAGE_SOURCE_CRS.code, DRAINAGE_TARGET_CRS, [x, y]);
  return [longitude, latitude];
}
