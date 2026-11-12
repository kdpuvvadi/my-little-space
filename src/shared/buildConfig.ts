/**
 * Build-time defaults.
 * Set `VITE_META_SERVICE_URL` in `.env` or CI (e.g. GitHub Actions `vars.META_SERVICE_URL`).
 * Override still available in Customize → Advanced.
 */
export const BUILD_META_SERVICE_URL = (
  import.meta.env.VITE_META_SERVICE_URL || ''
).trim();
