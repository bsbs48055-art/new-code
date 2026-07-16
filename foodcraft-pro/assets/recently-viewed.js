/**
 * FoodCraft Pro — Recently viewed products
 * Tracks visited products in localStorage (no app or customer account
 * required) and renders a carousel via sections/recently-viewed.liquid.
 */
import { storage } from './global.js';

const STORAGE_KEY = 'foodcraft:recently-viewed';
const MAX_ITEMS = 12;

function recordView(product) {
  if (!product?.id) return;
  const list = storage.get(STORAGE_KEY, []).filter((item) => String(item.id) !== String(product.id));
  list.unshift(product);
  storage.set(STORAGE_KEY, list.slice(0, MAX_ITEMS));
}

function getRecentlyViewed(excludeId) {
  return storage.get(STORAGE_KEY, []).filter((item) => String(item.id) !== String(excludeId));
}

function renderCarousel() {
  const container = document.querySelector('[data-recently-viewed]');
  if (!container) return;

  const excludeId = container.dataset.excludeId;
  const limit = Number(container.dataset.limit || 8);
  const items = getRecentlyViewed(excludeId).slice(0, limit);
  const track = container;
  const wrapper = container.closest('.recently-viewed');

  if (items.length === 0) {
    if (wrapper) wrapper.hidden = true;
    return;
  }
  if (wrapper) wrapper.hidden = false;

  track.innerHTML = items
    .map(
      (item) => `
      <div class="recently-viewed__item">
        <a href="${item.url}" class="product-card-lite">
          <span class="product-card-lite__media aspect-ratio aspect-ratio--square rounded">
            <img src="${item.image}" alt="${item.title}" loading="lazy" width="280" height="280">
          </span>
          <span class="product-card-lite__info">
            <span class="product-card-lite__title">${item.title}</span>
            <span class="product-card-lite__price">${item.price}</span>
          </span>
        </a>
      </div>`
    )
    .join('');
}

function init() {
  if (window.FoodCraft?.currentProduct) {
    recordView(window.FoodCraft.currentProduct);
  }
  renderCarousel();
}

document.addEventListener('DOMContentLoaded', init);

window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.recentlyViewed = { getRecentlyViewed, recordView };
