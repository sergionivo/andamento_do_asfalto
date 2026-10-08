import { operationalEvents } from "@/data/operational-events";
import type { SegmentOperationalState, WorkEvent } from "@/types/operational";

export function getSegmentEvents(segmentId: string, events: WorkEvent[] = operationalEvents): WorkEvent[] {
  return events.filter((event) => event.segmentId === segmentId).sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function emptySegmentOperationalState(segmentId: string): SegmentOperationalState {
  return { segmentId, currentStage: null, currentStatus: "no_public_update", currentResponsible: null, blockage: null, dependency: null, nextAction: null, nextStage: null, forecastType: "sem_previsao_divulgada", forecastValue: null, lastUpdatedAt: null, lastEvidenceId: null };
}

export function getSegmentOperationalState(segmentId: string, events: WorkEvent[] = operationalEvents): SegmentOperationalState {
  const latest = getSegmentEvents(segmentId, events)[0];
  if (!latest) return emptySegmentOperationalState(segmentId);
  return { segmentId, currentStage: latest.stage, currentStatus: latest.status, currentResponsible: latest.responsibleParty, blockage: latest.blockage, dependency: latest.dependency, nextAction: latest.nextAction, nextStage: latest.nextStage, forecastType: latest.forecast?.type ?? "sem_previsao_divulgada", forecastValue: latest.forecast?.value ?? null, lastUpdatedAt: latest.date, lastEvidenceId: latest.id };
}
