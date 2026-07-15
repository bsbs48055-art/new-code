/**
 * FoodCraft Pro — Countdown timer custom element
 * Used by the hero slider, product page scarcity block, and any custom
 * countdown banner. Parses `data-end-date` client-side (browser timezone).
 */
class CountdownTimer extends HTMLElement {
  connectedCallback() {
    this.endDate = new Date(this.dataset.endDate.replace(' ', 'T'));
    this.daysEl = this.querySelector('[data-countdown-days]');
    this.hoursEl = this.querySelector('[data-countdown-hours]');
    this.minutesEl = this.querySelector('[data-countdown-minutes]');
    this.secondsEl = this.querySelector('[data-countdown-seconds]');

    if (Number.isNaN(this.endDate.getTime())) {
      this.hidden = true;
      return;
    }

    this.tick();
    this.interval = setInterval(() => this.tick(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  tick() {
    const remaining = this.endDate.getTime() - Date.now();

    if (remaining <= 0) {
      clearInterval(this.interval);
      this.innerHTML = `<p class="countdown-timer__expired">${this.dataset.expiredMessage || 'This offer has ended.'}</p>`;
      return;
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((remaining / (1000 * 60)) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);

    if (this.daysEl) this.daysEl.textContent = String(days).padStart(2, '0');
    if (this.hoursEl) this.hoursEl.textContent = String(hours).padStart(2, '0');
    if (this.minutesEl) this.minutesEl.textContent = String(minutes).padStart(2, '0');
    if (this.secondsEl) this.secondsEl.textContent = String(seconds).padStart(2, '0');
  }
}
customElements.define('countdown-timer', CountdownTimer);
