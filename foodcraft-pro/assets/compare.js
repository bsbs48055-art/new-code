/**
 * FoodCraft Pro — Product compare
 * localStorage-backed, capped at 4 products. The compare table on
 * /pages/compare fetches full product JSON via the Ajax API for each item.
 */
import { storage, publish, subscribe, announce, THEME_EVENTS } from './global.js';

const STORAGE_KEY = 'foodcraft:compare';
const MAX_ITEMS = 4;

function getCompareList() {
  return storage.get(STORAGE_KEY, []);
}

function isInCompare(productId) {
  return getCompareList().some((item) => String(item.id) === String(productId));
}

function toggleCompare(product) {
  const list = getCompareList();
  const index = list.findIndex((item) => String(item.id) === String(product.id));
  let result = { added: false, limitReached: false };

  if (index > -1) {
    list.splice(index, 1);
  } else {
    if (list.length >= MAX_ITEMS) {
      result.limitReached = true;
      publish(THEME_EVENTS.compareUpdate, result);
      announce(window.FoodCraft?.strings?.compareLimit);
      return result;
    }
    list.push(product);
    result.added = true;
  }

  storage.set(STORAGE_KEY, list);
  publish(THEME_EVENTS.compareUpdate, { list, ...result });
  return result;
}

function refreshButtonStates(root = document) {
  root.querySelectorAll('[data-compare-toggle]').forEach((button) => {
    const active = isInCompare(button.dataset.productId);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active);
  });
}

function refreshCountBadge() {
  const count = getCompareList().length;
  document.querySelectorAll('[data-compare-count]').forEach((el) => {
    el.textContent = count;
    el.classList.toggle('is-hidden', count === 0);
  });
}

function readProductFromButton(button) {
  return {
    id: button.dataset.productId,
    handle: button.dataset.productHandle,
    title: button.dataset.productTitle,
    image: button.dataset.productImage,
    price: button.dataset.productPrice,
    url: button.dataset.productUrl,
  };
}

async function renderComparePage() {
  const container = document.querySelector('[data-compare-page]');
  if (!container) return;
  const list = getCompareList();
  const emptyState = container.querySelector('[data-compare-empty]');
  const tableWrapper = container.querySelector('[data-compare-table]');
  if (!tableWrapper) return;

  if (list.length === 0) {
    if (emptyState) emptyState.hidden = false;
    tableWrapper.hidden = true;
    return;
  }
  if (emptyState) emptyState.hidden = true;
  tableWrapper.hidden = false;

  const details = await Promise.all(
    list.map(async (item) => {
      try {
        const response = await fetch(`/products/${item.handle}.js`);
        return { ...item, full: await response.json() };
      } catch (error) {
        return { ...item, full: null };
      }
    })
  );

  const rows = [
    { label: window.FoodCraft?.strings?.compareImage || 'Image', render: (p) => `<img src="${p.image}" alt="${p.title}" width="140" height="140" loading="lazy">` },
    { label: window.FoodCraft?.strings?.compareTitle || 'Product', render: (p) => `<a href="${p.url}" class="link">${p.title}</a>` },
    { label: window.FoodCraft?.strings?.comparePrice || 'Price', render: (p) => p.price },
    {
      label: window.FoodCraft?.strings?.compareVendor || 'Vendor',
      render: (p) => p.full?.vendor || '—',
    },
    {
      label: window.FoodCraft?.strings?.compareAvailability || 'Availability',
      render: (p) => (p.full?.available ? window.FoodCraft?.strings?.addToCart || 'In stock' : window.FoodCraft?.strings?.soldOut || 'Sold out'),
    },
    {
      label: window.FoodCraft?.strings?.compareDescription || 'Description',
      render: (p) => (p.full?.description ? p.full.description.replace(/<[^>]*>/g, '').slice(0, 160) + '…' : '—'),
    },
    {
      label: '',
      render: (p) => `<button type="button" class="button--icon" data-compare-toggle data-product-id="${p.id}" aria-label="Remove">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg>'}</button>`,
    },
  ];

  tableWrapper.innerHTML = `
    <table class="compare-table">
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <th scope="row">${row.label}</th>
            ${details.map((p) => `<td>${row.render(p)}</td>`).join('')}
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;
}

function init() {
  refreshButtonStates();
  refreshCountBadge();

  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-compare-toggle]');
    if (!button) return;
    event.preventDefault();
    toggleCompare(readProductFromButton(button));
    refreshButtonStates();
    refreshCountBadge();
  });

  document.addEventListener('shopify:section:load', () => {
    refreshButtonStates();
    refreshCountBadge();
  });

  subscribe(THEME_EVENTS.compareUpdate, () => renderComparePage());
  renderComparePage();
}

document.addEventListener('DOMContentLoaded', init);

window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.compare = { getCompareList, isInCompare, toggleCompare, MAX_ITEMS };
