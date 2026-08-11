/**
 * KeepKeep Decorated — front-end behaviour.
 *
 * Deliberately small: two disclosure widgets and submenu toggles, no
 * dependencies, no polyfills, no framework. Everything degrades gracefully — CSS
 * opens submenus on hover and focus, and the search form is reachable from the
 * footer links and the sidebar even if this file never loads.
 */

( function () {
	'use strict';

	var header = document.getElementById( 'kkd-header' );
	if ( ! header ) {
		return;
	}

	var navToggle = header.querySelector( '[data-kkd-toggle="nav"]' );
	var searchToggle = header.querySelector( '[data-kkd-toggle="search"]' );
	var nav = document.getElementById( 'kkd-nav' );
	var searchPanel = document.getElementById( 'kkd-search-panel' );

	/**
	 * Reflect open/closed state on a button and its controlled element.
	 *
	 * @param {HTMLElement} button   Toggle button.
	 * @param {HTMLElement} panel    Controlled element.
	 * @param {string}      openClass Class applied while open.
	 * @param {boolean}     open     Desired state.
	 */
	function setExpanded( button, panel, openClass, open ) {
		button.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		if ( openClass === 'is-nav-open' ) {
			header.classList.toggle( openClass, open );
		} else if ( panel ) {
			panel.classList.toggle( openClass, open );
		}
	}

	function navIsOpen() {
		return navToggle && navToggle.getAttribute( 'aria-expanded' ) === 'true';
	}

	function searchIsOpen() {
		return searchToggle && searchToggle.getAttribute( 'aria-expanded' ) === 'true';
	}

	function closeNav() {
		if ( navToggle ) {
			setExpanded( navToggle, nav, 'is-nav-open', false );
		}
	}

	function closeSearch() {
		if ( searchToggle ) {
			setExpanded( searchToggle, searchPanel, 'is-open', false );
		}
	}

	if ( navToggle && nav ) {
		navToggle.addEventListener( 'click', function () {
			var open = ! navIsOpen();
			setExpanded( navToggle, nav, 'is-nav-open', open );
			if ( open ) {
				closeSearch();
			}
		} );
	}

	if ( searchToggle && searchPanel ) {
		searchToggle.addEventListener( 'click', function () {
			var open = ! searchIsOpen();
			setExpanded( searchToggle, searchPanel, 'is-open', open );
			if ( open ) {
				closeNav();
				var field = searchPanel.querySelector( 'input[type="search"]' );
				if ( field ) {
					field.focus();
				}
			}
		} );
	}

	/*
	 * Submenu toggles. On desktop the CSS already opens submenus on hover and
	 * focus; the button makes them operable by tap and by keyboard everywhere.
	 */
	Array.prototype.forEach.call(
		header.querySelectorAll( '.kkd-submenu-toggle' ),
		function ( button ) {
			button.addEventListener( 'click', function ( event ) {
				event.preventDefault();

				var item = button.closest( 'li' );
				if ( ! item ) {
					return;
				}

				var open = button.getAttribute( 'aria-expanded' ) !== 'true';
				button.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
				item.classList.toggle( 'is-open', open );
			} );
		}
	);

	/* Escape closes whichever disclosure is open and returns focus to it. */
	document.addEventListener( 'keydown', function ( event ) {
		if ( event.key !== 'Escape' ) {
			return;
		}
		if ( searchIsOpen() ) {
			closeSearch();
			searchToggle.focus();
			return;
		}
		if ( navIsOpen() ) {
			closeNav();
			navToggle.focus();
		}
	} );

	/* A click outside the header closes the mobile drawer. */
	document.addEventListener( 'click', function ( event ) {
		if ( ! navIsOpen() && ! searchIsOpen() ) {
			return;
		}
		if ( header.contains( event.target ) ) {
			return;
		}
		closeNav();
		closeSearch();
	} );

	/*
	 * Reset the drawer when the viewport grows past the desktop breakpoint, so
	 * the button's state never contradicts what is on screen.
	 */
	if ( window.matchMedia ) {
		var desktop = window.matchMedia( '(min-width: 64rem)' );
		var onChange = function ( event ) {
			if ( event.matches ) {
				closeNav();
			}
		};
		if ( desktop.addEventListener ) {
			desktop.addEventListener( 'change', onChange );
		} else if ( desktop.addListener ) {
			desktop.addListener( onChange );
		}
	}
}() );
