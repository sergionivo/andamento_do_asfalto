import type { SanitationProperties } from "@/types/sanitation";

interface Props { segment: SanitationProperties; onClose: () => void }

export function SanitationDetails({ segment, onClose }: Props) {
  const label = segment.networkType === "water" ? "água" : "esgoto";
  return <aside className="pointer-events-auto w-full rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl md:rounded-3xl" aria-label={`Detalhes da rede de ${label}`}>
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Rede de {label}</p><h2 className="mt-1 text-lg font-extrabold text-slate-950">{segment.corridorName}</h2></div><button type="button" onClick={onClose} aria-label="Fechar detalhes" className="grid size-11 place-items-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button></div>
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="font-bold text-slate-950">Cadastro de referência</dt><dd className="text-slate-600">Águas Guariroba — 2025</dd></div><div><dt className="font-bold text-slate-950">Precisão</dt><dd className="text-slate-600">Referencial</dd></div><div className="col-span-2"><dt className="font-bold text-slate-950">Fonte</dt><dd className="text-slate-600">Projeto Executivo — Lote 22 — Prancha 02</dd></div></dl>
    <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">Esta representação indica o corredor cadastrado da rede. A posição real deve ser confirmada em campo quando necessário.</p>
    <p className="mt-3 text-sm leading-relaxed text-slate-500">Esta linha indica um corredor com rede cadastrada. Não representa a posição subterrânea exata da tubulação.</p>
  </aside>;
}
