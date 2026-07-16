/**
 * FoodCraft Pro — Theme bootstrap
 * Registers small, shared custom elements that don't warrant their own file
 * and wires up global, cross-page interactive behaviour.
 */
import { trapFocus, removeTrapFocus, FoodCraftElement, debounce } from './global.js';

class DetailsDisclosure extends FoodCraftElement {
  constructor() {
    super();
    this.detailsEl = this.qs('details');
    this.summaryEl = this.qs('summary');
    this.contentEl = this.qs('summary').nextElementSibling;
    if (!this.detailsEl) return;
    this.detailsEl.addEventListener('toggle', this.onToggle.bind(this));
    this.summaryEl.setAttribute('aria-expanded', this.detailsEl.hasAttribute('open'));
  }

  onToggle() {
    const isOpen = this.detailsEl.hasAttribute('open');
    this.summaryEl.setAttribute('aria-expanded', isOpen);
    if (isOpen) this.closeSiblings();
  }

  closeSiblings() {
    document.querySelectorAll('details-disclosure details[open]').forEach((details) => {
      if (details !== this.detailsEl && details.closest('.mega-menu, .header__menu')) {
        details.removeAttribute('open');
      }
    });
  }
}

class AccordionDisclosure extends FoodCraftElement {
  constructor() {
    super();
    const details = this.qs('details');
    if (!details) return;
    const summary = this.qs('summary');
    summary.addEventListener('click', () => {
      requestAnimationFrame(() => {
        summary.setAttribute('aria-expanded', details.hasAttribute('open'));
      });
    });
  }
}

class BackToTop extends FoodCraftElement {
  constructor() {
    super();
    this.button = this.qs('button');
    if (!this.button) return;
    window.addEventListener(
      'scroll',
      debounce(() => {
        this.button.classList.toggle('is-visible', window.scrollY > 600);
      }, 100),
      { passive: true }
    );
    this.button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

class ModalDialog extends FoodCraftElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      if (event.target === this || event.target.hasAttribute('data-modal-close')) {
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
    const focusTarget = this.qs('[data-modal-content]') || this;
    trapFocus(focusTarget);
  }

  close() {
    this.classList.remove('is-open');
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(this.openedBy);
  }
}
customElements.define('modal-dialog', ModalDialog);
customElements.define('details-disclosure', DetailsDisclosure);
customElements.define('accordion-disclosure', AccordionDisclosure);
customElements.define('back-to-top', BackToTop);

document.addEventListener('shopify:section:load', () => {
  document.dispatchEvent(new CustomEvent('foodcraft:section:reloaded'));
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-print-page]')) window.print();
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-reservation-date]').forEach((input) => {
    input.min = new Date().toISOString().split('T')[0];
  });
});

function initFaqSearch() {
  document.querySelectorAll('[data-faq-search]').forEach((input) => {
    const list = input.closest('.faq-section')?.querySelector('[data-faq-list]');
    if (!list) return;
    const items = Array.from(list.querySelectorAll('[data-faq-item]'));
    const noResults = list.querySelector('[data-faq-no-results]');

    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let visibleCount = 0;
      items.forEach((item) => {
        const question = item.querySelector('[data-faq-question]')?.textContent.toLowerCase() || '';
        const answer = item.querySelector('[data-faq-answer]')?.textContent.toLowerCase() || '';
        const matches = !query || question.includes(query) || answer.includes(query);
        item.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      if (noResults) noResults.hidden = visibleCount !== 0;
    });
  });
}

document.addEventListener('DOMContentLoaded', initFaqSearch);
document.addEventListener('shopify:section:load', initFaqSearch);
