/**
 * Customizer live preview for Beauty Glow Hub.
 */
(function ($) {
	'use strict';

	wp.customize('blogname', function (value) {
		value.bind(function (to) {
			$('.bgh-brand__title a').first().text(to);
		});
	});

	wp.customize('blogdescription', function (value) {
		value.bind(function (to) {
			$('.bgh-brand__tagline').text(to);
		});
	});

	wp.customize('bgh_footer_copyright', function (value) {
		value.bind(function (to) {
			$('.bgh-footer__bottom p').first().html(to);
		});
	});
})(jQuery);
