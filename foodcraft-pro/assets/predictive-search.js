/**
 * FoodCraft Pro — Predictive search
 * Debounced fetch against the Predictive Search API, rendered server-side by
 * sections/predictive-search.liquid and injected into the search drawer.
 */
import { debounce } from './global.js';

let latestQuery = '';

async function fetchResults(query) {
  const resultsEl = document.querySelector('[data-predictive-search-results]');
  const clearButton = document.querySelector('[data-search-clear]');
  if (!resultsEl) return;

  if (clearButton) clearButton.hidden = query.length === 0;

  if (!query) {
    resultsEl.innerHTML = `<p class="search-drawer__hint">${window.FoodCraft?.strings?.searchHint || 'Start typing to search products, recipes, and pages.'}</p>`;
    return;
  }

  latestQuery = query;
  resultsEl.classList.add('is-loading');

  try {
    const url = `${window.FoodCraft.routes.predictiveSearchUrl}?q=${encodeURIComponent(
      query
    )}&resources[type]=product,collection,page,article&resources[limit]=6&resources[options][unavailable_products]=last&section_id=predictive-search`;
    const response = await fetch(url);
    const html = await response.text();

    if (query !== latestQuery) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.getElementById('PredictiveSearchResults');
    resultsEl.innerHTML = content ? content.outerHTML : html;
  } catch (error) {
    console.error('[FoodCraft] Predictive search failed', error);
  } finally {
    resultsEl.classList.remove('is-loading');
  }
}

const debouncedFetch = debounce(fetchResults, 250);

function initPredictiveSearch() {
  const input = document.querySelector('[data-predictive-search-input]');
  const form = document.querySelector('[data-predictive-search-form]');
  const clearButton = document.querySelector('[data-search-clear]');
  if (!input) return;

  input.addEventListener('input', (event) => debouncedFetch(event.target.value.trim()));

  clearButton?.addEventListener('click', () => {
    input.value = '';
    input.focus();
    debouncedFetch('');
  });

  form?.addEventListener('submit', (event) => {
    if (!input.value.trim()) event.preventDefault();
  });
}

document.addEventListener('DOMContentLoaded', initPredictiveSearch);
