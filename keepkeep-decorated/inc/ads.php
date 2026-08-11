<?php
/**
 * Advertising placements.
 *
 * The theme ships with no publisher ID, no ad code and no placeholder boxes.
 * Every placement is opt-in: paste code into a slot in the Customizer and that
 * slot starts rendering; leave it empty and it outputs nothing at all, so an
 * unmonetised site has no blank gaps and no ad-shaped clutter.
 *
 * Deliberate design constraints, taken from Google's own guidance on ad
 * placement and on making the primary content the focus of the page:
 *
 * - No placement sits above the site logo or above an article headline.
 * - The mid-article placement only appears in genuinely long posts.
 * - Placements are labelled "Advertisement" so nothing masquerades as content.
 * - No sticky, interstitial, pop-up or auto-refreshing formats exist here.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The available ad placements.
 *
 * @return array<string,array{label:string,description:string}>
 */
function kkd_ad_slots() {
	return array(
		'header'         => array(
			'label'       => __( 'Below the header', 'keepkeep-decorated' ),
			'description' => __( 'A single banner under the navigation, above the page content.', 'keepkeep-decorated' ),
		),
		'before_article' => array(
			'label'       => __( 'Before the article', 'keepkeep-decorated' ),
			'description' => __( 'After the article introduction, below the featured image — never above the headline.', 'keepkeep-decorated' ),
		),
		'in_article'     => array(
			'label'       => __( 'Inside the article', 'keepkeep-decorated' ),
			'description' => __( 'Inserted at a paragraph break near the middle of long posts only (10+ paragraphs).', 'keepkeep-decorated' ),
		),
		'after_article'  => array(
			'label'       => __( 'After the article', 'keepkeep-decorated' ),
			'description' => __( 'Below the article body, above the author box.', 'keepkeep-decorated' ),
		),
		'sidebar'        => array(
			'label'       => __( 'Sidebar', 'keepkeep-decorated' ),
			'description' => __( 'Rendered under the sidebar widgets on desktop.', 'keepkeep-decorated' ),
		),
		'before_footer'  => array(
			'label'       => __( 'Before the footer', 'keepkeep-decorated' ),
			'description' => __( 'A last placement after the page content is finished.', 'keepkeep-decorated' ),
		),
	);
}

/**
 * Whether ads may render on the current view at all.
 *
 * @return bool
 */
function kkd_ads_allowed() {
	$allowed = true;

	// Never on error pages, and never where an editor switched them off.
	if ( is_404() || is_search() ) {
		$allowed = false;
	}
	if ( is_singular() && 'yes' === get_post_meta( get_the_ID(), '_kkd_disable_ads', true ) ) {
		$allowed = false;
	}

	/**
	 * Filters whether ad slots may render on this request.
	 *
	 * @param bool $allowed Whether ads are allowed.
	 */
	return (bool) apply_filters( 'kkd_ads_allowed', $allowed );
}

/**
 * The ad code stored for a placement.
 *
 * @param string $slot Slot key.
 * @return string
 */
function kkd_ad_code( $slot ) {
	return trim( (string) get_theme_mod( 'kkd_ad_' . sanitize_key( $slot ), '' ) );
}

/**
 * Whether a placement has code and is allowed to render.
 *
 * @param string $slot Slot key.
 * @return bool
 */
function kkd_has_ad( $slot ) {
	if ( ! kkd_ads_allowed() ) {
		return false;
	}
	if ( '' !== kkd_ad_code( $slot ) ) {
		return true;
	}
	// Outlines are drawn in the Customizer preview only, to show placement.
	return is_customize_preview();
}

/**
 * Render an ad placement.
 *
 * @param string $slot      Slot key.
 * @param string $modifier  Optional CSS modifier.
 */
function kkd_ad_slot( $slot, $modifier = '' ) {
	if ( ! kkd_has_ad( $slot ) ) {
		return;
	}

	$slot  = sanitize_key( $slot );
	$code  = kkd_ad_code( $slot );
	$class = 'kkd-ad';
	if ( $modifier ) {
		$class .= ' kkd-ad--' . sanitize_html_class( $modifier );
	}

	echo '<aside class="' . esc_attr( $class ) . '" aria-label="' . esc_attr__( 'Advertisement', 'keepkeep-decorated' ) . '">';
	echo '<span class="kkd-ad__label">' . esc_html__( 'Advertisement', 'keepkeep-decorated' ) . '</span>';

	if ( '' !== $code ) {
		/*
		 * Trusted markup: only administrators can save theme mods, and ad
		 * network snippets must keep their <ins>/<script> tags intact.
		 */
		echo '<div class="kkd-ad__code">' . do_shortcode( $code ) . '</div>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	} else {
		$slots = kkd_ad_slots();
		echo '<div class="kkd-ad__preview">';
		echo '<strong>' . esc_html( isset( $slots[ $slot ] ) ? $slots[ $slot ]['label'] : $slot ) . '</strong>';
		echo '<span>' . esc_html__( 'Placement preview — visible only while customizing. Paste ad code to activate.', 'keepkeep-decorated' ) . '</span>';
		echo '</div>';
	}

	echo '</aside>';
}

/**
 * Load the AdSense library when the owner has supplied their own publisher ID
 * and opted into Auto ads.
 */
function kkd_adsense_script() {
	if ( ! kkd_ads_allowed() ) {
		return;
	}
	if ( ! get_theme_mod( 'kkd_adsense_auto_ads', false ) ) {
		return;
	}

	$publisher = kkd_sanitize_publisher_id( (string) get_theme_mod( 'kkd_adsense_publisher_id', '' ) );
	if ( '' === $publisher ) {
		return;
	}

	printf(
		'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=%s" crossorigin="anonymous"></script>' . "\n",
		esc_attr( rawurlencode( $publisher ) )
	);
}
add_action( 'wp_head', 'kkd_adsense_script', 30 );

/**
 * Insert the mid-article placement at a paragraph break.
 *
 * Only long posts qualify, so there is always a substantial amount of the
 * writer's own content above and below the placement.
 *
 * @param string $content Post content.
 * @return string
 */
function kkd_insert_in_article_ad( $content ) {
	if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
		return $content;
	}
	if ( ! kkd_has_ad( 'in_article' ) ) {
		return $content;
	}

	$paragraphs = explode( '</p>', $content );
	$total      = count( $paragraphs );

	/**
	 * Filters the minimum paragraph count required for a mid-article placement.
	 *
	 * @param int $minimum Minimum number of paragraphs.
	 */
	$minimum = (int) apply_filters( 'kkd_in_article_ad_min_paragraphs', 10 );

	if ( $total < $minimum ) {
		return $content;
	}

	ob_start();
	kkd_ad_slot( 'in_article', 'in-article' );
	$ad = ob_get_clean();

	$target = (int) floor( $total / 2 );
	$output = '';

	foreach ( $paragraphs as $index => $paragraph ) {
		$output .= $paragraph;
		if ( '' !== trim( $paragraph ) ) {
			$output .= '</p>';
		}
		if ( $index === $target ) {
			$output .= $ad;
		}
	}

	return $output;
}
add_filter( 'the_content', 'kkd_insert_in_article_ad', 25 );
