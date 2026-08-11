<?php
/**
 * KeepKeep Decorated functions and definitions.
 *
 * @package KeepKeep_Decorated
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Prevent direct access.
}

if ( ! defined( 'KKD_VERSION' ) ) {
	define( 'KKD_VERSION', '1.0.0' );
}
if ( ! defined( 'KKD_DIR' ) ) {
	define( 'KKD_DIR', get_template_directory() );
}
if ( ! defined( 'KKD_URI' ) ) {
	define( 'KKD_URI', get_template_directory_uri() );
}

/**
 * Theme setup: supports, menus, image sizes.
 */
function kkd_setup() {
	load_theme_textdomain( 'keepkeep-decorated', KKD_DIR . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'customize-selective-refresh-widgets' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'wp-block-styles' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/editor.css' );

	add_theme_support(
		'html5',
		array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);

	add_theme_support(
		'custom-logo',
		array(
			'height'               => 64,
			'width'                => 260,
			'flex-height'          => true,
			'flex-width'           => true,
			'unlink-homepage-logo' => false,
		)
	);

	/*
	 * Featured image sizes. Every size is hard-cropped so cards keep a stable
	 * aspect ratio, which is what prevents layout shift (CLS) in the grids.
	 */
	set_post_thumbnail_size( 1200, 750, true );          // 16:10 article header.
	add_image_size( 'kkd-hero', 1360, 900, true );        // Homepage lead story.
	add_image_size( 'kkd-card', 720, 480, true );         // 3:2 grid card.
	add_image_size( 'kkd-card-sm', 480, 320, true );      // 3:2 small card.
	add_image_size( 'kkd-thumb', 200, 200, true );        // 1:1 list thumbnail.

	register_nav_menus(
		array(
			'primary'        => __( 'Primary Menu', 'keepkeep-decorated' ),
			'footer-explore' => __( 'Footer: Explore', 'keepkeep-decorated' ),
			'footer-company' => __( 'Footer: Company', 'keepkeep-decorated' ),
			'footer-legal'   => __( 'Footer: Legal', 'keepkeep-decorated' ),
			'social'         => __( 'Social Links', 'keepkeep-decorated' ),
		)
	);
}
add_action( 'after_setup_theme', 'kkd_setup' );

/**
 * Content width used by oEmbeds and wide images.
 */
function kkd_content_width() {
	$GLOBALS['content_width'] = 720;
}
add_action( 'after_setup_theme', 'kkd_content_width', 0 );

/**
 * Google Fonts stylesheet URL.
 *
 * Return an empty string from the `kkd_fonts_url` filter to drop the remote
 * request entirely (for example after self-hosting the fonts); the CSS falls
 * back to a serif/system stack in that case.
 *
 * @return string
 */
function kkd_fonts_url() {
	$url = add_query_arg(
		array(
			'family'  => implode(
				'&family=',
				array(
					rawurlencode( 'Fraunces:opsz,wght@9..144,400;9..144,600' ),
					rawurlencode( 'Inter:wght@400;500;600' ),
				)
			),
			'display' => 'swap',
		),
		'https://fonts.googleapis.com/css2'
	);

	/**
	 * Filters the webfont stylesheet URL.
	 *
	 * @param string $url Fonts URL. Empty string disables webfonts.
	 */
	return apply_filters( 'kkd_fonts_url', $url );
}

/**
 * Enqueue front-end styles and scripts.
 */
function kkd_assets() {
	$fonts = kkd_fonts_url();
	if ( $fonts ) {
		wp_enqueue_style( 'kkd-fonts', $fonts, array(), null ); // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Remote font API is versioned by URL.
	}

	wp_enqueue_style( 'kkd-base', get_stylesheet_uri(), array(), KKD_VERSION );
	wp_enqueue_style( 'kkd-main', KKD_URI . '/assets/css/main.css', array( 'kkd-base' ), KKD_VERSION );

	wp_enqueue_script( 'kkd-main', KKD_URI . '/assets/js/main.js', array(), KKD_VERSION, true );
	wp_script_add_data( 'kkd-main', 'strategy', 'defer' );
	wp_localize_script(
		'kkd-main',
		'kkdStrings',
		array(
			'openMenu'   => __( 'Open menu', 'keepkeep-decorated' ),
			'closeMenu'  => __( 'Close menu', 'keepkeep-decorated' ),
			'expandKids' => __( 'Show submenu', 'keepkeep-decorated' ),
		)
	);

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'kkd_assets' );

/**
 * Preconnect to the font CDN so the swap happens as early as possible.
 *
 * @param array  $hints         Resource hints.
 * @param string $relation_type Hint relation type.
 * @return array
 */
function kkd_resource_hints( $hints, $relation_type ) {
	if ( 'preconnect' === $relation_type && kkd_fonts_url() ) {
		$hints[] = array( 'href' => 'https://fonts.googleapis.com' );
		$hints[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}
	return $hints;
}
add_filter( 'wp_resource_hints', 'kkd_resource_hints', 10, 2 );

/**
 * Register widget areas.
 */
function kkd_widgets_init() {
	register_sidebar(
		array(
			'name'          => __( 'Article Sidebar', 'keepkeep-decorated' ),
			'id'            => 'sidebar-1',
			'description'   => __( 'Shown beside articles and archives on desktop, and below the content on mobile.', 'keepkeep-decorated' ),
			'before_widget' => '<section id="%1$s" class="kkd-widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="kkd-widget__title">',
			'after_title'   => '</h2>',
		)
	);

	register_sidebar(
		array(
			'name'          => __( 'Footer Widgets', 'keepkeep-decorated' ),
			'id'            => 'footer-widgets',
			'description'   => __( 'Optional widget row shown above the footer columns.', 'keepkeep-decorated' ),
			'before_widget' => '<section id="%1$s" class="kkd-widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="kkd-widget__title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'kkd_widgets_init' );

require KKD_DIR . '/inc/template-functions.php';
require KKD_DIR . '/inc/template-tags.php';
require KKD_DIR . '/inc/breadcrumbs.php';
require KKD_DIR . '/inc/reading-time.php';
require KKD_DIR . '/inc/seo.php';
require KKD_DIR . '/inc/schema.php';
require KKD_DIR . '/inc/customizer.php';
require KKD_DIR . '/inc/ads.php';
require KKD_DIR . '/inc/faq.php';
require KKD_DIR . '/inc/widgets.php';
require KKD_DIR . '/inc/class-kkd-walker-nav.php';

if ( is_admin() ) {
	require KKD_DIR . '/inc/admin-setup.php';
}
