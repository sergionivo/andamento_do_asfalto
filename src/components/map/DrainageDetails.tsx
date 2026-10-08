import type { DrainageGeoJsonProperties } from "@/types/drainage";

interface Props { segment: DrainageGeoJsonProperties; onClose: () => void }
const meters = (value: number | null | undefined) => value == null ? "Informação não divulgada" : `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;

export function DrainageDetails({ segment, onClose }: Props) {
  return (
    <aside aria-label={`Detalhes da drenagem ${segment.id}`} className="pointer-events-auto max-h-[72dvh] overflow-y-auto rounded-t-3xl border border-cyan-200 bg-white px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_30px_rgba(15,23,42,0.14)] md:max-h-[calc(100dvh-2.5rem)] md:w-[380px] md:rounded-2xl md:p-6 md:shadow-xl">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 md:hidden" />
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-cyan-800">Drenagem da chuva</p><h2 className="mt-1 text-xl font-extrabold">Trecho: {segment.id}</h2><p className="mt-1 text-sm text-slate-600">Bacia: {segment.basin}</p></div><button type="button" onClick={onClose} aria-label="Fechar detalhes da drenagem" className="grid size-11 shrink-0 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button></div>
      <dl className="mt-5 grid gap-4 border-y border-slate-100 py-4 text-sm"><div><dt className="font-bold uppercase tracking-wide text-slate-500">Comprimento previsto</dt><dd className="mt-1 font-semibold">{meters(segment.officialLengthMeters)}</dd></div><div><dt className="font-bold uppercase tracking-wide text-slate-500">Diâmetro</dt><dd className="mt-1 font-semibold">{segment.diameterMeters == null ? "Informação não divulgada" : `Ø ${meters(segment.diameterMeters)}`}</dd></div>{segment.material && <div><dt className="font-bold uppercase tracking-wide text-slate-500">Material</dt><dd className="mt-1 font-semibold">{segment.material}</dd></div>}<div><dt className="font-bold uppercase tracking-wide text-slate-500">Situação</dt><dd className="mt-1 font-semibold">Prevista no Projeto Executivo</dd></div><div><dt className="font-bold uppercase tracking-wide text-slate-500">Execução</dt><dd className="mt-1 font-semibold">Informação não divulgada</dd></div><div><dt className="font-bold uppercase tracking-wide text-slate-500">Fonte</dt><dd className="mt-1 font-semibold">{segment.geometrySource}</dd></div></dl>
      <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm leading-relaxed text-cyan-950">Esta linha mostra a drenagem prevista no projeto. Ela não indica, por si só, que o serviço já foi executado.</p>
    </aside>
  );
}
