import type { DrainageNode, DrainageSource } from "@/types/drainage";

export const DRAINAGE_SOURCE: DrainageSource = {
  scope: "Projeto Executivo — Lote 22",
  document: "Projeto de Infraestrutura — Lote 22 — Pranchas 04 a 14",
  primarySheets: ["Prancha 12 — Projeto Executivo — Drenagem", "Prancha 13 — Projeto Executivo — Drenagem"],
};

const node = (id: string, displayId: string, basin: DrainageNode["basin"], x: number, y: number, depthMeters: number): DrainageNode => ({ id, displayId, basin, x, y, depthMeters, groundElevation: null, invertElevation: null, source: DRAINAGE_SOURCE });

export const officialDrainageNodes: DrainageNode[] = [
  node("BACIA02_PV1", "PV1", "Bacia 02", 743841.171, 7734608.489, 2.10),
  node("BACIA02_PV2", "PV2", "Bacia 02", 743893.651, 7734601.087, 2.10),
  node("BACIA02_PV3", "PV3", "Bacia 02", 743946.127, 7734593.650, 2.10),
  node("BACIA02_PV4", "PV4", "Bacia 02", 743998.599, 7734586.185, 2.10),
  node("BACIA02_PV5", "PV5", "Bacia 02", 744051.070, 7734578.719, 2.10),
  node("BACIA02_PV6", "PV6", "Bacia 02", 744103.542, 7734571.254, 2.51),
  node("BACIA02_PV7", "PV7", "Bacia 02", 744161.191, 7734563.052, 2.11),
  node("BACIA02_PV8", "PV8", "Bacia 02", 744205.887, 7734556.863, 2.11),
  node("BACIA02_PV9", "PV9", "Bacia 02", 744278.433, 7734546.990, 2.40),
  node("BACIA02_PV10", "PV10", "Bacia 02", 744285.839, 7734472.209, 2.11),
  node("BACIA02_PV11", "PV11", "Bacia 02", 744288.909, 7734441.215, 2.25),
  node("BACIA02_PV12", "PV12", "Bacia 02", 744293.277, 7734397.114, 2.75),
  node("BACIA02_PV13", "PV13", "Bacia 02", 744302.256, 7734338.210, 2.38),
  node("PV0_BACIA02", "PV0", "Bacia 02", 744311.512, 7734249.691, 1.84),
  node("BACIA01_PV15", "PV15", "Bacia 01", 743610.484, 7734493.646, 1.50),
  node("BACIA01_PV16", "PV16", "Bacia 01", 743573.127, 7734435.480, 1.50),
  node("BACIA01_PV17", "PV17", "Bacia 01", 743571.670, 7734425.264, 1.70),
  node("BACIA01_PV18", "PV18", "Bacia 01", 743661.839, 7734412.410, 1.93),
  node("BACIA01_PV19", "PV19", "Bacia 01", 743651.293, 7734339.912, 1.77),
  node("BACIA01_PV20", "PV20", "Bacia 01", 743484.191, 7734289.774, 1.60),
  node("BACIA01_PV21", "PV21", "Bacia 01", 743563.414, 7734278.649, 1.60),
  node("BACIA01_PV22", "PV22", "Bacia 01", 743642.636, 7734267.524, 1.82),
  node("BACIA01_PV23", "PV23", "Bacia 01", 743716.351, 7734257.173, 2.15),
  node("PV0_BACIA01", "PV0", "Bacia 01", 743790.019, 7734246.494, 2.33),
];
