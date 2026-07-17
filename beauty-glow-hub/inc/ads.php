<?php
/**
 * Ad placement helpers.
 *
 * Renders labelled, non-intrusive ad containers. When no ad code is set for a
 * slot, a subtle placeholder is shown to visualise placement in demo/preview
 * mode; on production sites without code, placeholders can be disabled with
 * the `bgh_show_ad_placeholders` filter.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether to show demo placeholders for empty ad slots.
 *
 * @return bool
 */
function bgh_show_ad_placeholders() {
	return (bool) apply_filters( 'bgh_show_ad_placeholders', true );
}

/**
 * Render an ad slot.
 *
 * @param string $slot        Customizer setting key (e.g. bgh_ad_header).
 * @param string $modifier    CSS modifier suffix (e.g. leaderboard, in-article).
 * @param string $placeholder Placeholder label.
 */
function bgh_ad_slot( $slot, $modifier = '', $placeholder = '' ) {
	$code    = get_theme_mod( $slot );
	$has_ad  = ! empty( trim( (string) $code ) );

	if ( ! $has_ad && ! bgh_show_ad_placeholders() ) {
		return;
	}

	$class = 'bgh-ad';
	if ( $modifier ) {
		$class .= ' bgh-ad--' . sanitize_html_class( $modifier );
	}

	echo '<div class="' . esc_attr( $class ) . '">';
	echo '<span class="bgh-ad__label">' . esc_html__( 'Advertisement', 'beauty-glow-hub' ) . '</span>';

	if ( $has_ad ) {
		// Trusted admin markup (AdSense/ad network snippet).
		echo '<div class="bgh-ad__code">' . $code . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	} else {
		$label = $placeholder ? $placeholder : __( 'Ad space', 'beauty-glow-hub' );
		echo '<div class="bgh-ad__slot">' . esc_html( $label ) . '</div>';
	}
	echo '</div>';
}

/**
 * Insert an in-content ad after the Nth paragraph of single posts.
 *
 * @param string $content Post content.
 * @return string
 */
function bgh_insert_in_content_ad( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	if ( 'off' === get_post_meta( get_the_ID(), '_bgh_in_content_ad', true ) ) {
		return $content;
	}

	$code = get_theme_mod( 'bgh_ad_in_article' );
	if ( empty( trim( (string) $code ) ) && ! bgh_show_ad_placeholders() ) {
		return $content;
	}

	$paragraphs = explode( '</p>', $content );
	$total      = count( $paragraphs );
	if ( $total < 6 ) {
		return $content; // Too short for a mid-article ad.
	}

	$insert_after = (int) floor( $total / 2 );

	ob_start();
	bgh_ad_slot( 'bgh_ad_in_article', 'in-article', __( 'In-article ad', 'beauty-glow-hub' ) );
	$ad = ob_get_clean();

	$new = '';
	foreach ( $paragraphs as $i => $paragraph ) {
		$new .= $paragraph;
		if ( '' !== trim( $paragraph ) ) {
			$new .= '</p>';
		}
		if ( $i === $insert_after ) {
			$new .= $ad;
		}
	}
	return $new;
}
add_filter( 'the_content', 'bgh_insert_in_content_ad', 25 );
