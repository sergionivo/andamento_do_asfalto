"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  COMMUNITY_FORM_NAME,
  COMMUNITY_IMAGE_TYPES,
  COMMUNITY_MAX_FILE_BYTES,
  COMMUNITY_MAX_FILES,
  COMMUNITY_MAX_REQUEST_BYTES,
} from "@/config/community";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface Props {
  open: boolean;
  segmentId: string;
  streetLabel: string;
  onClose: () => void;
}

const SIMPLE_OBSERVATION_OPTIONS = [
  { value: "crew_or_machinery", emoji: "🚜", label: "Tem gente ou máquina trabalhando" },
  { value: "road_preparation", emoji: "🧱", label: "Estão preparando ou mexendo na rua" },
  { value: "asphalt_application", emoji: "🛣️", label: "Estão colocando asfalto" },
  { value: "apparently_stopped", emoji: "⏸️", label: "Não vi ninguém trabalhando" },
  { value: "other", emoji: "💬", label: "Outra coisa" },
] as const;

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function submitCommunityContribution(formData: FormData, fetcher: typeof fetch = fetch): Promise<void> {
  const response = await fetcher("/__forms.html", { method: "POST", body: formData });
  if (!response.ok) throw new Error(`Netlify Forms respondeu com HTTP ${response.status}.`);
}

export function CommunityContributionForm({ open, segmentId, streetLabel, onClose }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const handleFiles = (selectedFiles: FileList | null) => {
    const nextFiles = Array.from(selectedFiles ?? []);
    const nextErrors: Record<string, string> = {};
    if (nextFiles.length > COMMUNITY_MAX_FILES) nextErrors.photos = `Envie no máximo ${COMMUNITY_MAX_FILES} fotos.`;
    else if (nextFiles.some((file) => !COMMUNITY_IMAGE_TYPES.includes(file.type as (typeof COMMUNITY_IMAGE_TYPES)[number]))) nextErrors.photos = "Use somente imagens JPEG, PNG ou WebP.";
    else if (nextFiles.some((file) => file.size > COMMUNITY_MAX_FILE_BYTES)) nextErrors.photos = "Cada foto pode ter no máximo 2 MB.";
    else if (nextFiles.reduce((sum, file) => sum + file.size, 0) > COMMUNITY_MAX_REQUEST_BYTES) nextErrors.photos = "O conjunto de fotos pode ter no máximo 7 MB.";
    setErrors((current) => ({ ...current, photos: nextErrors.photos ?? "" }));
    setFiles(nextErrors.photos ? [] : nextFiles);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = new FormData(form);
    const nextErrors: Record<string, string> = {};
    if (!raw.get("observedAt")) nextErrors.observedAt = "Informe a data da observação.";
    if (!raw.get("observationType")) nextErrors.observationType = "Escolha o que você observou.";
    if (raw.get("consent") !== "yes") nextErrors.consent = "A autorização é necessária para enviar o registro.";
    if (errors.photos) nextErrors.photos = errors.photos;
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    const payload = new FormData();
    for (const [key, value] of raw.entries()) if (key !== "photos") payload.append(key, value);
    files.forEach((file, index) => payload.append(`photo_${index + 1}`, file, file.name));
    setSubmissionState("submitting");
    setErrors({});
    try {
      await submitCommunityContribution(payload);
      setSubmissionState("success");
    } catch (error) {
      console.error("Falha ao enviar contribuição comunitária.", error);
      setSubmissionState("error");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/45 md:items-center md:justify-center md:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && submissionState !== "submitting") onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:max-h-[90dvh] md:max-w-2xl md:rounded-3xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:px-7">
          <div><p className="text-[0.9375rem] font-bold text-blue-700">Registro da comunidade</p><h2 id={titleId} className="mt-1 text-[1.375rem] font-extrabold leading-tight text-slate-950">Conte o que mudou na sua rua</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} disabled={submissionState === "submitting"} aria-label="Fechar formulário" className="map-icon-button">×</button>
        </header>

        {submissionState === "success" ? <div className="min-h-0 overflow-y-auto px-6 py-10 text-center md:px-10">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</span>
          <h3 className="mt-5 text-xl font-extrabold text-slate-950">Recebemos seu registro</h3>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-700">Obrigado por ajudar a acompanhar o bairro. A contribuição será analisada antes de ser publicada.</p>
          <button type="button" onClick={onClose} className="mt-7 min-h-12 rounded-xl bg-slate-950 px-6 text-base font-bold text-white">Fechar</button>
        </div> : <form name={COMMUNITY_FORM_NAME} method="POST" encType="multipart/form-data" onSubmit={handleSubmit} noValidate className="min-h-0 scroll-pb-32 overflow-y-auto">
          <input type="hidden" name="form-name" value={COMMUNITY_FORM_NAME} />
          <input type="hidden" name="segmentId" value={segmentId} />
          <input type="hidden" name="streetLabel" value={streetLabel} />
          <p className="absolute -m-px size-px overflow-hidden [clip:rect(0,0,0,0)]"><label>Não preencha este campo: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <div className="space-y-6 px-5 py-5 pb-8 md:px-7">
            <div><p id={descriptionId} className="text-[1.0625rem] leading-relaxed text-slate-700">Viu obra, máquinas ou asfalto por aí? Envie pra gente. Antes de aparecer no mapa, vamos conferir.</p><p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-[0.9375rem] font-semibold leading-snug text-slate-700">Rua: {streetLabel}</p></div>
            <label className="block text-[1.0625rem] font-bold text-slate-950">Quando foi? <span className="text-red-700">*</span><input name="observedAt" type="date" defaultValue={localToday()} max={localToday()} required aria-invalid={Boolean(errors.observedAt)} aria-describedby={errors.observedAt ? `${titleId}-date-error` : undefined} className="mt-2 min-h-14 w-full rounded-xl border border-slate-400 bg-white px-4 text-base font-normal" />{errors.observedAt && <span id={`${titleId}-date-error`} className="mt-1 block text-[0.9375rem] font-semibold text-red-700">{errors.observedAt}</span>}</label>
            <fieldset aria-invalid={Boolean(errors.observationType)}><legend className="text-[1.0625rem] font-bold text-slate-950">O que estava acontecendo? <span className="text-red-700">*</span></legend><div className="mt-3 grid gap-2.5">{SIMPLE_OBSERVATION_OPTIONS.map((option) => <label key={option.value} className="relative flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold leading-snug text-slate-800 has-[:checked]:border-blue-700 has-[:checked]:bg-blue-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-700"><input type="radio" name="observationType" value={option.value} required className="size-5 shrink-0 accent-blue-700" /><span aria-hidden="true" className="text-xl">{option.emoji}</span><span>{option.label}</span></label>)}</div>{errors.observationType && <span className="mt-2 block text-[0.9375rem] font-semibold text-red-700">{errors.observationType}</span>}</fieldset>
            <div><label className="block text-[1.0625rem] font-bold text-slate-950">Tem uma foto? <span className="font-normal text-slate-600">(opcional)</span><span className="mt-1 block text-[0.9375rem] font-normal text-slate-700">Fotos ajudam bastante a gente a conferir.</span><input name="photos" type="file" multiple accept={COMMUNITY_IMAGE_TYPES.join(",")} onChange={(event) => handleFiles(event.target.files)} className="mt-3 block min-h-14 w-full rounded-xl border border-slate-400 bg-white p-2 text-base font-normal file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:font-bold file:text-blue-800" /></label><p className="mt-2 text-[0.9375rem] leading-snug text-slate-700">Até 4 fotos JPEG, PNG ou WebP. Máximo de 2 MB por foto.</p>{files.length > 0 && <p className="mt-1 text-[0.9375rem] font-semibold text-emerald-800">{files.length} {files.length === 1 ? "foto selecionada" : "fotos selecionadas"}.</p>}{errors.photos && <p className="mt-1 text-[0.9375rem] font-semibold text-red-700">{errors.photos}</p>}</div>
            <label className="block text-[1.0625rem] font-bold text-slate-950">Quer contar mais? <span className="font-normal text-slate-600">(opcional)</span><textarea name="details" rows={3} maxLength={1500} placeholder="Ex.: passaram máquinas aqui hoje cedo." className="mt-2 w-full rounded-xl border border-slate-400 bg-white px-4 py-3 text-base font-normal" /></label>
            <label className="block text-[1.0625rem] font-bold text-slate-950">Contato <span className="font-normal text-slate-600">(opcional)</span><span className="mt-1 block text-[0.9375rem] font-normal leading-relaxed text-slate-700">Só vamos usar se precisarmos confirmar alguma informação.</span><input name="contact" type="text" maxLength={120} autoComplete="email" placeholder="Telefone ou e-mail" className="mt-2 min-h-14 w-full rounded-xl border border-slate-400 bg-white px-4 text-base font-normal" /></label>
            <p className="rounded-2xl bg-amber-50 p-4 text-[0.9375rem] leading-relaxed text-amber-950"><strong>Cuide da privacidade:</strong> evite fotos com rostos, placas de veículos ou documentos.</p>
            <label className="flex min-h-14 cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 text-base leading-relaxed text-slate-800"><input name="consent" type="checkbox" value="yes" required className="mt-0.5 size-6 shrink-0 accent-blue-700" /><span>Autorizo a publicação do meu relato e das fotos, caso sejam aprovados. <span className="text-red-700">*</span></span></label>{errors.consent && <p className="-mt-4 text-[0.9375rem] font-semibold text-red-700">{errors.consent}</p>}
            {submissionState === "error" && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-base text-red-900"><strong>Não conseguimos enviar sua atualização agora.</strong><span className="mt-1 block">Tente novamente em alguns instantes.</span></div>}
          </div>
          <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] md:px-7 md:pb-5"><button type="submit" disabled={submissionState === "submitting"} className="min-h-14 w-full rounded-xl bg-blue-700 px-5 text-[1.0625rem] font-extrabold text-white disabled:cursor-wait disabled:opacity-60">{submissionState === "submitting" ? "Enviando…" : "Enviar atualização"}</button><p className="mt-2 text-center text-[0.875rem] font-medium text-slate-600">Nada é publicado automaticamente.</p></footer>
        </form>}
      </div>
    </div>,
    document.body,
  );
}
