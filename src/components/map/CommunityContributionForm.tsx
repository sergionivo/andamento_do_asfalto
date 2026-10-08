"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  COMMUNITY_FORM_NAME,
  COMMUNITY_IMAGE_TYPES,
  COMMUNITY_MAX_FILE_BYTES,
  COMMUNITY_MAX_FILES,
  COMMUNITY_MAX_REQUEST_BYTES,
  COMMUNITY_OBSERVATION_LABELS,
} from "@/config/community";
import { COMMUNITY_OBSERVATION_TYPES } from "@/types/community";

type SubmissionState = "idle" | "submitting" | "success" | "error";

interface Props {
  open: boolean;
  segmentId: string;
  streetLabel: string;
  onClose: () => void;
}

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
          <div><p className="text-sm font-bold text-blue-700">Registro da comunidade</p><h2 id={titleId} className="mt-1 text-xl font-extrabold text-slate-950">Enviar atualização da rua</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} disabled={submissionState === "submitting"} aria-label="Fechar formulário" className="map-icon-button">×</button>
        </header>

        {submissionState === "success" ? <div className="min-h-0 overflow-y-auto px-6 py-10 text-center md:px-10">
          <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</span>
          <h3 className="mt-5 text-xl font-extrabold text-slate-950">Recebemos seu registro</h3>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-slate-700">Obrigado por ajudar a acompanhar o bairro. A contribuição será analisada antes de ser publicada.</p>
          <button type="button" onClick={onClose} className="mt-7 min-h-12 rounded-xl bg-slate-950 px-6 text-base font-bold text-white">Fechar</button>
        </div> : <form name={COMMUNITY_FORM_NAME} method="POST" encType="multipart/form-data" onSubmit={handleSubmit} noValidate className="min-h-0 overflow-y-auto">
          <input type="hidden" name="form-name" value={COMMUNITY_FORM_NAME} />
          <input type="hidden" name="segmentId" value={segmentId} />
          <p className="absolute -m-px size-px overflow-hidden [clip:rect(0,0,0,0)]"><label>Não preencha este campo: <input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
          <div className="space-y-5 px-5 py-5 md:px-7">
            <p id={descriptionId} className="text-base leading-relaxed text-slate-700">Seu registro pode ajudar outros moradores a acompanhar a obra. As informações serão analisadas antes de aparecer no mapa.</p>
            <label className="block text-base font-bold text-slate-900">Rua / trecho<input name="streetLabel" value={streetLabel} readOnly className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 text-base font-normal text-slate-700" /></label>
            <label className="block text-base font-bold text-slate-900">Data da observação <span className="text-red-700">*</span><input name="observedAt" type="date" defaultValue={localToday()} max={localToday()} required aria-invalid={Boolean(errors.observedAt)} aria-describedby={errors.observedAt ? `${titleId}-date-error` : undefined} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal" />{errors.observedAt && <span id={`${titleId}-date-error`} className="mt-1 block text-sm font-semibold text-red-700">{errors.observedAt}</span>}</label>
            <label className="block text-base font-bold text-slate-900">O que você observou? <span className="text-red-700">*</span><select name="observationType" defaultValue="" required aria-invalid={Boolean(errors.observationType)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal"><option value="" disabled>Selecione uma opção</option>{COMMUNITY_OBSERVATION_TYPES.map((type) => <option key={type} value={type}>{COMMUNITY_OBSERVATION_LABELS[type]}</option>)}</select>{errors.observationType && <span className="mt-1 block text-sm font-semibold text-red-700">{errors.observationType}</span>}</label>
            <label className="block text-base font-bold text-slate-900">Conte mais <span className="font-normal text-slate-500">(opcional)</span><textarea name="details" rows={4} maxLength={1500} placeholder="Ex.: hoje pela manhã havia máquinas trabalhando próximo ao cruzamento…" className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-normal" /></label>
            <div><label className="block text-base font-bold text-slate-900">Fotos <span className="font-normal text-slate-500">(opcional)</span><input name="photos" type="file" multiple accept={COMMUNITY_IMAGE_TYPES.join(",")} onChange={(event) => handleFiles(event.target.files)} className="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white p-2 text-base font-normal file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-bold" /></label><p className="mt-1 text-sm text-slate-600">Até 4 imagens JPEG, PNG ou WebP; máximo de 2 MB por foto e 7 MB no total.</p>{errors.photos && <p className="mt-1 text-sm font-semibold text-red-700">{errors.photos}</p>}</div>
            <label className="block text-base font-bold text-slate-900">Nome ou apelido <span className="font-normal text-slate-500">(opcional)</span><input name="contributorName" type="text" maxLength={80} autoComplete="name" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal" /></label>
            <label className="block text-base font-bold text-slate-900">Contato <span className="font-normal text-slate-500">(opcional)</span><input name="contact" type="text" maxLength={120} autoComplete="email" placeholder="E-mail ou telefone" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-normal" /><span className="mt-1 block text-sm font-normal leading-relaxed text-slate-600">Usaremos apenas se precisarmos confirmar alguma informação. O contato não será publicado.</span></label>
            <p className="rounded-2xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><strong>Cuide da privacidade:</strong> evite fotos com rostos identificáveis, placas de veículos, documentos ou outros dados pessoais.</p>
            <label className="flex gap-3 text-base leading-relaxed text-slate-800"><input name="consent" type="checkbox" value="yes" required className="mt-1 size-5 shrink-0 accent-blue-700" /><span>Autorizo a utilização das fotos e do relato no Oliveira com Asfalto, caso a contribuição seja aprovada. <span className="text-red-700">*</span></span></label>{errors.consent && <p className="-mt-3 text-sm font-semibold text-red-700">{errors.consent}</p>}
            {submissionState === "error" && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-base text-red-900"><strong>Não conseguimos enviar sua atualização agora.</strong><span className="mt-1 block">Tente novamente em alguns instantes.</span></div>}
          </div>
          <footer className="sticky bottom-0 border-t border-slate-200 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 md:px-7 md:pb-5"><button type="submit" disabled={submissionState === "submitting"} className="min-h-12 w-full rounded-xl bg-blue-700 px-5 text-base font-extrabold text-white disabled:cursor-wait disabled:opacity-60">{submissionState === "submitting" ? "Enviando…" : "Enviar para análise"}</button><p className="mt-2 text-center text-xs text-slate-500">Nada será publicado automaticamente.</p></footer>
        </form>}
      </div>
    </div>,
    document.body,
  );
}
