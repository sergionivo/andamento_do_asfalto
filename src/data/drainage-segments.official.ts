import { DRAINAGE_SOURCE } from "@/data/drainage-nodes.official";
import type { DrainageSegment } from "@/types/drainage";

const segment = (id: DrainageSegment["id"], basin: DrainageSegment["basin"], startNode: string, endNode: string, officialLengthMeters: number | null, diameterMeters: number | null, endsAtExistingDrainage = false): DrainageSegment => ({
  id, basin, startNode, endNode, officialLengthMeters, diameterMeters, material: null,
  validationStatus: officialLengthMeters === null || diameterMeters === null ? "pending_document_check" : "confirmed",
  endsAtExistingDrainage, source: DRAINAGE_SOURCE,
});

export const officialDrainageSegments: DrainageSegment[] = [
  segment("T-01", "Bacia 02", "BACIA02_PV1", "BACIA02_PV2", 53.00, 0.60),
  segment("T-02", "Bacia 02", "BACIA02_PV2", "BACIA02_PV3", 53.00, 0.60),
  segment("T-03", "Bacia 02", "BACIA02_PV3", "BACIA02_PV4", 53.00, 0.60),
  segment("T-04", "Bacia 02", "BACIA02_PV4", "BACIA02_PV5", 53.00, 0.60),
  segment("T-05", "Bacia 02", "BACIA02_PV5", "BACIA02_PV6", 53.00, null),
  segment("T-06", "Bacia 02", "BACIA02_PV6", "BACIA02_PV7", 58.23, 0.60),
  segment("T-07", "Bacia 02", "BACIA02_PV7", "BACIA02_PV8", 45.12, 0.60),
  segment("T-08", "Bacia 02", "BACIA02_PV8", "BACIA02_PV9", 73.21, 0.60),
  segment("T-09", "Bacia 02", "BACIA02_PV9", "BACIA02_PV10", 75.15, 0.80),
  segment("T-10", "Bacia 02", "BACIA02_PV10", "BACIA02_PV11", 31.15, 0.80),
  segment("T-11", "Bacia 02", "BACIA02_PV11", "BACIA02_PV12", null, null),
  segment("T-12", "Bacia 02", "BACIA02_PV12", "BACIA02_PV13", 59.58, 0.80),
  segment("T-13", "Bacia 02", "BACIA02_PV13", "PV0_BACIA02", 89.00, 0.80, true),
  segment("T-15", "Bacia 01", "BACIA01_PV15", "BACIA01_PV16", 69.13, 0.60),
  segment("T-16", "Bacia 01", "BACIA01_PV16", "BACIA01_PV17", 10.32, 0.60),
  segment("T-17", "Bacia 01", "BACIA01_PV17", "BACIA01_PV18", 91.08, 0.60),
  segment("T-18", "Bacia 01", "BACIA01_PV18", "BACIA01_PV19", 73.26, 0.80),
  segment("T-19", "Bacia 01", "BACIA01_PV19", "BACIA01_PV22", 72.90, 0.80),
  segment("T-20", "Bacia 01", "BACIA01_PV20", "BACIA01_PV21", 80.00, 0.60),
  segment("T-21", "Bacia 01", "BACIA01_PV21", "BACIA01_PV22", 80.00, null),
  segment("T-22", "Bacia 01", "BACIA01_PV22", "BACIA01_PV23", 74.44, 0.80),
  segment("T-23", "Bacia 01", "BACIA01_PV23", "PV0_BACIA01", 74.44, 0.80, true),
];
