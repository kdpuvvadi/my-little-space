/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Build-time default for the site-meta helper (GitHub Actions var or .env). */
  readonly VITE_META_SERVICE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
