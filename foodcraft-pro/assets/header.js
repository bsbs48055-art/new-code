/**
 * FoodCraft Pro — Header interactions
 * Sticky header show/hide on scroll, mobile nav drawer, and search drawer toggling.
 */
import { throttle, trapFocus, removeTrapFocus, qs, qsa } from './global.js';

class StickyHeader extends HTMLElement {
  constructor() {
    super();
    this.isSticky = this.dataset.sticky === 'true';
    this.lastScrollY = window.scrollY;
    this.onScroll = throttle(this.handleScroll.bind(this), 80);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.handleScroll();
  }

  handleScroll() {
    const scrollY = window.scrollY;
    this.classList.toggle('is-scrolled', scrollY > 12);

    if (this.isSticky && scrollY > 240) {
      if (scrollY > this.lastScrollY) {
        this.classList.add('is-header-hidden');
      } else {
        this.classList.remove('is-header-hidden');
      }
    } else {
      this.classList.remove('is-header-hidden');
    }
    this.lastScrollY = scrollY;
  }
}
customElements.define('sticky-header', StickyHeader);

function initMobileNav() {
  const toggle = qs('[data-mobile-nav-toggle]');
  const nav = qs('#MobileNav');
  if (!toggle || !nav) return;

  const openNav = () => {
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('overflow-hidden');
    trapFocus(nav.querySelector('.mobile-nav__panel'));
  };

  const closeNav = () => {
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(toggle);
  };

  toggle.addEventListener('click', openNav);
  qsa('[data-mobile-nav-close]', nav).forEach((el) => el.addEventListener('click', closeNav));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeNav();
  });
}

function initSearchDrawer() {
  const toggle = qs('[data-search-toggle]');
  const drawer = qs('#SearchDrawer');
  if (!toggle || !drawer) return;

  const openDrawer = () => {
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    const input = drawer.querySelector('[data-predictive-search-input]');
    setTimeout(() => input?.focus(), 100);
  };

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    removeTrapFocus(toggle);
  };

  toggle.addEventListener('click', openDrawer);
  qsa('[data-search-close]', drawer).forEach((el) => el.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initSearchDrawer();
});
