<?php
/**
 * Lightweight SEO output.
 *
 * Everything in this file is a fallback. The moment Yoast SEO, Rank Math, All in
 * One SEO or The SEO Framework is active, the theme steps aside completely so
 * the page never carries two meta descriptions, two canonicals or two sets of
 * Open Graph tags.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Whether a dedicated SEO plugin is handling metadata.
 *
 * @return bool
 */
function kkd_seo_plugin_active() {
	$active = defined( 'WPSEO_VERSION' )              // Yoast SEO.
		|| defined( 'RANK_MATH_VERSION' )             // Rank Math.
		|| defined( 'AIOSEO_VERSION' )                // All in One SEO.
		|| defined( 'THE_SEO_FRAMEWORK_VERSION' )     // The SEO Framework.
		|| defined( 'SEOPRESS_VERSION' );             // SEOPress.

	/**
	 * Filters SEO plugin detection.
	 *
	 * @param bool $active Whether a plugin owns SEO metadata.
	 */
	return (bool) apply_filters( 'kkd_seo_plugin_active', $active );
}

/**
 * Meta description for the current view.
 *
 * @return string
 */
function kkd_meta_description() {
	$description = '';

	if ( is_front_page() ) {
		$description = get_theme_mod( 'kkd_home_description', '' );
		if ( ! $description ) {
			$description = get_bloginfo( 'description', 'display' );
		}
	} elseif ( is_home() ) {
		$posts_page = (int) get_option( 'page_for_posts' );
		$description = $posts_page ? get_the_excerpt( $posts_page ) : get_bloginfo( 'description', 'display' );
	} elseif ( is_singular() ) {
		$post = get_queried_object();
		if ( $post instanceof WP_Post ) {
			$description = has_excerpt( $post ) ? get_the_excerpt( $post ) : wp_strip_all_tags( strip_shortcodes( $post->post_content ) );
		}
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$description = term_description();
		if ( ! $description ) {
			// Mirror the sentence the archive template shows to readers.
			$description = sprintf(
				/* translators: %s: term name. */
				__( 'Every article filed under %s.', 'keepkeep-decorated' ),
				single_term_title( '', false )
			);
		}
	} elseif ( is_author() ) {
		$description = get_the_author_meta( 'description', get_queried_object_id() );
	}

	$description = wp_strip_all_tags( (string) $description );
	$description = trim( preg_replace( '/\s+/', ' ', $description ) );

	if ( mb_strlen( $description ) > 158 ) {
		$description = mb_substr( $description, 0, 158 );
		$description = preg_replace( '/\s+\S*$/', '', $description ) . '…';
	}

	return $description;
}

/**
 * Representative sharing image for the current view.
 *
 * @return array{url:string,width:int,height:int,alt:string}
 */
function kkd_share_image() {
	$default = array(
		'url'    => KKD_URI . '/assets/images/og-default.jpg',
		'width'  => 1200,
		'height' => 630,
		'alt'    => get_bloginfo( 'name' ),
	);

	if ( ! is_singular() || ! has_post_thumbnail() ) {
		return $default;
	}

	$id  = get_post_thumbnail_id();
	$src = wp_get_attachment_image_src( $id, 'post-thumbnail' );
	if ( ! $src ) {
		return $default;
	}

	return array(
		'url'    => $src[0],
		'width'  => (int) $src[1],
		'height' => (int) $src[2],
		'alt'    => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
	);
}

/**
 * Canonical URL of the current view.
 *
 * @return string
 */
function kkd_canonical_url() {
	$paged = max( 1, (int) get_query_var( 'paged' ) );

	if ( is_front_page() ) {
		return $paged > 1 ? get_pagenum_link( $paged ) : home_url( '/' );
	}
	if ( is_home() ) {
		$posts_page = (int) get_option( 'page_for_posts' );
		$base       = $posts_page ? get_permalink( $posts_page ) : home_url( '/' );
		return $paged > 1 ? get_pagenum_link( $paged ) : $base;
	}
	if ( is_category() || is_tag() || is_tax() ) {
		$link = get_term_link( get_queried_object() );
		if ( is_wp_error( $link ) ) {
			return '';
		}
		return $paged > 1 ? get_pagenum_link( $paged ) : $link;
	}
	if ( is_author() ) {
		$link = get_author_posts_url( get_queried_object_id() );
		return $paged > 1 ? get_pagenum_link( $paged ) : $link;
	}

	return '';
}

/**
 * Output the meta description.
 *
 * Canonical URLs for singular content are left to WordPress core
 * (`rel_canonical`); this only fills the gap on archive views, which core does
 * not handle.
 */
function kkd_meta_tags() {
	if ( kkd_seo_plugin_active() ) {
		return;
	}

	$description = kkd_meta_description();
	if ( $description ) {
		echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
	}

	if ( ! is_singular() ) {
		$canonical = kkd_canonical_url();
		if ( $canonical ) {
			echo '<link rel="canonical" href="' . esc_url( $canonical ) . '">' . "\n";
		}
	}
}
add_action( 'wp_head', 'kkd_meta_tags', 2 );

/**
 * Keep genuinely low-value URLs out of the index.
 *
 * Core already adds `noindex` to search results. The theme adds only the two
 * cases core leaves open — attachment pages and paginated comment views — and
 * never applies a site-wide noindex.
 *
 * @param array $robots Robots directives.
 * @return array
 */
function kkd_robots( $robots ) {
	if ( is_attachment() || ( is_singular() && (int) get_query_var( 'cpage' ) > 1 ) ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}
	return $robots;
}
add_filter( 'wp_robots', 'kkd_robots' );

/**
 * Open Graph and X (Twitter) card metadata.
 */
function kkd_social_meta() {
	if ( kkd_seo_plugin_active() ) {
		return;
	}

	$title       = wp_get_document_title();
	$description = kkd_meta_description();
	$image       = kkd_share_image();
	$canonical   = is_singular() ? get_permalink() : kkd_canonical_url();
	$type        = is_singular( 'post' ) ? 'article' : 'website';

	echo "\n";
	echo '<meta property="og:locale" content="' . esc_attr( str_replace( '-', '_', get_bloginfo( 'language' ) ) ) . '">' . "\n";
	echo '<meta property="og:type" content="' . esc_attr( $type ) . '">' . "\n";
	echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
	echo '<meta property="og:title" content="' . esc_attr( $title ) . '">' . "\n";
	if ( $description ) {
		echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
	}
	if ( $canonical ) {
		echo '<meta property="og:url" content="' . esc_url( $canonical ) . '">' . "\n";
	}
	echo '<meta property="og:image" content="' . esc_url( $image['url'] ) . '">' . "\n";
	echo '<meta property="og:image:width" content="' . esc_attr( (string) $image['width'] ) . '">' . "\n";
	echo '<meta property="og:image:height" content="' . esc_attr( (string) $image['height'] ) . '">' . "\n";
	if ( $image['alt'] ) {
		echo '<meta property="og:image:alt" content="' . esc_attr( $image['alt'] ) . '">' . "\n";
	}

	if ( is_singular( 'post' ) ) {
		echo '<meta property="article:published_time" content="' . esc_attr( get_the_date( DATE_W3C ) ) . '">' . "\n";
		echo '<meta property="article:modified_time" content="' . esc_attr( get_the_modified_date( DATE_W3C ) ) . '">' . "\n";
		$term = kkd_primary_category();
		if ( $term ) {
			echo '<meta property="article:section" content="' . esc_attr( $term->name ) . '">' . "\n";
		}
	}

	echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	$handle = kkd_social_handle( get_theme_mod( 'kkd_social_x', '' ) );
	if ( $handle ) {
		echo '<meta name="twitter:site" content="' . esc_attr( $handle ) . '">' . "\n";
	}
	echo "\n";
}
add_action( 'wp_head', 'kkd_social_meta', 3 );

/**
 * Derive an @handle from a profile URL.
 *
 * @param string $url Profile URL or handle.
 * @return string
 */
function kkd_social_handle( $url ) {
	$url = trim( (string) $url );
	if ( '' === $url ) {
		return '';
	}
	if ( 0 === strpos( $url, '@' ) ) {
		return $url;
	}
	$path = trim( (string) wp_parse_url( $url, PHP_URL_PATH ), '/' );
	if ( '' === $path ) {
		return '';
	}
	return '@' . sanitize_text_field( $path );
}

/**
 * Serve an ads.txt file from the Customizer when no physical file exists.
 *
 * AdSense reads /ads.txt from the domain root. Sites on managed hosting often
 * cannot drop a file there, so the content can be pasted into the Customizer
 * instead. A real file on disk always wins because the web server serves it
 * before WordPress ever runs.
 */
function kkd_serve_ads_txt() {
	$request = isset( $_SERVER['REQUEST_URI'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
	$path    = strtolower( (string) wp_parse_url( $request, PHP_URL_PATH ) );

	if ( '/ads.txt' !== $path && '/app-ads.txt' !== $path ) {
		return;
	}

	$content = trim( (string) get_theme_mod( 'kkd_ads_txt', '' ) );
	if ( '' === $content ) {
		return;
	}

	// WordPress has already queued a 404 for this URL; override it.
	status_header( 200 );
	header( 'Content-Type: text/plain; charset=utf-8' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'X-Robots-Tag: noindex' );
	echo wp_strip_all_tags( $content ) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Plain-text response; tags removed.
	exit;
}
add_action( 'template_redirect', 'kkd_serve_ads_txt' );
