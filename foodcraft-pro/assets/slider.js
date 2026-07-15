/**
 * FoodCraft Pro — Generic slider/carousel custom element
 * Used by the hero slider, announcement bar, featured product/recipe rails,
 * testimonials, Instagram feed, and related/recently-viewed rails.
 * Built on native scroll-snap so it works without JS as a fallback.
 */
import { throttle } from './global.js';

class SliderComponent extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-slider-track]');
    if (!this.track) return;
    this.prevButton = this.querySelector('[data-slider-prev]');
    this.nextButton = this.querySelector('[data-slider-next]');
    this.dotsContainer = this.querySelector('[data-slider-dots]');
    this.slides = Array.from(this.track.children);

    if (this.dotsContainer && this.slides.length > 1) this.buildDots();

    this.prevButton?.addEventListener('click', () => this.scrollByDirection(-1));
    this.nextButton?.addEventListener('click', () => this.scrollByDirection(1));
    this.track.addEventListener('scroll', throttle(() => this.updateControls(), 100), { passive: true });

    this.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') this.scrollByDirection(-1);
      if (event.key === 'ArrowRight') this.scrollByDirection(1);
    });

    window.addEventListener('resize', throttle(() => this.updateControls(), 200));

    this.updateControls();

    const autoplaySeconds = Number(this.dataset.autoplay || this.closest('[data-autoplay]')?.dataset.autoplay);
    if (autoplaySeconds > 0) this.startAutoplay(autoplaySeconds * 1000);
  }

  disconnectedCallback() {
    clearInterval(this.autoplayTimer);
  }

  buildDots() {
    this.dotsContainer.innerHTML = '';
    this.slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider__dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => this.scrollToIndex(index));
      this.dotsContainer.appendChild(dot);
    });
  }

  getSlideWidth() {
    return this.slides[0]?.getBoundingClientRect().width + this.gapSize();
  }

  gapSize() {
    return parseFloat(getComputedStyle(this.track).columnGap || getComputedStyle(this.track).gap || 0);
  }

  scrollByDirection(direction) {
    this.track.scrollBy({ left: direction * this.getSlideWidth(), behavior: 'smooth' });
  }

  scrollToIndex(index) {
    this.track.scrollTo({ left: index * this.getSlideWidth(), behavior: 'smooth' });
  }

  getCurrentIndex() {
    const width = this.getSlideWidth() || 1;
    return Math.round(this.track.scrollLeft / width);
  }

  updateControls() {
    const maxScroll = this.track.scrollWidth - this.track.clientWidth - 2;
    if (this.prevButton) this.prevButton.disabled = this.track.scrollLeft <= 2;
    if (this.nextButton) this.nextButton.disabled = this.track.scrollLeft >= maxScroll || maxScroll <= 0;

    if (this.dotsContainer) {
      const currentIndex = this.getCurrentIndex();
      Array.from(this.dotsContainer.children).forEach((dot, index) => {
        dot.classList.toggle('is-active', index === currentIndex);
      });
    }
  }

  startAutoplay(interval) {
    this.autoplayTimer = setInterval(() => {
      const maxScroll = this.track.scrollWidth - this.track.clientWidth - 2;
      if (this.track.scrollLeft >= maxScroll) {
        this.track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        this.scrollByDirection(1);
      }
    }, interval);

    this.addEventListener('mouseenter', () => clearInterval(this.autoplayTimer));
    this.addEventListener('mouseleave', () => this.startAutoplay(interval));
    this.addEventListener('focusin', () => clearInterval(this.autoplayTimer));
  }
}
customElements.define('slider-component', SliderComponent);
