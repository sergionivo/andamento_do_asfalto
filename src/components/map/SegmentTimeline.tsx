import { CLASSIFICATION_LABELS } from "@/config/operational";
import type { WorkEvent } from "@/types/operational";

export function SegmentTimeline({ events }: { events: WorkEvent[] }) {
  if (!events.length) return <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Nenhum evento de execução publicado para este trecho até o momento.</p>;
  return <ol className="space-y-4">{events.map((event) => <li key={event.id} className="relative border-l-2 border-slate-200 pl-4 text-sm"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-blue-600" /><time className="text-xs font-bold text-slate-500" dateTime={event.date}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(event.date))}</time><h4 className="mt-1 font-extrabold text-slate-950">{event.title}</h4><p className="mt-1 text-slate-600">{event.description}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2 py-1 font-bold text-blue-800">{CLASSIFICATION_LABELS[event.classification]}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{event.sourceTitle}</span></div></li>)}</ol>;
}
