/**
 * Beauty Glow Hub - front-end interactions.
 * Vanilla JS, no dependencies, progressive enhancement.
 */
(function () {
	'use strict';

	document.addEventListener('DOMContentLoaded', function () {
		initMobileMenu();
		initSearchToggle();
		initFaqAccordion();
		initBackToTop();
	});

	/** Mobile navigation toggle. */
	function initMobileMenu() {
		var toggle = document.querySelector('.bgh-menu-toggle');
		var menu = document.getElementById('primary-menu');
		if (!toggle || !menu) {
			return;
		}
		toggle.addEventListener('click', function () {
			var open = menu.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
		});

		// Close menu when a link is tapped (mobile).
		menu.addEventListener('click', function (e) {
			if (e.target.tagName === 'A' && window.innerWidth <= 860) {
				menu.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
			}
		});
	}

	/** Header search dropdown. */
	function initSearchToggle() {
		var btn = document.querySelector('.bgh-search-toggle');
		var panel = document.getElementById('bgh-search-panel');
		if (!btn || !panel) {
			return;
		}
		btn.addEventListener('click', function () {
			var open = panel.classList.toggle('is-open');
			btn.setAttribute('aria-expanded', open ? 'true' : 'false');
			if (open) {
				var field = panel.querySelector('input[type="search"]');
				if (field) {
					field.focus();
				}
			}
		});
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && panel.classList.contains('is-open')) {
				panel.classList.remove('is-open');
				btn.setAttribute('aria-expanded', 'false');
				btn.focus();
			}
		});
	}

	/** FAQ accordion (homepage + FAQ page). */
	function initFaqAccordion() {
		var items = document.querySelectorAll('.bgh-faq__item');
		items.forEach(function (item) {
			var q = item.querySelector('.bgh-faq__q');
			if (!q) {
				return;
			}
			q.addEventListener('click', function () {
				var isOpen = item.classList.toggle('is-open');
				q.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
			});
		});
	}

	/** Back-to-top button, created lazily. */
	function initBackToTop() {
		var btn = document.createElement('button');
		btn.className = 'bgh-to-top';
		btn.type = 'button';
		btn.setAttribute('aria-label', 'Back to top');
		btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg>';
		btn.style.cssText = 'position:fixed;right:20px;bottom:20px;width:46px;height:46px;border-radius:50%;border:0;background:#E91E63;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(233,30,99,.35);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;z-index:80;display:flex;align-items:center;justify-content:center;';
		document.body.appendChild(btn);

		var toggle = function () {
			if (window.pageYOffset > 600) {
				btn.style.opacity = '1';
				btn.style.visibility = 'visible';
			} else {
				btn.style.opacity = '0';
				btn.style.visibility = 'hidden';
			}
		};
		window.addEventListener('scroll', toggle, { passive: true });
		btn.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
})();
