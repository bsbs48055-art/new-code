/**
 * FoodCraft Pro — Quick View modal
 * Fetches the lightweight `product.quick-view` alternate template via the
 * `?view=quick-view` query param and injects it into the shared modal.
 */
import { trapFocus, removeTrapFocus, publish, THEME_EVENTS } from './global.js';

function getModal() {
  return document.getElementById('QuickViewModal');
}

async function openQuickView(productUrl, opener) {
  const modal = getModal();
  if (!modal) return;
  const body = modal.querySelector('[data-quick-view-body]');
  body.innerHTML = `
    <div class="quick-view-modal__loading">
      <span class="skeleton aspect-ratio aspect-ratio--square rounded"></span>
      <div class="quick-view-modal__loading-lines">
        <span class="skeleton rounded" style="width: 70%; height: 2.8rem;"></span>
        <span class="skeleton rounded" style="width: 40%; height: 2rem;"></span>
        <span class="skeleton rounded" style="width: 100%; height: 4.8rem;"></span>
      </div>
    </div>
  `;

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overflow-hidden');
  trapFocus(modal.querySelector('.modal__content'));

  try {
    const response = await fetch(`${productUrl}?view=quick-view`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const content = doc.getElementById('QuickViewContent');
    if (content) {
      body.innerHTML = content.innerHTML;
      publish(THEME_EVENTS.quickViewOpen, { productUrl });
      window.FoodCraft?.initScrollReveal?.(body);
    } else {
      body.innerHTML = `<p class="quick-view-modal__error">${window.FoodCraft?.strings?.cartError || 'Unable to load product.'}</p>`;
    }
  } catch (error) {
    body.innerHTML = `<p class="quick-view-modal__error">${window.FoodCraft?.strings?.cartError || 'Unable to load product.'}</p>`;
  }
}

function closeQuickView(opener) {
  const modal = getModal();
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('overflow-hidden');
  removeTrapFocus(opener);
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-quick-view-trigger]');
  if (trigger) {
    event.preventDefault();
    openQuickView(trigger.dataset.productUrl, trigger);
    return;
  }
  const modal = getModal();
  if (!modal) return;
  if (event.target.closest('[data-modal-close]') && modal.classList.contains('is-open')) {
    closeQuickView(trigger);
  }
});
