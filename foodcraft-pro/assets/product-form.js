/**
 * FoodCraft Pro — Product form: quantity stepper + variant picker
 * The variant picker computes combinatorial availability client-side from
 * the variants JSON embedded by snippets/variant-picker.liquid, and keeps
 * price, media, SKU, URL, and the add-to-cart button in sync — no page reload.
 */
import { formatMoney, publish, THEME_EVENTS } from './global.js';

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('[data-quantity-input]');
    this.querySelector('[data-quantity-decrease]')?.addEventListener('click', () => this.step(-1));
    this.querySelector('[data-quantity-increase]')?.addEventListener('click', () => this.step(1));
    this.input?.addEventListener('change', () => this.clamp());
  }

  step(delta) {
    const min = Number(this.input.min || 0);
    const max = this.input.max ? Number(this.input.max) : Infinity;
    const next = Math.min(max, Math.max(min, Number(this.input.value || 0) + delta));
    this.input.value = next;
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  clamp() {
    const min = Number(this.input.min || 0);
    const max = this.input.max ? Number(this.input.max) : Infinity;
    const value = Math.min(max, Math.max(min, Number(this.input.value || min)));
    if (String(value) !== this.input.value) this.input.value = value;
  }
}
customElements.define('quantity-input', QuantityInput);

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    const url = this.dataset.url;
    if (!url) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.fetchRecommendations(url);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' }
    );
    observer.observe(this);
  }

  async fetchRecommendations(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContent = doc.querySelector('product-recommendations');
      if (newContent?.innerHTML.trim()) {
        this.innerHTML = newContent.innerHTML;
        this.closest('.related-products')?.removeAttribute('hidden');
      } else {
        this.closest('.related-products')?.setAttribute('hidden', '');
      }
    } catch (error) {
      console.error('[FoodCraft] Failed to load product recommendations', error);
    }
  }
}
customElements.define('product-recommendations', ProductRecommendations);

class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.sectionId = this.dataset.section;
    this.productUrl = this.dataset.url;
    this.variantDataEl = this.querySelector('[data-variant-data]');
    this.variants = this.variantDataEl ? JSON.parse(this.variantDataEl.textContent) : [];
    this.select = this.querySelector('[data-variant-select]');
    this.form = this.closest('.product-form') || this.closest('.product-info');

    this.addEventListener('change', (event) => {
      if (event.target.matches('.swatch__input')) this.handleOptionChange();
    });

    this.updateAvailability();
  }

  getSelectedOptions() {
    const groups = Array.from(this.querySelectorAll('.variant-picker__option'));
    return groups.map((group) => {
      const checked = group.querySelector('.swatch__input:checked');
      return checked ? checked.value : null;
    });
  }

  findVariant(options) {
    return this.variants.find((variant) => {
      const variantOptions = [variant.option1, variant.option2, variant.option3];
      return options.every((value, index) => value === null || variantOptions[index] === value);
    });
  }

  handleOptionChange() {
    const options = this.getSelectedOptions();
    const matchedVariant = this.findVariant(options);

    this.querySelectorAll('.variant-picker__option').forEach((group, index) => {
      const selected = group.querySelector('.swatch__input:checked');
      const label = group.querySelector('[data-selected-value]');
      if (label && selected) label.textContent = selected.value;
    });

    this.updateAvailability();

    if (matchedVariant) {
      this.selectVariant(matchedVariant);
    } else {
      this.disableForm();
    }
  }

  updateAvailability() {
    const groups = Array.from(this.querySelectorAll('.variant-picker__option'));
    const currentSelection = this.getSelectedOptions();

    groups.forEach((group, groupIndex) => {
      const swatches = Array.from(group.querySelectorAll('.swatch'));
      swatches.forEach((swatch) => {
        const input = swatch.querySelector('.swatch__input');
        const testSelection = [...currentSelection];
        testSelection[groupIndex] = input.value;
        const isAvailable = this.variants.some((variant) => {
          const variantOptions = [variant.option1, variant.option2, variant.option3];
          const matches = testSelection.every((value, index) => value === null || variantOptions[index] === value);
          return matches && variant.available;
        });
        swatch.classList.toggle('swatch--unavailable', !isAvailable);
      });
    });
  }

  selectVariant(variant) {
    if (this.select) {
      this.select.value = variant.id;
    }

    const form = this.closest('.product-form');
    const hiddenInput = form?.querySelector('input[name="id"]');
    if (hiddenInput) hiddenInput.value = variant.id;

    this.updatePrice(variant);
    this.updateAddToCartButton(variant);
    this.updateMedia(variant);
    this.updateUrl(variant);

    publish(THEME_EVENTS.variantChange, { variant });
  }

  updatePrice(variant) {
    const priceWrapper = document.querySelector(`[data-product-price="${this.sectionId}"]`);
    if (!priceWrapper) return;
    const regular = priceWrapper.querySelector('.price__regular');
    const sale = priceWrapper.querySelector('.price__sale');
    const compare = priceWrapper.querySelector('.price__compare');

    if (variant.compare_at_price > variant.price) {
      priceWrapper.classList.add('price--on-sale');
      if (sale) sale.textContent = formatMoney(variant.price);
      if (compare) compare.textContent = formatMoney(variant.compare_at_price);
    } else {
      priceWrapper.classList.remove('price--on-sale');
      if (regular) regular.textContent = formatMoney(variant.price);
    }
  }

  updateAddToCartButton(variant) {
    const form = this.closest('.product-form');
    const button = form?.querySelector('[data-add-to-cart-button]');
    const buttonText = button?.querySelector('[data-add-to-cart-text]');
    if (!button) return;

    if (!variant.available) {
      button.setAttribute('disabled', 'true');
      if (buttonText) buttonText.textContent = window.FoodCraft?.strings?.soldOut || 'Sold out';
    } else {
      button.removeAttribute('disabled');
      if (buttonText) buttonText.textContent = window.FoodCraft?.strings?.addToCart || 'Add to cart';
    }
  }

  disableForm() {
    const form = this.closest('.product-form');
    const button = form?.querySelector('[data-add-to-cart-button]');
    const buttonText = button?.querySelector('[data-add-to-cart-text]');
    button?.setAttribute('disabled', 'true');
    if (buttonText) buttonText.textContent = window.FoodCraft?.strings?.soldOut || 'Unavailable';
  }

  updateMedia(variant) {
    if (!variant.featured_media) return;
    const gallery = document.querySelector(`product-media-gallery[data-section="${this.sectionId}"]`);
    const target = gallery?.querySelector(`[data-media-id="${variant.featured_media.id}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      gallery.querySelectorAll('.product-gallery__thumbnail').forEach((thumb) => {
        thumb.classList.toggle('is-active', thumb.dataset.mediaId === String(variant.featured_media.id));
      });
    }
  }

  updateUrl(variant) {
    if (!this.productUrl || !window.history?.replaceState) return;
    const url = new URL(this.productUrl, window.location.origin);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }
}
customElements.define('variant-picker', VariantPicker);

function initGalleryThumbnails() {
  document.querySelectorAll('product-media-gallery').forEach((gallery) => {
    const track = gallery.querySelector('[data-slider-track]');
    gallery.querySelectorAll('.product-gallery__thumbnail').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const target = gallery.querySelector(`[data-media-id="${thumb.dataset.mediaId}"]`);
        target?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        gallery.querySelectorAll('.product-gallery__thumbnail').forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });

    if (track) {
      track.addEventListener(
        'scroll',
        () => {
          const slides = Array.from(track.children);
          const trackRect = track.getBoundingClientRect();
          const current = slides.find((slide) => {
            const rect = slide.getBoundingClientRect();
            return rect.left >= trackRect.left - 10 && rect.left <= trackRect.left + 10;
          });
          if (current) {
            gallery.querySelectorAll('.product-gallery__thumbnail').forEach((thumb) => {
              thumb.classList.toggle('is-active', thumb.dataset.mediaId === current.dataset.mediaId);
            });
          }
        },
        { passive: true }
      );
    }
  });
}

document.addEventListener('DOMContentLoaded', initGalleryThumbnails);
document.addEventListener('shopify:section:load', initGalleryThumbnails);
