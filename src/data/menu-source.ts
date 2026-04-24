export const menuSource = {
  googleSheetId: import.meta.env.PUBLIC_GOOGLE_SHEET_ID ?? '',
  tabs: {
    settings: import.meta.env.PUBLIC_GOOGLE_SHEET_SETTINGS_TAB ?? 'Settings',
    formulas: import.meta.env.PUBLIC_GOOGLE_SHEET_FORMULAS_TAB ?? 'Formules',
    items: import.meta.env.PUBLIC_GOOGLE_SHEET_ITEMS_TAB ?? 'Carte'
  }
};

export const menuSourceLabel = menuSource.googleSheetId
  ? 'Menu synchronisé depuis Google Sheets'
  : 'Menu de démonstration local';
