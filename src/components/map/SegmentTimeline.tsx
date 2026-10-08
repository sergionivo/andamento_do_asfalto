"use client";

import Image from "next/image";
import { useState } from "react";
import { CLASSIFICATION_LABELS } from "@/config/operational";
import { getSegmentTimeline } from "@/lib/community-events";
import type { CommunityEvent, CommunityImage } from "@/types/community";
import type { WorkEvent } from "@/types/operational";
import { CommunityImageLightbox } from "./CommunityImageLightbox";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" });

export function SegmentTimeline({ segmentId, events, communityEvents }: { segmentId: string; events: WorkEvent[]; communityEvents?: CommunityEvent[] }) {
  const [activeImage, setActiveImage] = useState<CommunityImage | null>(null);
  const timeline = getSegmentTimeline(segmentId, events, communityEvents);
  if (!timeline.length) return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Nenhum evento de execução ou registro da comunidade foi publicado para este trecho até o momento.</p>;

  return <><ol className="space-y-5">{timeline.map((item) => {
    if (item.kind === "official") {
      const event = item.event;
      return <li key={`official-${event.id}`} className="relative border-l-2 border-blue-200 pl-4 text-sm"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-blue-700" /><time className="text-xs font-bold text-slate-500" dateTime={event.date}>{dateFormatter.format(new Date(event.date))}</time><p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-blue-800">🏛️ {CLASSIFICATION_LABELS[event.classification]}</p><h4 className="mt-1 font-extrabold text-slate-950">{event.title}</h4><p className="mt-1 text-slate-600">{event.description}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{event.sourceTitle}</span></div></li>;
    }
    const event = item.event;
    return <li key={`community-${event.id}`} className="relative border-l-2 border-amber-300 pl-4 text-sm"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-amber-600" /><time className="text-xs font-bold text-slate-500" dateTime={event.observedAt}>{dateFormatter.format(new Date(event.observedAt))}</time><p className="mt-1 text-xs font-extrabold uppercase tracking-wide text-amber-800">📷 Registro da comunidade</p><h4 className="mt-1 font-extrabold text-slate-950">{event.title}</h4>{event.description && <p className="mt-1 text-slate-600">{event.description}</p>}{event.images?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{event.images.map((image) => <button type="button" key={image.src} onClick={() => setActiveImage(image)} aria-label={`Ampliar foto: ${image.alt}`} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><Image src={image.src} alt={image.alt} fill sizes="(max-width: 768px) 30vw, 110px" className="object-cover" /></button>)}</div> : null}<p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950" title="Este registro foi revisado antes da publicação, mas não representa informação oficial da obra.">Registro revisado antes da publicação. Não representa informação oficial da obra.</p></li>;
  })}</ol><CommunityImageLightbox image={activeImage} onClose={() => setActiveImage(null)} /></>;
}
