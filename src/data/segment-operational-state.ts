import { officialPavingAxes } from "@/data/paving-segments.official";
import { getSegmentOperationalState } from "@/lib/operational-data";

// Camada derivada: nunca editar manualmente. É recalculada a partir de operational-events.ts.
export const segmentOperationalStates = officialPavingAxes.map((axis) => getSegmentOperationalState(axis.id));
