<?php
/**
 * Lightweight SEO: meta description, canonical, Open Graph and Twitter Cards.
 *
 * These are output only when a dedicated SEO plugin (Yoast, Rank Math, SEO
 * Framework, AIOSEO) is NOT active, to avoid duplicate tags.
 *
 * @package Beauty_Glow_Hub
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Detect a popular SEO plugin so we don't duplicate meta tags.
 *
 * @return bool
 */
function bgh_seo_plugin_active() {
	return defined( 'WPSEO_VERSION' )
		|| defined( 'RANK_MATH_VERSION' )
		|| defined( 'THE_SEO_FRAMEWORK_VERSION' )
		|| defined( 'AIOSEO_VERSION' );
}

/**
 * Build a clean meta description for the current view.
 *
 * @return string
 */
function bgh_get_meta_description() {
	$desc = '';

	if ( is_singular() ) {
		$post = get_queried_object();
		if ( has_excerpt( $post ) ) {
			$desc = get_the_excerpt( $post );
		} else {
			$desc = wp_strip_all_tags( strip_shortcodes( $post->post_content ) );
		}
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$desc = term_description();
		if ( ! $desc ) {
			/* translators: %s: term name. */
			$desc = sprintf( __( 'Browse expert %s articles, guides and tips on Beauty Glow Hub.', 'beauty-glow-hub' ), single_term_title( '', false ) );
		}
	} elseif ( is_author() ) {
		$desc = get_the_author_meta( 'description', get_queried_object_id() );
	} elseif ( is_home() || is_front_page() ) {
		$desc = get_bloginfo( 'description' );
	}

	$desc = wp_strip_all_tags( $desc );
	$desc = trim( preg_replace( '/\s+/', ' ', $desc ) );

	if ( mb_strlen( $desc ) > 160 ) {
		$desc = mb_substr( $desc, 0, 157 );
		$desc = preg_replace( '/\s+\S*$/', '', $desc ) . '&hellip;';
	}
	return $desc;
}

/**
 * Determine the representative image URL for social sharing.
 *
 * @return string
 */
function bgh_get_share_image() {
	if ( is_singular() && has_post_thumbnail() ) {
		$src = get_the_post_thumbnail_url( get_the_ID(), 'post-thumbnail' );
		if ( $src ) {
			return $src;
		}
	}
	return BGH_URI . '/assets/images/og-default.jpg';
}

/**
 * Output meta description + canonical.
 */
function bgh_meta_tags() {
	if ( bgh_seo_plugin_active() ) {
		return;
	}
	$desc = bgh_get_meta_description();
	if ( $desc ) {
		echo '<meta name="description" content="' . esc_attr( wp_strip_all_tags( $desc ) ) . '">' . "\n";
	}
	// Robots hints for thin/utility archives.
	if ( is_search() || is_404() || is_paged() && ( is_date() ) ) {
		echo '<meta name="robots" content="noindex,follow">' . "\n";
	}
}
add_action( 'wp_head', 'bgh_meta_tags', 1 );

/**
 * Output Open Graph and Twitter Card tags.
 */
function bgh_social_meta() {
	if ( bgh_seo_plugin_active() ) {
		return;
	}

	$title = wp_get_document_title();
	$desc  = bgh_get_meta_description();
	$image = bgh_get_share_image();
	$url   = is_singular() ? get_permalink() : home_url( add_query_arg( array(), $GLOBALS['wp']->request ) );
	$type  = is_singular( 'post' ) ? 'article' : 'website';

	echo "\n<!-- Beauty Glow Hub social meta -->\n";
	echo '<meta property="og:locale" content="' . esc_attr( get_bloginfo( 'language' ) ) . '">' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $type ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
	if ( $desc ) {
		echo '<meta property="og:description" content="' . esc_attr( wp_strip_all_tags( $desc ) ) . '">' . "\n";
	}
	echo '<meta property="og:url" content="' . esc_url( $url ) . '">' . "\n";
	echo '<meta property="og:image" content="' . esc_url( $image ) . '">' . "\n";

	if ( is_singular( 'post' ) ) {
		echo '<meta property="article:published_time" content="' . esc_attr( get_the_date( DATE_W3C ) ) . '">' . "\n";
		echo '<meta property="article:modified_time" content="' . esc_attr( get_the_modified_date( DATE_W3C ) ) . '">' . "\n";
		echo '<meta property="article:author" content="' . esc_attr( get_the_author() ) . '">' . "\n";
		$cats = get_the_category();
		if ( ! empty( $cats ) ) {
			echo '<meta property="article:section" content="' . esc_attr( $cats[0]->name ) . '">' . "\n";
		}
	}

	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	echo '<meta name="twitter:title" content="' . esc_attr( $title ) . '">' . "\n";
	if ( $desc ) {
		echo '<meta name="twitter:description" content="' . esc_attr( wp_strip_all_tags( $desc ) ) . '">' . "\n";
	}
	echo '<meta name="twitter:image" content="' . esc_url( $image ) . '">' . "\n";
	$twitter = get_theme_mod( 'bgh_social_twitter' );
	if ( $twitter ) {
		$handle = '@' . ltrim( wp_basename( untrailingslashit( $twitter ) ), '@' );
		echo '<meta name="twitter:site" content="' . esc_attr( $handle ) . '">' . "\n";
	}
	echo "<!-- /Beauty Glow Hub social meta -->\n";
}
add_action( 'wp_head', 'bgh_social_meta', 5 );
