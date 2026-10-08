export const SITE_NAME = "Oliveira com Asfalto";
export const SITE_TITLE = "Oliveira com Asfalto — e a sua rua?";
export const SITE_DESCRIPTION = "Veja os trechos previstos, acompanhe a obra e ajude a registrar o que está acontecendo no Residencial Oliveira.";
export const SITE_FALLBACK_URL = "https://oliveiracomasfalto.netlify.app";

export function resolveSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): string {
  if (!value) return SITE_FALLBACK_URL;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return SITE_FALLBACK_URL;
    return url.origin;
  } catch {
    return SITE_FALLBACK_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

