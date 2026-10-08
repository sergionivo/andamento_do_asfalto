"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CommunityImage } from "@/types/community";

export function CommunityImageLightbox({ image, onClose }: { image: CommunityImage | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!image) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => { window.removeEventListener("keydown", handler); previous?.focus(); };
  }, [image, onClose]);
  if (!image || typeof document === "undefined") return null;
  return createPortal(<div role="dialog" aria-modal="true" aria-label="Visualização da foto da comunidade" className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/90 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="relative h-[82dvh] w-full max-w-5xl"><Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-contain" /><button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar foto" className="absolute right-0 top-0 grid size-12 place-items-center rounded-full bg-white text-2xl font-bold text-slate-950 shadow-xl">×</button>{image.caption && <p className="absolute inset-x-0 bottom-0 bg-slate-950/75 p-3 text-center text-sm text-white">{image.caption}</p>}</div></div>, document.body);
}
