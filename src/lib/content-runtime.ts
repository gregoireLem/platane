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

const editorialContentCacheKey = 'au_platane_editorial_content_v1';
let contentRuntimeRequest: Promise<void> | null = null;

const readCachedEditorialContent = () => {
  try {
    const value = window.localStorage.getItem(editorialContentCacheKey);
    if (!value) return null;
    return JSON.parse(value) as EditorialContent;
  } catch (_error) {
    return null;
  }
};

const writeCachedEditorialContent = (content: EditorialContent) => {
  try {
    window.localStorage.setItem(editorialContentCacheKey, JSON.stringify(content));
  } catch (_error) {
    // The live content can still render without localStorage.
  }
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

const hiddenPriceValues = new Set([
  '',
  '0',
  '0€',
  '0 €',
  '0,0',
  '0,0€',
  '0,0 €',
  '0,00',
  '0,00€',
  '0,00 €',
  '0.0',
  '0.0€',
  '0.0 €',
  '0.00',
  '0.00€',
  '0.00 €'
]);

const normalizePriceValue = (value: string | null | undefined) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const shouldShowPrice = (value: string | null | undefined) => !hiddenPriceValues.has(normalizePriceValue(value));

const formatPriceValue = (value: string | null | undefined) => {
  const price = String(value ?? '').trim();
  if (!price || price.includes('€')) return price;
  return /^\+?\d+(?:[,.]\d{1,2})?$/.test(price) ? `${price} €` : price;
};

const formatWeeklyMenuDescription = (value: string | null | undefined) => {
  const description = String(value ?? '').trim();
  return description && !description.includes('\n') ? description.replace(/\s+ou\s+/, '\nou ') : description;
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

const menuSectionId = (title: string) => {
  const normalized = normalizeMenuLabel(title);
  if (normalized.includes('partager')) return 'soir-a-partager';
  if (normalized.includes('douceurs') || normalized.includes('apres-midi')) return 'douceurs-apres-midi';
  return normalized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

const isSweetsSection = (title: string) => {
  const normalized = normalizeMenuLabel(title);
  return normalized.includes('douceurs') || normalized.includes('apres-midi');
};

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

const renderMenuSectionNav = (menu: RuntimeMenu) => {
  const node = document.querySelector<HTMLElement>('[data-menu-section-nav]');
  if (!node) return;

  const groupedWeeklyMenu = groupWeeklyFormulas(menu.formulas);
  const sweetsSection = menu.sections.find((section) => isSweetsSection(section.title));
  const sectionLinks = menu.sections
    .filter((section) => !isSweetsSection(section.title))
    .map((section) => `<a href="#${escapeHtml(menuSectionId(section.title))}">${escapeHtml(section.title)}</a>`)
    .join('');

  node.innerHTML = `
    ${groupedWeeklyMenu.length ? '<a href="#menu-semaine">Menu de la semaine</a>' : ''}
    ${sweetsSection ? '<a href="#douceurs-apres-midi">Douceurs</a>' : ''}
    <a href="#ardoise-du-moment">L’ardoise</a>
    ${sectionLinks}
  `;
};

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

const eventExcerpt = (value: string) => {
  const text = String(value ?? '').trim();
  if (text.length <= 180) return text;

  const firstSentences = text.match(/[^.!?]+[.!?]+/g)?.slice(0, 2).join(' ').trim();
  const excerpt = firstSentences && firstSentences.length <= 220 ? firstSentences : text.slice(0, 180).trim();
  return `${excerpt.replace(/[.\s]+$/, '')}...`;
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
    <div class="section-heading home-events__heading is-visible">
      <p class="eyebrow">Évènements</p>
      <h2>La programmation au Platane.</h2>
      <p class="lead">Concerts, rencontres, soirées et rendez-vous du village.</p>
    </div>
    <div class="live-event-grid">
      ${events
        .slice(0, 3)
        .map((event, index) => {
          const fullSummary = event.summary.trim();
          const excerpt = eventExcerpt(fullSummary);
          const canExpand = excerpt !== fullSummary;

          return `
            <article class="live-event-card" data-event-card>
              ${
                event.imageUrl
                  ? `<img src="${escapeUrl(event.imageUrl)}" alt="${escapeHtml(event.title)}" loading="lazy" />`
                  : ''
              }
              <div>
                ${isThisWeekend(event.eventDate) ? '<span class="live-event-card__badge">Ce week-end</span>' : ''}
                <time>${escapeHtml(formatEventDate(event.eventDate))}${event.eventTime ? ` · ${escapeHtml(event.eventTime)}` : ''}</time>
                <h3>${escapeHtml(event.title)}</h3>
                <p class="live-event-card__summary" id="event-summary-${index}" data-event-summary data-excerpt="${escapeHtml(excerpt)}" data-full="${escapeHtml(fullSummary)}">${escapeHtml(excerpt)}</p>
                ${
                  canExpand
                    ? `<button class="live-event-card__toggle" type="button" aria-expanded="false" aria-controls="event-summary-${index}" data-event-toggle>Lire la suite</button>`
                    : ''
                }
                ${
                  event.ctaUrl && event.ctaLabel
                    ? `<a class="button button--secondary" href="${escapeUrl(event.ctaUrl)}">${escapeHtml(event.ctaLabel)}</a>`
                    : ''
                }
              </div>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
};

const bindEventToggles = () => {
  document.querySelectorAll<HTMLButtonElement>('[data-event-toggle]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const card = button.closest<HTMLElement>('[data-event-card]');
      const summary = card?.querySelector<HTMLElement>('[data-event-summary]');
      if (!card || !summary) return;

      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!isExpanded));
      card.dataset.expanded = String(!isExpanded);
      summary.textContent = isExpanded ? summary.dataset.excerpt ?? '' : summary.dataset.full ?? '';
      button.textContent = isExpanded ? 'Lire la suite' : 'Réduire';
    });
  });
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

  setText('[data-weekly-menu-label]', menu.weeklyMenu?.label || 'Menu de la semaine - midi');
  setText('[data-weekly-menu-price]', formatPriceValue(menu.weeklyMenu?.price || '17 €'));
  setText('[data-weekly-menu-description]', formatWeeklyMenuDescription(menu.weeklyMenu?.description || 'Entrée + plat\nou plat + dessert'));
  setText('[data-weekly-menu-supplement-price]', formatPriceValue(menu.weeklyMenu?.supplementPrice || '+4 €'));
  setText('[data-weekly-menu-supplement-description]', menu.weeklyMenu?.supplementDescription || 'formule complète');
  renderMenuSectionNav(menu);

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

  const sweetsCard = document.querySelector<HTMLElement>('[data-afternoon-sweets]');
  const sweetsList = document.querySelector<HTMLElement>('[data-afternoon-sweets-list]');
  if (sweetsCard && sweetsList) {
    const sweetsSection = menu.sections.find((section) => isSweetsSection(section.title));
    sweetsCard.hidden = !sweetsSection || sweetsSection.items.length === 0;
    sweetsList.innerHTML = sweetsSection
      ? sweetsSection.items
          .map(
            (item) => `
              <li>
                <div class="afternoon-sweets-card__item-head">
                  <strong>${escapeHtml(item.name)}</strong>
                  ${shouldShowPrice(item.price) ? `<span class="afternoon-sweets-card__price">${escapeHtml(formatPriceValue(item.price))}</span>` : ''}
                </div>
                ${item.description ? `<span>${escapeHtml(item.description)}</span>` : ''}
              </li>
            `
          )
          .join('')
      : '';
  }

  const sections = document.querySelector<HTMLElement>('[data-menu-sections]');
  if (sections) {
    sections.innerHTML = menu.sections
      .filter((section) => !isSweetsSection(section.title))
      .map(
        (section) => `
          <article class="menu-group is-visible" id="${escapeHtml(menuSectionId(section.title))}" data-reveal>
            <h2 class="menu-group__title">${escapeHtml(section.title)}</h2>
            <ul class="menu-list">
              ${section.items
                .map(
                  (item) => `
                    <li class="menu-list__item">
                      <div class="menu-list__head">
                        <h3 class="menu-list__name">${escapeHtml(item.name)}</h3>
                        ${shouldShowPrice(item.price) ? `<span class="menu-list__price">${escapeHtml(formatPriceValue(item.price))}</span>` : ''}
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

const hydrateEditorialContent = (content: EditorialContent) => {
  hydrateMenuDom(content.menu);
  renderSuggestions(content.suggestions);
  renderEvents(content.events);
  bindEventToggles();
  renderGallery(content.gallery);
};

export const initContentRuntime = async (apiRoot: string) => {
  const cachedContent = readCachedEditorialContent();
  if (cachedContent) {
    hydrateEditorialContent(cachedContent);
  }

  if (contentRuntimeRequest) {
    return contentRuntimeRequest;
  }

  contentRuntimeRequest = loadFreshEditorialContent(apiRoot, Boolean(cachedContent)).finally(() => {
    contentRuntimeRequest = null;
  });

  return contentRuntimeRequest;
};

const loadFreshEditorialContent = async (apiRoot: string, hasCachedContent: boolean) => {
  try {
    const response = await fetch(`${apiRoot}/content/editorial`, { cache: 'no-store' });
    if (!response.ok) throw new Error('content');
    const content = (await response.json()) as EditorialContent;

    writeCachedEditorialContent(content);
    hydrateEditorialContent(content);
  } catch (error) {
    if (!hasCachedContent) {
      console.error('Content runtime error:', error);
    }
  }
};

export { loadRemoteMenu };
