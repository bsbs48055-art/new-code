/**
 * FoodCraft Pro — Scroll reveal animations
 * Adds `.is-visible` to any [data-animate] element once it enters the viewport.
 * Respects prefers-reduced-motion and the enable_animations theme setting.
 */
function initScrollReveal(root = document) {
  if (!document.documentElement.classList.contains('animations-enabled')) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const elements = root.querySelectorAll('[data-animate]:not(.is-visible)');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const index = Number(el.getAttribute('data-animate-index') || 0);
        el.style.setProperty('--animate-delay', `${Math.min(index * 80, 480)}ms`);
        el.classList.add('is-visible');
        obs.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => initScrollReveal());
document.addEventListener('shopify:section:load', (event) => initScrollReveal(event.target));
window.FoodCraft = window.FoodCraft || {};
window.FoodCraft.initScrollReveal = initScrollReveal;
