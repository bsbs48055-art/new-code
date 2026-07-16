/**
 * FoodCraft Pro — Ajax cart engine
 * Handles add/update/remove against the Cart API, refreshes the cart drawer
 * via the Section Rendering API, and keeps every cart-count badge in sync.
 */
import { debounce, publish, announce, THEME_EVENTS, trapFocus, removeTrapFocus } from './global.js';

const routes = () => window.FoodCraft?.routes || {};
const strings = () => window.FoodCraft?.strings || {};

class CartDrawer extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', (event) => {
      if (event.target.closest('[data-cart-drawer-close]') || event.target === this.querySelector('.cart-drawer__overlay')) {
        this.close();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.classList.contains('is-open')) this.close();
    });
  }

  open(opener) {
    this.openedBy = opener;
    this.classList.add('is-open');
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    trapFocus(this.querySelector('.cart-drawer__panel'));
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(this.openedBy);
  }
}
customElements.define('cart-drawer', CartDrawer);

function getCartDrawer() {
  return document.getElementById('CartDrawer');
}

function updateCartCountBadges(itemCount) {
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = itemCount;
    el.classList.toggle('is-hidden', itemCount === 0);
  });
}

async function refreshCartDrawer() {
  try {
    const response = await fetch(`${routes().cartUrl}?section_id=cart-drawer`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newDrawer = doc.querySelector('cart-drawer');
    const currentDrawer = getCartDrawer();
    if (newDrawer && currentDrawer) {
      const wasOpen = currentDrawer.classList.contains('is-open');
      currentDrawer.innerHTML = newDrawer.innerHTML;
      currentDrawer.className = newDrawer.className + (wasOpen ? ' is-open' : '');
    }
  } catch (error) {
    console.error('[FoodCraft] Failed to refresh cart drawer', error);
  }
}

async function cartFetch(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.description || data.message || 'Cart request failed');
    error.data = data;
    throw error;
  }
  return data;
}

export async function addToCart(formData, submitButton) {
  submitButton?.classList.add('button--loading');
  submitButton?.setAttribute('disabled', 'true');
  try {
    const payload = formData instanceof FormData ? Object.fromEntries(formData.entries()) : formData;
    const data = await cartFetch(routes().cartAddUrl, {
      items: [payload],
    });
    await syncCartState();
    await refreshCartDrawer();
    announce(strings().addedToCart || 'Item added to cart');
    publish(THEME_EVENTS.cartUpdate, { item: data });
    if (window.FoodCraft?.cart?.type !== 'page') {
      getCartDrawer()?.open(submitButton);
    } else {
      window.location.href = routes().cartUrl;
    }
    return data;
  } catch (error) {
    publish(THEME_EVENTS.cartError, { error });
    throw error;
  } finally {
    submitButton?.classList.remove('button--loading');
    submitButton?.removeAttribute('disabled');
  }
}

export async function updateCartLine(key, quantity, options = {}) {
  const { row, isPageContext } = options;
  row?.classList.add('is-loading');
  try {
    await fetch(routes().cartChangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity }),
    });
    await syncCartState();
    if (isPageContext) {
      window.location.reload();
      return;
    }
    await refreshCartDrawer();
    publish(THEME_EVENTS.cartUpdate, {});
  } catch (error) {
    console.error('[FoodCraft] Failed to update cart line', error);
  } finally {
    row?.classList.remove('is-loading');
  }
}

export async function updateCartNote(note) {
  try {
    await fetch(routes().cartUpdateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    });
  } catch (error) {
    console.error('[FoodCraft] Failed to update cart note', error);
  }
}

const debouncedQuantityUpdate = debounce((key, quantity, options) => updateCartLine(key, quantity, options), 300);
const debouncedNoteUpdate = debounce((note) => updateCartNote(note), 400);

function bindCartLineInteractions() {
  document.body.addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-cart-remove]');
    if (!removeBtn) return;
    const row = removeBtn.closest('[data-cart-item]');
    const isPageContext = Boolean(removeBtn.closest('.cart-page'));
    updateCartLine(removeBtn.dataset.lineItemKey, 0, { row, isPageContext });
  });

  document.body.addEventListener('change', (event) => {
    const input = event.target.closest('[data-quantity-input]');
    if (input && input.dataset.lineItemKey) {
      const row = input.closest('[data-cart-item]');
      const isPageContext = Boolean(input.closest('.cart-page'));
      debouncedQuantityUpdate(input.dataset.lineItemKey, Number(input.value), { row, isPageContext });
      return;
    }
    const note = event.target.closest('[data-cart-note]');
    if (note) debouncedNoteUpdate(note.value);
  });
}

async function syncCartState() {
  const response = await fetch('/cart.js');
  const cart = await response.json();
  window.FoodCraft.cart.itemCount = cart.item_count;
  window.FoodCraft.cart.totalPrice = cart.total_price;
  updateCartCountBadges(cart.item_count);
  return cart;
}

function bindProductForms() {
  document.body.addEventListener('submit', (event) => {
    const form = event.target.closest('.product-form');
    if (!form) return;
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    const formData = new FormData(form);
    addToCart(formData, submitButton).catch((error) => {
      const errorEl = form.querySelector('[data-form-error]');
      if (errorEl) {
        errorEl.textContent = error.message || strings().cartError;
        errorEl.hidden = false;
      }
    });
  });
}

function bindCartToggle() {
  document.body.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-cart-toggle]');
    if (!toggle) return;
    event.preventDefault();
    if (window.FoodCraft?.cart?.type === 'page') {
      window.location.href = routes().cartUrl;
      return;
    }
    getCartDrawer()?.open(toggle);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindProductForms();
  bindCartToggle();
  bindCartLineInteractions();
});

window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.addToCart = addToCart;
window.FoodCraft.updateCartLine = updateCartLine;
