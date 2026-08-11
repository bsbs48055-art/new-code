/**
 * Live preview for the site title and tagline in the Customizer.
 */

( function ( $ ) {
	'use strict';

	if ( ! window.wp || ! window.wp.customize ) {
		return;
	}

	wp.customize( 'blogname', function ( value ) {
		value.bind( function ( to ) {
			$( '.kkd-brand__name a' ).text( to );
		} );
	} );

	wp.customize( 'blogdescription', function ( value ) {
		value.bind( function ( to ) {
			$( '.kkd-brand__tagline, .kkd-intro__title' ).text( to );
		} );
	} );
}( jQuery ) );
