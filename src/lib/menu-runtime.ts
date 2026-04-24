export type RuntimeMenuFormula = {
  name: string;
  price: string;
  description: string;
};

export type RuntimeMenuItem = {
  name: string;
  price: string;
  description: string;
};

export type RuntimeMenuSection = {
  title: string;
  items: RuntimeMenuItem[];
};

export type RuntimeMenu = {
  title: string;
  period: string;
  updatedAt: string;
  intro: string;
  formulas: RuntimeMenuFormula[];
  sections: RuntimeMenuSection[];
  notes: string[];
};

type MenuRuntimeConfig = {
  googleSheetId: string;
  tabs: {
    settings: string;
    formulas: string;
    items: string;
  };
};

type SheetRow = Record<string, string>;

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const readCellValue = (cell: { f?: string; v?: string | number | boolean | null } | null) => {
  if (!cell) return '';
  if (typeof cell.f === 'string' && cell.f.trim()) return cell.f.trim();
  if (cell.v === null || cell.v === undefined) return '';
  return String(cell.v).trim();
};

const parseGoogleVisualizationResponse = (payload: string): SheetRow[] => {
  const start = payload.indexOf('{');
  const end = payload.lastIndexOf('}');

  if (start === -1 || end === -1) {
    throw new Error('Réponse Google Sheets invalide');
  }

  const parsed = JSON.parse(payload.slice(start, end + 1)) as {
    table?: {
      cols?: Array<{ label?: string; id?: string }>;
      rows?: Array<{ c?: Array<{ f?: string; v?: string | number | boolean | null } | null> }>;
    };
  };

  const columns = (parsed.table?.cols ?? []).map((column, index) =>
    normalizeHeader(column.label || column.id || `col_${index + 1}`)
  );

  return (parsed.table?.rows ?? [])
    .map((row) => {
      const entries = columns.map((column, index) => [column, readCellValue(row.c?.[index] ?? null)]);
      return Object.fromEntries(entries) as SheetRow;
    })
    .filter((row) => Object.values(row).some((value) => value.length > 0));
};

const fetchSheetRows = async (sheetId: string, tabName: string) => {
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${encodeURIComponent(tabName)}&headers=1&tqx=out:json`
  );

  if (!response.ok) {
    throw new Error(`Impossible de charger l'onglet "${tabName}"`);
  }

  return parseGoogleVisualizationResponse(await response.text());
};

const pick = (row: SheetRow, keys: string[]) => {
  for (const key of keys) {
    const value = row[normalizeHeader(key)];
    if (value) return value;
  }

  return '';
};

const isEnabled = (row: SheetRow) => {
  const rawValue = pick(row, ['active', 'actif', 'enabled', 'visible']);

  if (!rawValue) return true;

  return ['1', 'true', 'yes', 'oui', 'y', 'x'].includes(rawValue.trim().toLowerCase());
};

export const loadRemoteMenu = async (config: MenuRuntimeConfig): Promise<RuntimeMenu | null> => {
  if (!config.googleSheetId) return null;

  const [settingsRows, formulaRows, itemRows] = await Promise.all([
    fetchSheetRows(config.googleSheetId, config.tabs.settings),
    fetchSheetRows(config.googleSheetId, config.tabs.formulas),
    fetchSheetRows(config.googleSheetId, config.tabs.items)
  ]);

  const settings = new Map<string, string[]>();

  settingsRows.forEach((row) => {
    const key = normalizeHeader(pick(row, ['key', 'cle', 'setting']));
    const value = pick(row, ['value', 'valeur', 'content', 'texte']);

    if (!key || !value) return;

    const values = settings.get(key) ?? [];
    values.push(value);
    settings.set(key, values);
  });

  const formulas = formulaRows
    .filter(isEnabled)
    .map((row) => ({
      name: pick(row, ['name', 'nom', 'title', 'titre']),
      price: pick(row, ['price', 'prix', 'tarif']),
      description: pick(row, ['description', 'desc', 'texte', 'details'])
    }))
    .filter((formula) => formula.name || formula.price || formula.description);

  const sectionsMap = new Map<string, RuntimeMenuItem[]>();

  itemRows.filter(isEnabled).forEach((row) => {
    const sectionTitle = pick(row, ['section', 'categorie', 'category', 'rubrique']);
    const item = {
      name: pick(row, ['item', 'plat', 'ligne', 'name', 'nom']),
      price: pick(row, ['price', 'prix', 'tarif']),
      description: pick(row, ['description', 'desc', 'texte', 'details'])
    };

    if (!sectionTitle || !item.name) return;

    const sectionItems = sectionsMap.get(sectionTitle) ?? [];
    sectionItems.push(item);
    sectionsMap.set(sectionTitle, sectionItems);
  });

  const sections = Array.from(sectionsMap.entries()).map(([title, items]) => ({
    title,
    items
  }));

  const notes = [
    ...(settings.get('note') ?? []),
    ...(settings.get('notes') ?? []),
    ...(settings.get('info') ?? [])
  ];

  if (!formulas.length && !sections.length) return null;

  return {
    title: settings.get('title')?.[0] ?? settings.get('titre')?.[0] ?? 'Le menu',
    period: settings.get('period')?.[0] ?? settings.get('periode')?.[0] ?? 'Semaine en cours',
    updatedAt:
      settings.get('updated_at')?.[0] ??
      settings.get('updated')?.[0] ??
      settings.get('mise_a_jour')?.[0] ??
      '',
    intro:
      settings.get('intro')?.[0] ??
      settings.get('introduction')?.[0] ??
      settings.get('description')?.[0] ??
      '',
    formulas,
    sections,
    notes
  };
};

const renderPreviewFormulas = (container: HTMLElement, menu: RuntimeMenu) => {
  container.innerHTML = '';

  menu.formulas.forEach((formula) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const price = document.createElement('strong');

    name.textContent = formula.name;
    price.textContent = formula.price;

    item.append(name, price);
    container.appendChild(item);
  });
};

const createMenuLineElement = (itemData: RuntimeMenuItem) => {
  const item = document.createElement('li');
  item.className = 'menu-list__item';

  const head = document.createElement('div');
  head.className = 'menu-list__head';

  const name = document.createElement('h3');
  name.className = 'menu-list__name';
  name.textContent = itemData.name;

  head.appendChild(name);

  if (itemData.price) {
    const price = document.createElement('span');
    price.className = 'menu-list__price';
    price.textContent = itemData.price;
    head.appendChild(price);
  }

  item.appendChild(head);

  if (itemData.description) {
    const description = document.createElement('p');
    description.className = 'menu-list__description';
    description.textContent = itemData.description;
    item.appendChild(description);
  }

  return item;
};

const renderFormulaCards = (container: HTMLElement, menu: RuntimeMenu) => {
  container.innerHTML = '';

  menu.formulas.forEach((formula) => {
    const article = document.createElement('article');
    article.className = 'menu-formula';
    article.setAttribute('data-reveal', '');

    const title = document.createElement('p');
    title.className = 'menu-formula__name';
    title.textContent = formula.name;

    const price = document.createElement('strong');
    price.className = 'menu-formula__price';
    price.textContent = formula.price;

    const description = document.createElement('p');
    description.className = 'menu-formula__description';
    description.textContent = formula.description;

    article.append(title, price, description);
    container.appendChild(article);
  });
};

const renderMenuSections = (container: HTMLElement, menu: RuntimeMenu) => {
  container.innerHTML = '';

  menu.sections.forEach((section) => {
    const article = document.createElement('article');
    article.className = 'menu-group is-visible';
    article.setAttribute('data-reveal', '');

    const title = document.createElement('h2');
    title.className = 'menu-group__title';
    title.textContent = section.title;

    const list = document.createElement('ul');
    list.className = 'menu-list';

    section.items.forEach((itemData) => {
      list.appendChild(createMenuLineElement(itemData));
    });

    article.append(title, list);
    container.appendChild(article);
  });
};

const renderNotes = (container: HTMLElement, notes: string[]) => {
  container.innerHTML = '';

  notes.forEach((note) => {
    const item = document.createElement('li');
    item.textContent = note;
    container.appendChild(item);
  });
};

const setText = (selector: string, value: string) => {
  if (!value) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.textContent = value;
  });
};

const hydrateMenuDom = (menu: RuntimeMenu) => {
  setText('[data-menu-title]', menu.title);
  setText('[data-menu-period]', menu.period);
  setText('[data-menu-intro]', menu.intro);
  setText('[data-menu-source-badge]', 'Menu synchronisé depuis Google Sheets');

  const updatedLabel = menu.updatedAt ? `Mis à jour le ${menu.updatedAt}` : 'Menu mis à jour automatiquement';
  setText('[data-menu-updated-at]', updatedLabel);

  const previewFormulas = document.querySelector<HTMLElement>('[data-menu-preview-formulas]');
  if (previewFormulas) renderPreviewFormulas(previewFormulas, menu);

  const formulaGrid = document.querySelector<HTMLElement>('[data-menu-formulas]');
  if (formulaGrid) renderFormulaCards(formulaGrid, menu);

  const sections = document.querySelector<HTMLElement>('[data-menu-sections]');
  if (sections) renderMenuSections(sections, menu);

  const notes = document.querySelector<HTMLElement>('[data-menu-notes]');
  if (notes && menu.notes.length) renderNotes(notes, menu.notes);
};

export const initMenuRuntime = async (config: MenuRuntimeConfig) => {
  try {
    const menu = await loadRemoteMenu(config);
    if (!menu) return;
    hydrateMenuDom(menu);
  } catch (error) {
    console.error('Menu runtime error:', error);
  }
};
