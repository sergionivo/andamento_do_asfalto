import type { AnalyticsConsent } from "@/types/analytics";

interface Props {
  open: boolean;
  consent: AnalyticsConsent | null | undefined;
  onClose: () => void;
  onGrant: () => void;
  onDeny: () => void;
}

export function AnalyticsPrivacyPanel({ open, consent, onClose, onGrant, onDeny }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/35 md:items-center md:justify-center md:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="analytics-privacy-title" className="w-full rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:max-w-lg md:rounded-3xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-bold text-blue-700">Privacidade</p><h2 id="analytics-privacy-title" className="mt-1 text-xl font-extrabold text-slate-950">Privacidade e métricas</h2></div>
          <button type="button" onClick={onClose} aria-label="Fechar privacidade e métricas" className="map-icon-button">×</button>
        </div>
        <p className="mt-4 text-base leading-relaxed text-slate-700">Usamos Google Analytics e Microsoft Clarity apenas com sua autorização para entender o uso do mapa e melhorar a experiência.</p>
        <p className="mt-3 rounded-xl bg-blue-50 p-4 text-base leading-relaxed text-blue-950">Não enviamos coordenadas, localização, relatos, contatos, fotos ou conteúdo dos formulários para essas ferramentas.</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Registramos somente ações gerais, como carregar o mapa, selecionar um trecho, ativar uma camada ou compartilhar.</p>
        {consent !== null && consent !== undefined && <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800">{consent === "granted" ? "Métricas permitidas" : "Métricas desativadas"}</p>}
        <div className="mt-5">
          {consent === "granted" ? <button type="button" onClick={onDeny} className="min-h-14 w-full rounded-xl border border-slate-400 bg-white px-4 text-[1.0625rem] font-bold text-slate-800">Desativar métricas</button> : consent === "denied" ? <button type="button" onClick={onGrant} className="min-h-14 w-full rounded-xl bg-blue-700 px-4 text-[1.0625rem] font-bold text-white">Permitir métricas</button> : <div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={onGrant} className="min-h-14 rounded-xl bg-blue-700 px-4 text-[1.0625rem] font-bold text-white">Permitir métricas</button><button type="button" onClick={onDeny} className="min-h-14 rounded-xl border border-slate-400 bg-white px-4 text-[1.0625rem] font-bold text-slate-800">Continuar sem métricas</button></div>}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">A mudança vale imediatamente para novos registros neste navegador.</p>
      </section>
    </div>
  );
}
