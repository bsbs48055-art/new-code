/**
 * FoodCraft Pro — Wishlist
 * Entirely client-side, backed by localStorage so it works without a
 * customer account or app. Powers wishlist toggle buttons everywhere and the
 * dedicated /pages/wishlist page.
 */
import { storage, publish, subscribe, announce, THEME_EVENTS } from './global.js';

const STORAGE_KEY = 'foodcraft:wishlist';

function getWishlist() {
  return storage.get(STORAGE_KEY, []);
}

function isInWishlist(productId) {
  return getWishlist().some((item) => String(item.id) === String(productId));
}

function toggleWishlist(product) {
  const list = getWishlist();
  const index = list.findIndex((item) => String(item.id) === String(product.id));
  let added;
  if (index > -1) {
    list.splice(index, 1);
    added = false;
  } else {
    list.unshift(product);
    added = true;
  }
  storage.set(STORAGE_KEY, list);
  publish(THEME_EVENTS.wishlistUpdate, { list, added, product });
  announce(added ? window.FoodCraft?.strings?.wishlistAdded : window.FoodCraft?.strings?.wishlistRemoved);
  return added;
}

function refreshButtonStates(root = document) {
  root.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
    const active = isInWishlist(button.dataset.productId);
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', active);
  });
}

function refreshCountBadge() {
  const count = getWishlist().length;
  document.querySelectorAll('[data-wishlist-count]').forEach((el) => {
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

function init() {
  refreshButtonStates();
  refreshCountBadge();

  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-toggle]');
    if (!button) return;
    event.preventDefault();
    toggleWishlist(readProductFromButton(button));
    refreshButtonStates();
    refreshCountBadge();
  });

  document.addEventListener('shopify:section:load', () => {
    refreshButtonStates();
    refreshCountBadge();
  });

  subscribe(THEME_EVENTS.wishlistUpdate, () => renderWishlistPage());

  renderWishlistPage();
}

async function renderWishlistPage() {
  const container = document.querySelector('[data-wishlist-page]');
  if (!container) return;

  const list = getWishlist();
  const emptyState = container.querySelector('[data-wishlist-empty]');
  const grid = container.querySelector('[data-wishlist-grid]');
  if (!grid) return;

  if (list.length === 0) {
    if (emptyState) emptyState.hidden = false;
    grid.hidden = true;
    return;
  }

  if (emptyState) emptyState.hidden = true;
  grid.hidden = false;
  grid.innerHTML = list
    .map(
      (item) => `
      <div class="product-card-lite">
        <a href="${item.url}" class="product-card-lite__media aspect-ratio aspect-ratio--square rounded">
          <img src="${item.image}" alt="${item.title}" loading="lazy" width="400" height="400">
        </a>
        <div class="product-card-lite__info">
          <a href="${item.url}" class="product-card-lite__title">${item.title}</a>
          <p class="product-card-lite__price">${item.price}</p>
          <div class="product-card-lite__actions">
            <a href="${item.url}" class="button button--secondary button--small">${
        window.FoodCraft?.strings?.addToCart || 'View product'
      }</a>
            <button type="button" class="button--icon" data-wishlist-toggle data-product-id="${item.id}" aria-label="Remove from wishlist">
              ${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg>'}
            </button>
          </div>
        </div>
      </div>`
    )
    .join('');
}

document.addEventListener('DOMContentLoaded', init);

window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.wishlist = { getWishlist, isInWishlist, toggleWishlist };
