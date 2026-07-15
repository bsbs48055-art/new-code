/**
 * FoodCraft Pro — Product reviews
 * Toggles the review submission panel. The rating <fieldset> uses
 * reversed radio order in markup (5★ first) purely for CSS layout, this
 * script has no dependency on that order.
 */
function initReviewToggle() {
  document.querySelectorAll('[data-toggle-review-form]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('.product-reviews')?.querySelector('[data-review-form-panel]');
      if (!panel) return;
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) {
        panel.removeAttribute('hidden');
        panel.querySelector('input, textarea')?.focus();
      } else {
        panel.setAttribute('hidden', '');
      }
      button.setAttribute('aria-expanded', String(isHidden));
    });
  });
}

document.addEventListener('DOMContentLoaded', initReviewToggle);
document.addEventListener('shopify:section:load', initReviewToggle);
