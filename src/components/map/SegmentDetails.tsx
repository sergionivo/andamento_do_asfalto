import { Fragment, useState } from "react";
import { FORECAST_LABELS, WORK_STAGE_LABELS } from "@/config/operational";
import { STATUS_CONFIG } from "@/config/statuses";
import { PUBLIC_WORK_COPY } from "@/config/public-work-copy";
import { formatApproximateLength } from "@/lib/public-formatters";
import { getLatestCommunityEvent } from "@/lib/community-events";
import { trackEvent } from "@/lib/analytics";
import type { PublicSegmentProperties } from "@/types/map";
import { SegmentTimeline } from "./SegmentTimeline";
import { CommunityContributionForm } from "./CommunityContributionForm";

interface Props { segment: PublicSegmentProperties; onClose: () => void; onShare: () => void }
const undisclosed = PUBLIC_WORK_COPY.unknownStage;

export function SegmentDetails({ segment, onClose, onShare }: Props) {
  const [expandedAxisId, setExpandedAxisId] = useState<string | null>(null);
  const [contributionOpen, setContributionOpen] = useState(false);
  const state = segment.operationalState;
  const status = STATUS_CONFIG[segment.operationalStatus];
  const scope = PUBLIC_WORK_COPY.scope[segment.scopeStatus];
  const operationalCopy = PUBLIC_WORK_COPY.operational[segment.operationalStatus];
  const expanded = expandedAxisId === segment.axisId;
  const sources = Array.from(new Map(segment.events.map((event) => [event.sourceTitle, event])).values());
  const latestCommunityEvent = getLatestCommunityEvent(segment.axisId);
  const toggleDetails = () => {
    const nextExpanded = !expanded;
    setExpandedAxisId(nextExpanded ? segment.axisId : null);
    if (nextExpanded) trackEvent("segment_details_opened", { segment_id: segment.axisId });
  };
  const openContribution = () => {
    trackEvent("community_update_opened", { segment_id: segment.axisId });
    setContributionOpen(true);
  };

  return <Fragment><aside aria-label={`Detalhes de ${segment.displayName}`} className={`pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.14)] ${expanded ? "max-h-[80dvh]" : "max-h-[72dvh]"} md:max-h-[calc(100dvh-2.5rem)] md:w-[380px] md:rounded-2xl md:shadow-xl`}>
    <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 md:pt-6">
      <div><h2 className="text-[1.375rem] font-extrabold leading-tight text-slate-950">{segment.displayName}</h2><p className="mt-1 text-base leading-snug text-slate-700"><span className="block min-[360px]:inline">{segment.area}</span><span className="hidden min-[360px]:inline"> · </span><span className="block min-[360px]:inline first-letter:uppercase">{formatApproximateLength(segment.officialLengthMeters)}</span></p></div>
      <div className="flex shrink-0 gap-1"><button type="button" onClick={onShare} aria-label="Compartilhar Oliveira com Asfalto" title="Compartilhar" className="map-icon-button"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" /></svg></button><button type="button" onClick={onClose} aria-label="Fechar detalhes do trecho" className="map-icon-button">×</button></div>
    </header>
    <div className="min-h-0 overflow-y-auto px-6">
      <div className="space-y-5 border-b border-slate-200 py-5"><section><h3 className="text-[0.9375rem] font-bold text-slate-700">Situação da rua</h3><p className="mt-2 inline-flex rounded-full bg-violet-100 px-3 py-1.5 text-base font-extrabold text-violet-950">{scope.label}</p><p className="mt-2 text-base leading-[1.5] text-slate-700">{scope.description}</p></section><section><h3 className="text-[0.9375rem] font-bold text-slate-700">Andamento oficial</h3><p className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900"><span className="size-2.5 rounded-full" style={{ backgroundColor: status.color }} />{status.label}</p><p className="mt-1 text-base leading-[1.5] text-slate-700">{operationalCopy?.description ?? status.description}</p></section>{state.currentStage && <section><h3 className="text-[0.9375rem] font-bold text-slate-700">Etapa atual</h3><p className="mt-1 text-base font-semibold text-slate-900">{WORK_STAGE_LABELS[state.currentStage]}</p></section>}{state.currentResponsible && <section><h3 className="text-[0.9375rem] font-bold text-slate-700">Responsável atual</h3><p className="mt-1 text-base font-semibold text-slate-900">{state.currentResponsible}</p></section>}{latestCommunityEvent && <section className="rounded-2xl bg-amber-50 p-4"><h3 className="text-sm font-bold text-amber-900">Último registro da comunidade</h3><p className="mt-1 text-base font-extrabold text-slate-950">📷 {latestCommunityEvent.title}</p><time dateTime={latestCommunityEvent.observedAt} className="mt-1 block text-sm text-slate-600">{new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(latestCommunityEvent.observedAt))}</time><button type="button" onClick={() => setExpandedAxisId(segment.axisId)} className="mt-2 min-h-11 font-bold text-blue-800 underline">Ver registro</button></section>}<section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4"><h3 className="text-[1.0625rem] font-extrabold text-slate-950">Viu mudança na rua?</h3><p className="mt-1 text-base leading-relaxed text-slate-700">Ajude o bairro a acompanhar a obra.</p></section><button type="button" onClick={toggleDetails} aria-expanded={expanded} className="flex min-h-12 w-full items-center justify-between rounded-xl px-1 text-left text-base font-bold text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><span>{expanded ? "Ocultar detalhes técnicos" : "Ver detalhes técnicos"}</span><span aria-hidden="true">{expanded ? "⌃" : "›"}</span></button></div>
      {expanded && <div className="space-y-6 py-5">
        <section><h3 className="text-lg font-extrabold text-slate-950">Detalhes completos</h3><dl className="mt-3 grid gap-3 text-base leading-[1.45]"><div><dt className="font-bold text-slate-600">Situação no projeto</dt><dd>{scope.label}</dd></div><div><dt className="font-bold text-slate-600">Andamento</dt><dd>{status.label}</dd></div><div><dt className="font-bold text-slate-600">Etapa atual</dt><dd>{state.currentStage ? WORK_STAGE_LABELS[state.currentStage] : undisclosed}</dd></div><div><dt className="font-bold text-slate-600">Responsável atual</dt><dd>{state.currentResponsible ?? undisclosed}</dd></div><div><dt className="font-bold text-slate-600">Próxima ação</dt><dd>{state.nextAction ?? undisclosed}</dd></div><div><dt className="font-bold text-slate-600">Próxima etapa</dt><dd>{state.nextStage ? WORK_STAGE_LABELS[state.nextStage] : undisclosed}</dd></div><div><dt className="font-bold text-slate-600">Bloqueio</dt><dd>{state.blockage ?? PUBLIC_WORK_COPY.noConfirmedBlockage}</dd></div><div><dt className="font-bold text-slate-600">Previsão</dt><dd>{state.forecastValue ? `${FORECAST_LABELS[state.forecastType]}: ${state.forecastValue}` : PUBLIC_WORK_COPY.noForecast}</dd></div><div><dt className="font-bold text-slate-600">Última atualização</dt><dd>{state.lastUpdatedAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(state.lastUpdatedAt)) : undisclosed}</dd></div><div><dt className="font-bold text-slate-600">Fonte</dt><dd>{sources[0]?.sourceTitle ?? segment.provenance.workScope}</dd></div></dl></section>
        <section><h3 className="mb-3 text-lg font-extrabold text-slate-950">Histórico</h3><SegmentTimeline segmentId={segment.axisId} events={segment.events} /></section>
        <section><h3 className="text-lg font-extrabold text-slate-950">Fontes</h3>{sources.length ? <ul className="mt-2 space-y-3 text-base">{sources.map((event) => <li key={event.id}>{event.sourceUrl ? <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline">{event.sourceTitle}</a> : <span className="font-semibold">{event.sourceTitle}</span>}<span className="block text-[0.9375rem] text-slate-600">{event.evidenceType} · {event.sourceDate}</span></li>)}</ul> : <p className="mt-2 text-base text-slate-700">Informação não divulgada</p>}</section>
        {segment.components.length > 0 && <section className="text-base"><h3 className="text-lg font-extrabold text-slate-950">Composição do eixo</h3><p className="mt-2 leading-[1.5] text-slate-700">{segment.components.map((component) => `${component.street}: ${formatApproximateLength(component.officialLengthMeters)}`).join(" · ")}</p></section>}
        <p className="rounded-2xl bg-blue-50 p-4 text-base leading-[1.5] text-blue-950">A situação atual é exibida somente quando existe evento ou evidência identificada. A cartografia de água, esgoto e drenagem não gera bloqueios automaticamente.</p>
      </div>}
    </div>
    <footer className="shrink-0 border-t border-slate-200 bg-white px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 md:pb-6">
      <button type="button" onClick={openContribution} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-[1.0625rem] font-extrabold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"><span aria-hidden="true">📷</span>Enviar atualização</button>
    </footer>
  </aside><CommunityContributionForm open={contributionOpen} segmentId={segment.axisId} streetLabel={`${segment.displayName} — ${segment.area}`} onClose={() => setContributionOpen(false)} /></Fragment>;
}
