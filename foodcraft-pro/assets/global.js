/**
 * FoodCraft Pro — Global utilities
 * Shared helpers used across every custom element and module in the theme.
 */

export const THEME_EVENTS = {
  cartUpdate: 'foodcraft:cart:update',
  cartError: 'foodcraft:cart:error',
  wishlistUpdate: 'foodcraft:wishlist:update',
  compareUpdate: 'foodcraft:compare:update',
  variantChange: 'foodcraft:variant:change',
  quickViewOpen: 'foodcraft:quickview:open',
};

/** Lightweight publish/subscribe bus used for cross-component communication. */
const subscribers = {};

export function subscribe(eventName, callback) {
  if (!subscribers[eventName]) subscribers[eventName] = [];
  subscribers[eventName].push(callback);
  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => cb !== callback);
  };
}

export function publish(eventName, data) {
  (subscribers[eventName] || []).forEach((callback) => callback(data));
  document.dispatchEvent(new CustomEvent(eventName, { detail: data, bubbles: true }));
}

/** Debounce: delay invocation until `wait` ms after the last call. */
export function debounce(fn, wait = 200) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

/** Throttle: guarantee at most one invocation per `limit` ms. */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (inThrottle) return;
    fn(...args);
    inThrottle = true;
    setTimeout(() => (inThrottle = false), limit);
  };
}

export function fetchConfig(type = 'json', body = null) {
  const config = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: `application/${type}`,
    },
  };
  if (body) config.body = JSON.stringify(body);
  return config;
}

/** Format a price in the shop's active currency (cents-based integer input). */
export function formatMoney(cents, format) {
  if (typeof cents === 'string') cents = cents.replace('.', '');
  const value = Number(cents) / 100;
  const moneyFormat = format || window.FoodCraft?.moneyFormat || '${{amount}}';
  const amount = value.toLocaleString(window.FoodCraft?.locale || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return moneyFormat.replace('{{amount}}', amount).replace('{{amount_no_decimals}}', Math.round(value).toString());
}

/** Trap focus within a container — used by modals, drawers, and menus. */
export function trapFocus(container, elementToFocus = container) {
  const focusableSelector =
    'summary, a[href], button:not([disabled]), [tabindex]:not([tabindex^="-"]), [draggable], area, input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), object, iframe';
  const elements = Array.from(container.querySelectorAll(focusableSelector));
  const first = elements[0];
  const last = elements[elements.length - 1];

  removeTrapFocus();

  container.setAttribute('tabindex', '-1');

  function handleKeydown(event) {
    if (event.key !== 'Tab') return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  document.addEventListener('keydown', handleKeydown);
  container.setAttribute('data-trap-focus-handler', 'true');
  window._trapFocusHandler = handleKeydown;

  (elementToFocus || container).focus();
}

export function removeTrapFocus(elementToFocus = null) {
  if (window._trapFocusHandler) {
    document.removeEventListener('keydown', window._trapFocusHandler);
    window._trapFocusHandler = null;
  }
  if (elementToFocus) elementToFocus.focus();
}

export function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'summary, a[href], button:not([disabled]), [tabindex]:not([tabindex^="-"]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )
  );
}

/** Set of small DOM helpers to reduce boilerplate. */
export function qs(selector, context = document) {
  return context.querySelector(selector);
}

export function qsa(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/** Reads/writes to localStorage with JSON encoding & graceful fallback. */
export const storage = {
  get(key, fallback = null) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      /* no-op */
    }
  },
};

/** Announces a message to assistive technology via a shared live region. */
export function announce(message) {
  let region = document.getElementById('SrLiveRegion');
  if (!region) {
    region = document.createElement('div');
    region.id = 'SrLiveRegion';
    region.className = 'sr-live-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  region.textContent = '';
  window.requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function isMobile() {
  return window.matchMedia('(max-width: 749px)').matches;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function onDocumentReady(callback) {
  if (document.readyState !== 'loading') callback();
  else document.addEventListener('DOMContentLoaded', callback);
}

/**
 * Base class for scoped custom elements. Provides a shorthand for querying
 * within the element and automatically binds `this` for event handlers.
 */
export class FoodCraftElement extends HTMLElement {
  qs(selector) {
    return this.querySelector(selector);
  }

  qsa(selector) {
    return Array.from(this.querySelectorAll(selector));
  }
}

window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.debounce = debounce;
window.FoodCraft.throttle = throttle;
window.FoodCraft.formatMoney = formatMoney;
window.FoodCraft.publish = publish;
window.FoodCraft.subscribe = subscribe;
window.FoodCraft.storage = storage;
window.FoodCraft.events = THEME_EVENTS;
