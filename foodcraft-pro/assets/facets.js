/**
 * FoodCraft Pro — Collection filters, sorting & pagination
 * Fully Ajax: every filter change, sort change, or pagination click re-fetches
 * just the collection-grid section via the Section Rendering API and swaps
 * it in-place, updating the URL with `history.pushState` (no full reload).
 */
import { debounce, trapFocus, removeTrapFocus } from './global.js';

function getSectionId(container) {
  return container.id.replace('CollectionGrid-', '');
}

function buildUrlFromForm(form, baseUrl) {
  const formData = new FormData(form);
  const params = new URLSearchParams();
  for (const [key, value] of formData.entries()) {
    if (value !== '') params.append(key, value);
  }
  const sortSelect = document.querySelector('[data-sort-select]');
  if (sortSelect) params.set('sort_by', sortSelect.value);
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
}

async function renderSection(container, url) {
  container.classList.add('is-loading');
  try {
    const sectionId = getSectionId(container);
    const fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('section_id', sectionId);
    const response = await fetch(fetchUrl.toString());
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContainer = doc.getElementById(container.id);
    if (newContainer) {
      container.innerHTML = newContainer.innerHTML;
      const cleanUrl = new URL(url, window.location.origin);
      cleanUrl.searchParams.delete('section_id');
      window.history.pushState({}, '', `${cleanUrl.pathname}${cleanUrl.search}`);
      bindCollectionGrid(container);
      window.FoodCraft?.initScrollReveal?.(container);
      document.dispatchEvent(new CustomEvent('shopify:section:load', { detail: { sectionId } }));
      container.querySelector('.collection-grid__toolbar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    console.error('[FoodCraft] Failed to update collection results', error);
  } finally {
    container.classList.remove('is-loading');
  }
}

function bindCollectionGrid(container) {
  const form = container.querySelector('[data-facets-form]');
  const sortSelect = container.querySelector('[data-sort-select]');
  const baseUrl = window.location.pathname;

  const triggerUpdate = debounce(() => {
    renderSection(container, buildUrlFromForm(form, baseUrl));
  }, 300);

  form?.querySelectorAll('[data-facet-input]').forEach((input) => {
    input.addEventListener('change', triggerUpdate);
    if (input.dataset.facetPrice) input.addEventListener('input', triggerUpdate);
  });

  sortSelect?.addEventListener('change', triggerUpdate);

  container.querySelectorAll('[data-facet-remove]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      renderSection(container, link.href);
    });
  });

  container.querySelector('[data-active-facets] .active-facets__clear')?.addEventListener('click', (event) => {
    event.preventDefault();
    renderSection(container, event.currentTarget.href);
  });

  container.querySelectorAll('[data-pagination] a').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      renderSection(container, link.href);
    });
  });

  container.querySelector('[data-facets-clear-all]')?.addEventListener('click', () => {
    renderSection(container, baseUrl);
  });

  bindViewToggle(container);
  bindMobileFacets(container);
}

function bindViewToggle(container) {
  const buttons = container.querySelectorAll('[data-view-toggle]');
  const grid = container.querySelector('[data-product-grid]');
  if (!grid) return;
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('is-active'));
      button.classList.add('is-active');
      grid.classList.toggle('collection-grid__products--list', button.dataset.viewToggle === 'list');
    });
  });
}

function bindMobileFacets(container) {
  const toggle = container.querySelector('[data-facets-toggle]');
  const sidebar = container.querySelector('[data-facets-sidebar]');
  const closeButton = sidebar?.querySelector('[data-facets-close]');
  if (!toggle || !sidebar) return;

  const open = () => {
    sidebar.classList.add('is-open');
    sidebar.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    trapFocus(sidebar);
  };
  const close = () => {
    sidebar.classList.remove('is-open');
    sidebar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(toggle);
  };

  toggle.addEventListener('click', open);
  closeButton?.addEventListener('click', close);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) close();
  });
}

function init() {
  document.querySelectorAll('.collection-grid-section').forEach((container) => bindCollectionGrid(container));
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('shopify:section:load', init);
