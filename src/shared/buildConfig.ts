/**
 * Build-time defaults.
 * Set `VITE_META_SERVICE_URL` in `.env` or CI (e.g. GitHub Actions `vars.META_SERVICE_URL`).
 * Override still available in Customize → Advanced (empty = use this default).
 */
export const BUILD_META_SERVICE_URL = (
  import.meta.env.VITE_META_SERVICE_URL || ''
).trim();

/** Empty configured value → build default; otherwise the custom URL. */
export function resolveMetaServiceUrl(configured: string): string {
  return configured.trim() || BUILD_META_SERVICE_URL;
}