import { loadRemoteMenu, type RuntimeMenu } from './menu-runtime';

type BistroEvent = {
  id: string;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  summary: string;
  details?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  isPublished: boolean;
};

type GalleryPhoto = {
  id: string;
  title: string;
  category: string;
  alt?: string | null;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
};

type EditorialContent = {
  menu: RuntimeMenu;
  suggestions: {
    dish: string;
    drink: string;
    beer: string;
    updatedAt: string;
  };
  events: BistroEvent[];
  gallery: GalleryPhoto[];
};

const setText = (selector: string, value: string) => {
  if (!value) return;

  document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.textContent = value;
  });
};

const escapeHtml = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const escapeUrl = (value: string | null | undefined) => {
  const url = String(value ?? '');
  if (!url.startsWith('data:image/') && !/^https?:\/\//.test(url)) return '';
  return escapeHtml(url);
};

const formatEventDate = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(value));

const weeklyFormulaGroups = [
  { title: 'Entrées', aliases: ['entrée', 'entree'] },
  { title: 'Plats', aliases: ['plat'] },
  { title: 'Desserts', aliases: ['dessert'] }
];

const normalizeMenuLabel = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const parseWeeklyFormula = (description: string) => {
  const [name = '', detail = ''] = description.split(/\s+-\s+/, 2).map((item) => item.trim());
  return { name, detail };
};

const groupWeeklyFormulas = (formulas: RuntimeMenu['formulas']) =>
  weeklyFormulaGroups
    .map((group) => ({
      title: group.title,
      items: formulas
        .filter((formula) => {
          const name = normalizeMenuLabel(formula.name);
          return group.aliases.some((alias) => name.includes(alias));
        })
        .map((formula) => parseWeeklyFormula(formula.description))
        .filter((item) => item.name)
    }))
    .filter((section) => section.items.length);

const isThisWeekend = (value: string) => {
  const eventDate = new Date(value);
  const now = new Date();
  const day = now.getDay();
  const friday = new Date(now);
  friday.setDate(now.getDate() + ((5 - day + 7) % 7));
  friday.setHours(0, 0, 0, 0);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  sunday.setHours(23, 59, 59, 999);

  return eventDate >= friday && eventDate <= sunday;
};

const renderSuggestions = (suggestions: EditorialContent['suggestions']) => {
  const node = document.querySelector<HTMLElement>('[data-live-suggestions]');
  if (!node) return;

  const items = [
    ['Plat du jour', suggestions.dish],
    ['Boisson du moment', suggestions.drink],
    ['Bière pression', suggestions.beer]
  ].filter(([, value]) => value);

  if (!items.length) {
    node.hidden = true;
    return;
  }

  node.hidden = false;
  node.innerHTML = `
    <div class="section-heading">
      <p class="eyebrow">Aujourd'hui au comptoir</p>
      <h2>Les suggestions du moment.</h2>
      ${suggestions.updatedAt ? `<p class="lead">Mis à jour le ${suggestions.updatedAt}</p>` : ''}
    </div>
    <div class="live-suggestion-grid">
      ${items
        .map(
          ([label, value]) => `
            <article class="live-suggestion">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </article>
          `
        )
        .join('')}
    </div>
  `;
};

const renderEvents = (events: BistroEvent[]) => {
  const node = document.querySelector<HTMLElement>('[data-live-events]');
  if (!node) return;

  if (!events.length) return;

  node.innerHTML = `
    <div class="section-heading" data-reveal>
      <p class="eyebrow">Évènements</p>
      <h2>Ce qui se passe bientôt au Platane.</h2>
      <p class="lead">Concerts, rencontres, soirées et rendez-vous du village.</p>
    </div>
    <div class="live-event-grid">
      ${events
        .slice(0, 3)
        .map(
          (event) => `
            <article class="live-event-card">
              ${
                event.imageUrl
                  ? `<img src="${escapeUrl(event.imageUrl)}" alt="${escapeHtml(event.title)}" loading="lazy" />`
                  : ''
              }
              <div>
                ${isThisWeekend(event.eventDate) ? '<span class="live-event-card__badge">Ce week-end</span>' : ''}
                <time>${escapeHtml(formatEventDate(event.eventDate))}${event.eventTime ? ` · ${escapeHtml(event.eventTime)}` : ''}</time>
                <h3>${escapeHtml(event.title)}</h3>
                <p>${escapeHtml(event.summary)}</p>
                ${
                  event.ctaUrl && event.ctaLabel
                    ? `<a class="button button--secondary" href="${escapeUrl(event.ctaUrl)}">${escapeHtml(event.ctaLabel)}</a>`
                    : ''
                }
              </div>
            </article>
          `
        )
        .join('')}
    </div>
  `;
};

const renderGallery = (gallery: GalleryPhoto[]) => {
  const node = document.querySelector<HTMLElement>('[data-live-gallery]');
  if (!node) return;

  if (!gallery.length) {
    node.hidden = true;
    return;
  }

  node.hidden = false;
  node.innerHTML = `
    <div class="section-heading" data-reveal>
      <p class="eyebrow">Galerie</p>
      <h2>Un aperçu vivant du bistrot.</h2>
    </div>
    <div class="live-gallery-grid">
      ${gallery
        .slice(0, 8)
        .map(
          (photo) => `
            <figure class="live-gallery-photo">
              <img src="${escapeUrl(photo.imageUrl)}" alt="${escapeHtml(photo.alt || photo.title)}" loading="lazy" />
              <figcaption>
                <strong>${escapeHtml(photo.title)}</strong>
                <span>${escapeHtml(photo.category)}</span>
              </figcaption>
            </figure>
          `
        )
        .join('')}
    </div>
  `;
};

const hydrateMenuDom = (menu: RuntimeMenu) => {
  setText('[data-menu-title]', menu.title);
  setText('[data-menu-period]', menu.period);
  setText('[data-menu-intro]', menu.intro);
  setText('[data-menu-source-badge]', 'Menu synchronisé depuis l’admin');

  const updatedLabel = menu.updatedAt ? `Mis à jour le ${menu.updatedAt}` : 'Menu mis à jour depuis l’admin';
  setText('[data-menu-updated-at]', updatedLabel);

  const weeklyMenuCard = document.querySelector<HTMLElement>('[data-weekly-menu]');
  const weeklyMenuSections = document.querySelector<HTMLElement>('[data-weekly-menu-sections]');
  if (weeklyMenuCard && weeklyMenuSections) {
    const groupedWeeklyMenu = groupWeeklyFormulas(menu.formulas);
    weeklyMenuCard.hidden = groupedWeeklyMenu.length === 0;
    weeklyMenuSections.innerHTML = groupedWeeklyMenu
      .map(
        (section) => `
          <article class="weekly-menu-card__section">
            <h3>${escapeHtml(section.title)}</h3>
            <ul>
              ${section.items
                .map(
                  (item) => `
                    <li>
                      <strong>${escapeHtml(item.name)}</strong>
                      ${item.detail ? `<span>${escapeHtml(item.detail)}</span>` : ''}
                    </li>
                  `
                )
                .join('')}
            </ul>
          </article>
        `
      )
      .join('');
  }

  const sections = document.querySelector<HTMLElement>('[data-menu-sections]');
  if (sections) {
    sections.innerHTML = menu.sections
      .map(
        (section) => `
          <article class="menu-group is-visible" data-reveal>
            <h2 class="menu-group__title">${escapeHtml(section.title)}</h2>
            <ul class="menu-list">
              ${section.items
                .map(
                  (item) => `
                    <li class="menu-list__item">
                      <div class="menu-list__head">
                        <h3 class="menu-list__name">${escapeHtml(item.name)}</h3>
                        ${item.price ? `<span class="menu-list__price">${escapeHtml(item.price)}</span>` : ''}
                      </div>
                      ${item.description ? `<p class="menu-list__description">${escapeHtml(item.description)}</p>` : ''}
                    </li>
                  `
                )
                .join('')}
            </ul>
          </article>
        `
      )
      .join('');
  }

  const notes = document.querySelector<HTMLElement>('[data-menu-notes]');
  if (notes) {
    notes.innerHTML = menu.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  }
};

export const initContentRuntime = async (apiRoot: string) => {
  try {
    const response = await fetch(`${apiRoot}/content/editorial`);
    if (!response.ok) throw new Error('content');
    const content = (await response.json()) as EditorialContent;

    hydrateMenuDom(content.menu);
    renderSuggestions(content.suggestions);
    renderEvents(content.events);
    renderGallery(content.gallery);
  } catch (error) {
    console.error('Content runtime error:', error);
  }
};

export { loadRemoteMenu };
