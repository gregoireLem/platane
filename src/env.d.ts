/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_SHEET_ID?: string;
  readonly PUBLIC_GOOGLE_SHEET_SETTINGS_TAB?: string;
  readonly PUBLIC_GOOGLE_SHEET_FORMULAS_TAB?: string;
  readonly PUBLIC_GOOGLE_SHEET_ITEMS_TAB?: string;
  readonly PUBLIC_RESERVATION_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
