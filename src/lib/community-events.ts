import { COMMUNITY_OBSERVATION_LABELS } from "@/config/community";
import { communityEvents } from "@/data/community-events";
import { operationalEvents } from "@/data/operational-events";
import { COMMUNITY_OBSERVATION_TYPES, type CommunityEvent } from "@/types/community";
import type { WorkEvent } from "@/types/operational";

export type SegmentTimelineItem =
  | { kind: "official"; occurredAt: string; event: WorkEvent }
  | { kind: "community"; occurredAt: string; event: CommunityEvent };

export function getSegmentCommunityEvents(segmentId: string, events: CommunityEvent[] = communityEvents): CommunityEvent[] {
  return events
    .filter((event) => event.segmentId === segmentId)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export function getLatestCommunityEvent(segmentId: string, events: CommunityEvent[] = communityEvents): CommunityEvent | null {
  return getSegmentCommunityEvents(segmentId, events)[0] ?? null;
}

export function getSegmentTimeline(segmentId: string, officialEvents: WorkEvent[] = operationalEvents, publishedCommunityEvents: CommunityEvent[] = communityEvents): SegmentTimelineItem[] {
  return [
    ...officialEvents.filter((event) => event.segmentId === segmentId).map((event): SegmentTimelineItem => ({ kind: "official", occurredAt: event.date, event })),
    ...publishedCommunityEvents.filter((event) => event.segmentId === segmentId).map((event): SegmentTimelineItem => ({ kind: "community", occurredAt: event.observedAt, event })),
  ].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)) return false;
  return !Number.isNaN(Date.parse(value));
}

export function isSafeCommunityImagePath(src: string, segmentId: string): boolean {
  return new RegExp(`^/community/${segmentId}/[a-zA-Z0-9][a-zA-Z0-9._-]*\\.(?:jpe?g|png|webp)$`).test(src);
}

export function validateCommunityEvents(
  events: CommunityEvent[],
  validSegmentIds: ReadonlySet<string>,
  imageExists?: (publicPath: string) => boolean,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const observationTypes = new Set<string>(COMMUNITY_OBSERVATION_TYPES);

  for (const event of events) {
    const prefix = event.id || "evento sem ID";
    if (ids.has(event.id)) errors.push(`${prefix}: ID duplicado.`);
    ids.add(event.id);
    if (!new RegExp(`^community-${event.segmentId}-\\d{4}-\\d{2}-\\d{2}-\\d{2}$`).test(event.id)) errors.push(`${prefix}: formato de ID inválido.`);
    if (!validSegmentIds.has(event.segmentId)) errors.push(`${prefix}: segmentId inválido.`);
    if (![event.observedAt, event.publishedAt, event.reviewedAt].every(validIsoDate)) errors.push(`${prefix}: data inválida.`);
    if (!observationTypes.has(event.observationType)) errors.push(`${prefix}: observationType desconhecido.`);
    if (event.classification !== "community_report") errors.push(`${prefix}: classificação deve ser community_report.`);
    if (event.reviewStatus !== "reviewed") errors.push(`${prefix}: registro não revisado.`);
    if (event.sourceLabel !== "Registro da comunidade") errors.push(`${prefix}: sourceLabel inválido.`);
    if (!event.title.trim()) errors.push(`${prefix}: título vazio.`);
    if ((event.images?.length ?? 0) > 4) errors.push(`${prefix}: máximo de quatro imagens excedido.`);
    if (event.observationType === "apparently_stopped" && /paralisad[ao]/i.test(`${event.title} ${event.description ?? ""}`)) errors.push(`${prefix}: relato comunitário não pode declarar obra paralisada.`);
    for (const image of event.images ?? []) {
      if (!isSafeCommunityImagePath(image.src, event.segmentId)) errors.push(`${prefix}: caminho de imagem inválido (${image.src}).`);
      else if (imageExists && !imageExists(image.src)) errors.push(`${prefix}: imagem não encontrada (${image.src}).`);
      if (!image.alt.trim()) errors.push(`${prefix}: imagem sem texto alternativo.`);
    }
  }

  return errors;
}

export function communityObservationLabel(type: CommunityEvent["observationType"]): string {
  return COMMUNITY_OBSERVATION_LABELS[type];
}
